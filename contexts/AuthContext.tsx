import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createUserProfile, updateUserActivity } from '@/lib/services/supabaseService';
import { generateKeyPair, storePrivateKey, storePublicKey, deleteStoredKeys } from '@/lib/encryption';
import type { User as DatabaseUser } from '@/types/database.types';
import { ROUTES } from '@/constants/routes';

interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  public_key?: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
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
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned from sign in');
      }

      console.log('✅ Sign in successful, user ID:', data.user.id);

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
