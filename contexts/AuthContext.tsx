import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for auth state
const AUTH_STORAGE_KEY = '@auth_user';

// Hardcoded user data for development
const MOCK_USERS = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    emailVerified: true,
  },
  {
    id: '2',
    email: 'test@example.com',
    password: 'test123',
    firstName: 'Test',
    lastName: 'User',
    emailVerified: false,
  },
];

interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  [key: string]: any;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
  user_metadata?: UserMetadata;
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (jsonValue) {
          const user = JSON.parse(jsonValue);
          setUser(user);
        }
      } catch (error) {
        console.error('Failed to load auth state', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAuthState();
  }, []);

  const router = useRouter();

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user by email and password
      const user = MOCK_USERS.find(
        u => u.email === email && u.password === password
      );
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      
      // Save user to state and storage
      setUser(userData);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      
      // Redirect to home
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Sign in failed:', error);
      throw new Error('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setLoading(true);
      // TODO: Implement actual sign-up with your auth provider
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful registration
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      };
      
      setUser(newUser);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Sign up failed:', error);
      throw new Error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Simulate sign out delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear user from state and storage
      setUser(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      
      // Redirect to sign-in
      router.replace('/(auth)/sign-in' as any);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw new Error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      
      // Check if user exists
      const userExists = MOCK_USERS.some(u => u.email === email);
      
      // Simulate sending reset email (even if user doesn't exist for security)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (userExists) {
        console.log(`Password reset email sent to ${email} (simulated)`);
      } else {
        // Don't reveal that the email doesn't exist for security reasons
        console.log('If an account exists with this email, a password reset link has been sent');
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      throw new Error('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    try {
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user data
      const updatedUser = { ...user, ...updates };
      
      // Save updated user to state and storage
      setUser(updatedUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw new Error('Failed to update profile. Please try again.');
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
