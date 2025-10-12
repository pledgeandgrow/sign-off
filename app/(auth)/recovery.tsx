import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Logo } from '../../components/ui/Logo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ROUTES } from '../../app/routes';
import { AppLink } from '../../components/ui/AppLink';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';

type RecoveryStep = 'email' | 'confirmation';

export default function Recovery() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<RecoveryStep>('email');
  const router = useRouter();

  const handleRecovery = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await resetPassword(email.trim());
      
      // Move to confirmation step
      setStep('confirmation');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Échec de l\'envoi de l\'email de récupération. Veuillez réessayer.');
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={[styles.logoWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <Logo size={70} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {step === 'email' ? 'Mot de passe oublié ?' : 'Email envoyé !'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 'email' 
                ? 'Entrez votre email pour recevoir un lien de réinitialisation' 
                : 'Vérifiez votre boîte mail'}
            </Text>
          </View>
          
          {step === 'email' ? (
            <View style={styles.formContainer}>
              {error ? (
                <View style={[styles.errorContainer, { 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderLeftColor: colors.error
                }]}>
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
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!loading}
                  onSubmitEditing={handleRecovery}
                  returnKeyType="send"
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.purple.primary }, loading && styles.buttonDisabled]}
                onPress={handleRecovery}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backToLogin}
                onPress={() => router.replace(`/${ROUTES.SIGN_IN}` as any)}
              >
                <Text style={[styles.backToLoginText, { color: colors.textSecondary }]}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.confirmationContainer}>
              <MaterialIcons name="check-circle" size={64} color={colors.purple.primary} style={{ marginBottom: 20 }} />
              <Text style={[styles.confirmationText, { color: colors.text }]}>
                Nous avons envoyé un lien de réinitialisation à <Text style={{ fontWeight: '600' }}>{email}</Text>.
              </Text>
              <Text style={[styles.confirmationSubtext, { color: colors.textSecondary }]}>
                Vérifiez votre boîte mail et suivez les instructions pour réinitialiser votre mot de passe.
              </Text>
              
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.purple.primary }]}
                onPress={() => {
                  setStep('email');
                  setEmail('');
                  setError(null);
                }}
              >
                <Text style={styles.buttonText}>Renvoyer l'email</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.backToLogin}
                onPress={() => router.replace(`/${ROUTES.SIGN_IN}` as any)}
              >
                <Text style={[styles.backToLoginText, { color: colors.textSecondary }]}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  formContainer: {
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
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backToLogin: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmationContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  confirmationSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
});
