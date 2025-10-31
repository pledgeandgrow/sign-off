import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { VaultProvider } from '../contexts/VaultContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { HeirProvider } from '@/contexts/HeirContext';
import { ROUTES } from '@/constants/routes';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineNotice } from '@/components/OfflineNotice';

// Loading component shown during auth state check
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

// This component handles the authentication state and routing
function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're in the auth group
  const isAuthRoute = [
    '/sign-in',
    '/sign-up',
    '/recovery',
    '/(auth)/sign-in',
    '/(auth)/sign-up',
    '/(auth)/recovery'
  ].includes(pathname);

  const isOnboardingRoute = pathname === '/onboarding';
  
  // Debug logging
  console.log('🔍 Current pathname:', pathname);
  console.log('🔍 Is auth route?', isAuthRoute);
  console.log('🔍 User:', user ? 'logged in' : 'not logged in');

  // Redirect to the appropriate screen based on authentication state
  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    // Not authenticated - only redirect if trying to access protected routes
    if (!user && !isAuthRoute && !isOnboardingRoute) {
      console.log('🔒 Not authenticated, redirecting to sign-in');
      router.replace(ROUTES.SIGN_IN as any);
      return;
    }

    // Authenticated user
    if (user) {
      // Check if user hasn't completed onboarding
      if (!hasCompletedOnboarding) {
        // If not on onboarding route, redirect there
        if (!isOnboardingRoute && !isAuthRoute) {
          console.log('🎓 Redirecting to onboarding...');
          router.replace('/onboarding' as any);
        }
      } else {
        // User has completed onboarding
        if (isAuthRoute) {
          // Coming from auth route (login/signup), go to home
          console.log('✅ Already logged in, redirecting to home...');
          router.replace(ROUTES.HOME as any);
        }
      }
    }
  }, [user, authLoading, onboardingLoading, hasCompletedOnboarding, isAuthRoute, isOnboardingRoute, router, pathname]);

  // Show a loading indicator while checking auth state
  if (authLoading || onboardingLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <OfflineNotice />
      <Stack screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
        {/* Public routes */}
        <Stack.Screen 
          name="(auth)/sign-in" 
          options={{ title: 'Sign In' }} 
        />
        <Stack.Screen 
          name="(auth)/sign-up" 
          options={{ title: 'Create Account' }} 
        />
        <Stack.Screen 
          name="(auth)/recovery" 
          options={{ title: 'Password Recovery' }} 
        />
        
        {/* Onboarding route */}
        <Stack.Screen 
          name="onboarding" 
          options={{ title: 'Welcome' }} 
        />
        
        {/* Protected routes */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Catch-all route */}
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Add other custom fonts here
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthProvider>
            <OnboardingProvider>
              <HeirProvider>
                <VaultProvider>
                  <RootLayoutNav />
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                </VaultProvider>
              </HeirProvider>
            </OnboardingProvider>
          </AuthProvider>
        </NavThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
