import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { VaultProvider } from '../contexts/VaultContext';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { ROUTES } from './routes';
import { ThemeProvider } from '@/contexts/ThemeContext';

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
    ROUTES.SIGN_IN,
    ROUTES.SIGN_UP,
    ROUTES.RECOVERY
  ].includes(pathname as any);

  const isOnboardingRoute = pathname === '/onboarding';

  // Redirect to the appropriate screen based on authentication state
  useEffect(() => {
    if (authLoading || onboardingLoading) return;

    // Not authenticated - redirect to sign in
    if (!user && !isAuthRoute) {
      router.replace(`/${ROUTES.SIGN_IN}` as any);
      return;
    }

    // Authenticated user
    if (user) {
      // Check if user hasn't completed onboarding
      if (!hasCompletedOnboarding) {
        // If not on onboarding route, redirect there
        if (!isOnboardingRoute) {
          console.log('🎓 Redirecting to onboarding...');
          router.replace('/onboarding' as any);
        }
      } else {
        // User has completed onboarding
        if (isAuthRoute) {
          // Coming from auth route (login/signup), go to home
          console.log('✅ Onboarding completed, redirecting to home...');
          router.replace(ROUTES.HOME as any);
        } else if (isOnboardingRoute) {
          // Shouldn't be on onboarding if already completed (unless manually accessed)
          // Let them view it if they want
        }
      }
    }
  }, [user, authLoading, onboardingLoading, hasCompletedOnboarding, isAuthRoute, isOnboardingRoute, router, pathname]);

  // Show a loading indicator while checking auth state
  if (authLoading || onboardingLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'fade',
    }}>
      {/* Public routes */}
      <Stack.Screen 
        name={ROUTES.SIGN_IN} 
        options={{ title: 'Sign In' }} 
      />
      <Stack.Screen 
        name={ROUTES.SIGN_UP} 
        options={{ title: 'Create Account' }} 
      />
      <Stack.Screen 
        name={ROUTES.RECOVERY} 
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
    <ThemeProvider>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <OnboardingProvider>
            <VaultProvider>
              <RootLayoutNav />
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </VaultProvider>
          </OnboardingProvider>
        </AuthProvider>
      </NavThemeProvider>
    </ThemeProvider>
  );
}
