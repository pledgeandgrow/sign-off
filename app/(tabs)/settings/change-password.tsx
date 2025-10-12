import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { StatusBar } from 'expo-status-bar';

export default function ChangePasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string) => {
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

  const handleChangePassword = async () => {
    setError('');

    // Validation
    if (!currentPassword) {
      setError('Veuillez entrer votre mot de passe actuel');
      return;
    }

    if (!newPassword) {
      setError('Veuillez entrer un nouveau mot de passe');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);

    try {
      // Update password in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Success
      Alert.alert(
        'Succès',
        'Votre mot de passe a été modifié avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
      setError(err.message || 'Échec de la modification du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Changer le mot de passe
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { 
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: 'rgba(139, 92, 246, 0.2)'
          }]}>
            <MaterialIcons name="info-outline" size={20} color={colors.purple.primary} />
            <Text style={[styles.infoText, { color: colors.purple.primary }]}>
              Votre nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={[styles.errorContainer, { 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeftColor: colors.error
              }]}>
                <MaterialIcons name="error-outline" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {/* Current Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Mot de passe actuel</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="lock-outline" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholder="Entrez votre mot de passe actuel"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  autoComplete="current-password"
                  placeholderTextColor={colors.textSecondary}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <MaterialIcons
                    name={showCurrentPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Nouveau mot de passe</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="lock" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholder="Entrez un nouveau mot de passe"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoComplete="new-password"
                  placeholderTextColor={colors.textSecondary}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <MaterialIcons
                    name={showNewPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Confirmer le mot de passe</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons 
                  name="lock" 
                  size={20} 
                  color={colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                    color: colors.text
                  }]}
                  placeholder="Confirmez le nouveau mot de passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  placeholderTextColor={colors.textSecondary}
                  editable={!loading}
                  onSubmitEditing={handleChangePassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.purple.primary },
                loading && styles.buttonDisabled
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Modification...' : 'Changer le mot de passe'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
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
    paddingRight: 48,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '500',
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
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
