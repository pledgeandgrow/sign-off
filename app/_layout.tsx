import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { VaultProvider } from '../contexts/VaultContext';
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're in the auth group
  const isAuthRoute = [
    ROUTES.SIGN_IN,
    ROUTES.SIGN_UP,
    ROUTES.RECOVERY
  ].includes(pathname as any);

  // Redirect to the appropriate screen based on authentication state
  useEffect(() => {
    if (loading) return;

    if (!user && !isAuthRoute) {
      // Redirect to the sign-in page if user is not authenticated
      router.replace(`/${ROUTES.SIGN_IN}` as any);
    } else if (user && isAuthRoute) {
      // Redirect to the app if user is authenticated and on an auth route
      router.replace(ROUTES.HOME as any);
    }
  }, [user, loading, isAuthRoute, router]);

  // Show a loading indicator while checking auth state
  if (loading) {
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
          <VaultProvider>
            <RootLayoutNav />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </VaultProvider>
        </AuthProvider>
      </NavThemeProvider>
    </ThemeProvider>
  );
}
