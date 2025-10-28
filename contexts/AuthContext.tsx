import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createUserProfile, updateUserActivity } from '@/lib/services/supabaseService';
import { generateKeyPair, storePrivateKey, storePublicKey, deleteStoredKeys } from '@/lib/encryption';
import { createAuditLog, getRiskLevel } from '@/lib/services/auditLogService';
import type { User as DatabaseUser } from '@/types/database.types';
import { ROUTES } from '@/constants/routes';

interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  public_key?: string;
  account_locked?: boolean;
  locked_until?: string;
  failed_login_attempts?: number;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<AppUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Security constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const router = useRouter();

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Skip auth initialization during SSR
    if (typeof (globalThis as any).window === 'undefined') {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
        setLastActivity(Date.now());
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
        setLastActivity(Date.now());
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session timeout monitoring
  useEffect(() => {
    if (!user) return;

    const checkSessionTimeout = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity >= SESSION_TIMEOUT_MS) {
        console.log('🔒 Session timeout - logging out');
        Alert.alert(
          'Session expirée',
          'Vous avez été déconnecté pour inactivité.',
          [{ text: 'OK', onPress: () => signOut() }]
        );
      } else if (timeSinceLastActivity >= SESSION_TIMEOUT_MS - 60000) {
        // Warn 1 minute before timeout
        console.log('⚠️ Session expiring soon');
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);

    return () => clearInterval(checkSessionTimeout);
  }, [user, lastActivity]);

  // Update activity on user interaction
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => setLastActivity(Date.now());
    
    // Listen for any user interaction
    if (typeof (globalThis as any).window !== 'undefined') {
      const win = (globalThis as any).window;
      win.addEventListener('touchstart', updateActivity);
      win.addEventListener('click', updateActivity);
      win.addEventListener('keydown', updateActivity);
      
      return () => {
        win.removeEventListener('touchstart', updateActivity);
        win.removeEventListener('click', updateActivity);
        win.removeEventListener('keydown', updateActivity);
      };
    }
  }, [user]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        
        // If user profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('User profile not found, attempting to create...');
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser) {
            try {
              await createUserProfile(
                authUser.id,
                authUser.email || '',
                authUser.user_metadata?.full_name
              );
              
              // Retry loading the profile
              const { data: newData, error: retryError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
              
              if (!retryError && newData) {
                const userData = newData as any;
                setUser({
                  id: userData.id,
                  email: userData.email,
                  full_name: userData.full_name || undefined,
                  avatar_url: userData.avatar_url || undefined,
                  public_key: userData.public_key || undefined,
                });
                return;
              }
            } catch (createError) {
              console.error('Failed to create user profile:', createError);
            }
          }
        }
        
        // If we still don't have a profile, sign out
        await supabase.auth.signOut();
        throw error;
      }

      if (data) {
        const userData = data as any;
        setUser({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name || undefined,
          avatar_url: userData.avatar_url || undefined,
          public_key: userData.public_key || undefined,
          account_locked: userData.account_locked || false,
          locked_until: userData.locked_until || undefined,
          failed_login_attempts: userData.failed_login_attempts || 0,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please add credentials to .env file and restart the app.');
      }

      console.log('🔐 Attempting to sign in:', email);

      // Check if account is locked
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, account_locked, locked_until, failed_login_attempts')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        const userRecord = existingUser as any;
        // Check if account is locked
        if (userRecord.account_locked && userRecord.locked_until) {
          const lockedUntil = new Date(userRecord.locked_until);
          if (lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
            throw new Error(`Compte verrouillé. Réessayez dans ${minutesLeft} minute(s).`);
          } else {
            // Unlock account if lockout period has passed
            await supabase
              .from('users')
              .update({ 
                account_locked: false, 
                locked_until: null,
                failed_login_attempts: 0 
              } as any)
              .eq('id', userRecord.id);
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        
        // Increment failed login attempts
        if (existingUser) {
          const userRecord = existingUser as any;
          const newFailedAttempts = (userRecord.failed_login_attempts || 0) + 1;
          const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;
          
          await supabase
            .from('users')
            .update({
              failed_login_attempts: newFailedAttempts,
              account_locked: shouldLock,
              locked_until: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null,
            } as any)
            .eq('id', userRecord.id);

          // Log failed login attempt
          await createAuditLog({
            user_id: userRecord.id,
            action: 'failed_login',
            resource_type: 'session',
            risk_level: 'critical',
            metadata: {
              email,
              attempts: newFailedAttempts,
              locked: shouldLock,
            },
          });

          if (shouldLock) {
            throw new Error(`Trop de tentatives échouées. Compte verrouillé pour ${LOCKOUT_DURATION_MS / 60000} minutes.`);
          }
        }
        
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned from sign in');
      }

      console.log('✅ Sign in successful, user ID:', data.user.id);

      // Reset failed login attempts on successful login
      await supabase
        .from('users')
        .update({ 
          failed_login_attempts: 0,
          account_locked: false,
          locked_until: null,
        } as any)
        .eq('id', data.user.id);

      // Log successful login
      await createAuditLog({
        user_id: data.user.id,
        action: 'login',
        resource_type: 'session',
        risk_level: 'low',
        metadata: { email },
      });

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        console.log('📝 Creating missing user profile...');
        try {
          await createUserProfile(
            data.user.id,
            data.user.email || '',
            data.user.user_metadata?.full_name
          );
          console.log('✅ User profile created');
        } catch (createError) {
          console.error('❌ Failed to create user profile:', createError);
          // Continue anyway - profile will be loaded by loadUserProfile
        }
      } else if (profile) {
        const profileData = profile as any;
        console.log('✅ User profile found:', profileData.email);
      }

      // Update user activity
      try {
        await updateUserActivity(data.user.id);
      } catch (activityError) {
        console.warn('⚠️ Failed to update user activity:', activityError);
      }

      // Auth state change handler will load profile and navigate
    } catch (error: any) {
      console.error('❌ Sign in failed:', error);
      setLoading(false);
      throw new Error(error.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    fullName: string;
  }) => {
    try {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please add credentials to .env file and restart the app.');
      }

      console.log('📝 Attempting to sign up:', userData.email);
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error.message);
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned from sign up');
      }

      console.log('✅ User created in auth, ID:', data.user.id);

      // Generate encryption keys
      console.log('🔐 Generating encryption keys...');
      const { publicKey, privateKey } = await generateKeyPair();
      
      console.log('💾 Storing keys securely...');
      await storePrivateKey(privateKey);
      await storePublicKey(publicKey);

      // Create user profile with public key
      console.log('👤 Creating user profile...');
      try {
        await createUserProfile(
          data.user.id,
          userData.email,
          userData.fullName,
          publicKey
        );
        console.log('✅ User profile created');
      } catch (profileError: any) {
        console.error('❌ Failed to create profile:', profileError);
        
        // Try to update instead (in case trigger created it)
        try {
          console.log('🔄 Attempting to update existing profile...');
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              public_key: publicKey,
              full_name: userData.fullName 
            } as any)
            .eq('id', data.user.id);
          
          if (updateError) {
            console.error('❌ Update failed:', updateError);
          } else {
            console.log('✅ Profile updated');
          }
        } catch (updateError) {
          console.error('❌ Update attempt failed:', updateError);
        }
      }

      console.log('✅ User registered successfully');
      // Auth state change handler will handle navigation
    } catch (error: any) {
      console.error('❌ Sign up failed:', error);
      setLoading(false);
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Log logout before clearing user
      if (user) {
        await createAuditLog({
          user_id: user.id,
          action: 'logout',
          resource_type: 'session',
          risk_level: 'low',
        });
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear stored keys
      await deleteStoredKeys();

      // Clear user state
      setUser(null);

      // Redirect to sign-in
      router.replace(ROUTES.SIGN_IN as any);
    } catch (error: any) {
      console.error('Sign out failed:', error);
      throw new Error(error.message || 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'signoff://reset-password',
      });

      if (error) throw error;

      console.log('✅ Password reset email sent');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      throw new Error(error.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AppUser>): Promise<AppUser> => {
    try {
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
        } as any)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const userData = data as any;
      const updatedUser: AppUser = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || undefined,
        avatar_url: userData.avatar_url || undefined,
        public_key: userData.public_key || undefined,
      };

      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      console.error('Update profile failed:', error);
      throw new Error(error.message || 'Failed to update profile.');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
