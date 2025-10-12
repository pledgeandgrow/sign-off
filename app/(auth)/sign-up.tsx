import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Logo } from '../../components/ui/Logo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppLink } from '../../components/ui/AppLink';
import { ROUTES } from '../../app/routes';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const router = useRouter();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber,
      message: !hasMinLength ? 'Le mot de passe doit contenir au moins 8 caractères' :
               !hasUpperCase ? 'Le mot de passe doit contenir au moins une majuscule' :
               !hasLowerCase ? 'Le mot de passe doit contenir au moins une minuscule' :
               !hasNumber ? 'Le mot de passe doit contenir au moins un chiffre' : ''
    };
  };

  const handleSignUp = async () => {
    const { fullName, email, password, confirmPassword } = formData;
    
    // Validation
    if (!fullName.trim()) {
      setError('Veuillez entrer votre nom complet');
      return;
    }
    
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    if (!password) {
      setError('Veuillez entrer un mot de passe');
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      
      // Show success message
      Alert.alert(
        'Compte créé!',
        'Votre compte a été créé avec succès. Vérifiez votre email pour confirmer votre adresse.',
        [{ text: 'OK', onPress: () => router.replace(ROUTES.HOME as any) }]
      );
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Échec de la création du compte. Veuillez réessayer.');
    } finally {
      setLoading(false);
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Logo size={70} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Créer un compte</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Rejoignez-nous pour sécuriser votre héritage numérique
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
                  <MaterialIcons name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    placeholder="Nom complet"
                    value={formData.fullName}
                    onChangeText={(text) => handleChange('fullName', text)}
                    autoCapitalize="words"
                    placeholderTextColor={colors.textSecondary}
                    editable={!loading}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    placeholder="Adresse email"
                    value={formData.email}
                    onChangeText={(text) => handleChange('email', text)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholderTextColor={colors.textSecondary}
                    editable={!loading}
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
                    placeholder="Mot de passe"
                    value={formData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    secureTextEntry={!isPasswordVisible}
                    autoComplete="new-password"
                    placeholderTextColor={colors.textSecondary}
                    editable={!loading}
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
                
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput, { 
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    placeholder="Confirmer le mot de passe"
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleChange('confirmPassword', text)}
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoComplete="new-password"
                    placeholderTextColor={colors.textSecondary}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  >
                    <MaterialIcons
                      name={isConfirmPasswordVisible ? "visibility" : "visibility-off"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    { backgroundColor: colors.purple.primary },
                    loading && styles.buttonDisabled
                  ]}
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.buttonText}>Création du compte...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Créer le compte</Text>
                  )}
                </TouchableOpacity>
                
                <View style={[styles.termsContainer, { 
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: colors.border
                }]}>
                  <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                    En créant un compte, vous acceptez nos{' '}
                    <Text style={[styles.link, { color: colors.purple.primary }]}>Conditions d'utilisation</Text> et{' '}
                    <Text style={[styles.link, { color: colors.purple.primary }]}>Politique de confidentialité</Text>
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Footer Section */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Vous avez déjà un compte ?{' '}
                <AppLink href={`/${ROUTES.SIGN_IN}`}>
                  <Text style={[styles.footerLink, { color: colors.purple.primary }]}>Se connecter</Text>
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
    paddingBottom: 20,
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 28,
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
    flex: 1,
    paddingVertical: 10,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  nameInputContainer: {
    width: '48%',
    marginBottom: 0,
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
  termsContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  footerText: {
    fontSize: 15,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
