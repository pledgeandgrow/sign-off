import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Database } from '@/types/database.types';

// Get credentials from expo-constants (loaded from app.config.js)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('Please create .env file with:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
  console.error('Then restart: npx expo start --clear');
  console.warn('⚠️ Running without Supabase - authentication will not work');
} else {
  console.log('✅ Supabase configured:', supabaseUrl);
}

// Create storage adapter that works on web and native
const createStorageAdapter = () => {
  // On web during SSR, return a no-op storage
  const isSSR = Platform.OS === 'web' && typeof (globalThis as any).window === 'undefined';
  
  if (isSSR) {
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
  return AsyncStorage;
};

// Create a dummy client if credentials are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that will fail gracefully
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createStorageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

export const supabase = createSupabaseClient();

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
