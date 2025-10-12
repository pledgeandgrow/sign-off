import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { createUserProfile, updateUserActivity } from '@/lib/services/supabaseService';
import { generateKeyPair, storePrivateKey, storePublicKey, deleteStoredKeys } from '@/lib/encryption';
import type { User as DatabaseUser } from '@/types/database.types';

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
        setUser({
          id: data.id,
          email: data.email,
          full_name: data.full_name || undefined,
          avatar_url: data.avatar_url || undefined,
          public_key: data.public_key || undefined,
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
        throw new Error('Supabase is not configured. Please add credentials to .env.local');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // If profile doesn't exist, create it
        if (profileError && profileError.code === 'PGRST116') {
          console.log('Creating missing user profile...');
          await createUserProfile(
            data.user.id,
            data.user.email || '',
            data.user.user_metadata?.full_name
          );
        }

        await updateUserActivity(data.user.id);
        // Don't navigate here - let the auth state change handler do it
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      throw new Error(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
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
        throw new Error('Supabase is not configured. Please add credentials to .env.local');
      }

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

      if (error) throw error;

      if (data.user) {
        console.log('📝 Generating encryption keys...');
        // Generate encryption keys
        const { publicKey, privateKey } = await generateKeyPair();
        
        console.log('💾 Storing keys securely...');
        // Store keys securely on device
        await storePrivateKey(privateKey);
        await storePublicKey(publicKey);

        console.log('👤 Updating user profile with public key...');
        // User profile is auto-created by database trigger
        // Just update with the generated public key and full name
        await supabase
          .from('users')
          .update({ 
            public_key: publicKey,
            full_name: userData.fullName 
          })
          .eq('id', data.user.id);

        console.log('✅ User registered successfully');
        // Don't navigate here - let the auth state change handler in _layout.tsx handle routing
      }
    } catch (error: any) {
      console.error('Sign up failed:', error);
      throw new Error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
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
      router.replace('/(auth)/sign-in' as any);
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
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedUser: AppUser = {
        id: data.id,
        email: data.email,
        full_name: data.full_name || undefined,
        avatar_url: data.avatar_url || undefined,
        public_key: data.public_key || undefined,
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
      {!loading && children}
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
