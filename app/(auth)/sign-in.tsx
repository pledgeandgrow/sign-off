import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Logo } from '../../components/ui/Logo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { AppLink } from '../../components/ui/AppLink';
import { ROUTES } from '../../app/routes';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }
    
    // In development mode, password is optional
    if (!__DEV__ && !password) {
      setError('Veuillez saisir votre mot de passe');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      await signIn(email, password || 'dev-password');
      router.replace(ROUTES.HOME as any);
      // Navigation is handled by the auth context
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor={colors.background} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Logo size={80} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Bon retour</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Connectez-vous pour accéder à votre héritage numérique
                </Text>
              </View>
            </View>
            
            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {error ? (
                  <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeftColor: colors.error }]}>
                    <MaterialIcons name="error-outline" size={20} color={colors.error} />
                    <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
                  </View>
                ) : null}
                
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    placeholder="Adresse email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholderTextColor={colors.textSecondary}
                    editable={!isLoading}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput, { 
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    placeholder={__DEV__ ? "Mot de passe (optionnel en mode dev)" : "Mot de passe"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoComplete="current-password"
                    placeholderTextColor={colors.textSecondary}
                    editable={!isLoading}
                    onSubmitEditing={handleSignIn}
                    returnKeyType="go"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <MaterialIcons
                      name={isPasswordVisible ? "visibility" : "visibility-off"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                
                {__DEV__ && (
                  <View style={[styles.devModeContainer, { 
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderColor: 'rgba(139, 92, 246, 0.2)'
                  }]}>
                    <MaterialIcons name="developer-mode" size={16} color={colors.purple.primary} />
                    <Text style={[styles.devModeText, { color: colors.purple.primary }]}>
                      Mode développement : Email uniquement requis
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    { backgroundColor: colors.purple.primary },
                    (isLoading || !email || (__DEV__ ? false : !password)) && styles.buttonDisabled
                  ]}
                  onPress={handleSignIn}
                  disabled={isLoading || !email || (__DEV__ ? false : !password)}
                  activeOpacity={0.9}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.buttonText}>Connexion...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Se connecter</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.forgotPassword}>
                  <AppLink href={`/${ROUTES.RECOVERY}`}>
                    <Text style={[styles.forgotPasswordText, { color: colors.textSecondary }]}>
                      Mot de passe oublié ?
                    </Text>
                  </AppLink>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Footer Section */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Vous n'avez pas de compte ?{' '}
                <AppLink href={`/${ROUTES.SIGN_UP}`}>
                  <Text style={[styles.footerLink, { color: colors.purple.primary }]}>En créer un</Text>
                </AppLink>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  formContainer: {
    flex: 0.5,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  error: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    borderWidth: 1.5,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6B7280',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    minHeight: 60,
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
  devModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  devModeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
});
