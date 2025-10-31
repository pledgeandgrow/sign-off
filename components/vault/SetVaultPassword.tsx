import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SetVaultPasswordProps {
  onSave: (password: string) => void;
  onCancel: () => void;
  hasExistingPassword?: boolean;
}

export const SetVaultPassword: React.FC<SetVaultPasswordProps> = ({
  onSave,
  onCancel,
  hasExistingPassword = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleSave = () => {
    console.log('handleSave called');
    console.log('Password:', password);
    console.log('Confirm Password:', confirmPassword);
    
    if (!password.trim()) {
      console.log('Password is empty');
      Alert.alert('Erreur', 'Veuillez entrer un mot de passe');
      return;
    }

    if (password.length < 6) {
      console.log('Password too short');
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    console.log('Showing confirmation modal');
    // Show custom confirmation modal for web compatibility
    setShowConfirmationModal(true);
  };

  const handleConfirm = () => {
    console.log('Confirm button pressed, calling onSave');
    setShowConfirmationModal(false);
    onSave(password);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="lock-plus" size={32} color={colors.purple.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {hasExistingPassword ? 'Modifier le mot de passe' : 'Définir un mot de passe'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Protégez votre coffre-fort avec un mot de passe
          </Text>
        </View>

      {/* Warning Banner */}
      <View style={[styles.warningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}>
        <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
        <View style={styles.warningTextContainer}>
          <Text style={[styles.warningTitle, { color: '#EF4444' }]}>
            ⚠️ ATTENTION - IMPORTANT
          </Text>
          <Text style={[styles.warningText, { color: colors.text }]}>
            En cas d'oubli de votre mot de passe, il sera{' '}
            <Text style={styles.warningBold}>IMPOSSIBLE de le récupérer</Text> ou d'accéder au coffre-fort.
            {'\n\n'}
            Assurez-vous de bien mémoriser ce mot de passe ou de le stocker dans un endroit sûr.
          </Text>
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
        <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <MaterialCommunityIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Entrez votre mot de passe"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Confirmer le mot de passe</Text>
        <View style={[
          styles.inputWrapper, 
          { 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            borderColor: confirmPassword && password !== confirmPassword ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
            borderWidth: confirmPassword && password !== confirmPassword ? 2 : 1,
          }
        ]}>
          <MaterialCommunityIcons name="lock-check" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Confirmez votre mot de passe"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
            <MaterialCommunityIcons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {confirmPassword && password !== confirmPassword && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
          </View>
        )}
        {confirmPassword && password === confirmPassword && password.length >= 6 && (
          <View style={styles.successContainer}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
            <Text style={styles.successText}>Les mots de passe correspondent</Text>
          </View>
        )}
      </View>

      {/* Password Strength Indicator */}
      {password.length > 0 && (
        <View style={styles.strengthContainer}>
          <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
            Force du mot de passe:
          </Text>
          <View style={styles.strengthBars}>
            <View
              style={[
                styles.strengthBar,
                {
                  backgroundColor:
                    password.length < 6
                      ? '#EF4444'
                      : password.length < 10
                      ? '#F59E0B'
                      : '#10B981',
                },
              ]}
            />
            <View
              style={[
                styles.strengthBar,
                {
                  backgroundColor:
                    password.length < 8
                      ? 'rgba(255, 255, 255, 0.1)'
                      : password.length < 12
                      ? '#F59E0B'
                      : '#10B981',
                },
              ]}
            />
            <View
              style={[
                styles.strengthBar,
                {
                  backgroundColor:
                    password.length < 12
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#10B981',
                },
              ]}
            />
          </View>
          <Text style={[styles.strengthText, { color: colors.textSecondary }]}>
            {password.length < 6
              ? 'Faible'
              : password.length < 10
              ? 'Moyen'
              : 'Fort'}
          </Text>
        </View>
      )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            { backgroundColor: colors.purple.primary },
            (!password || !confirmPassword || password !== confirmPassword || password.length < 6) && styles.disabledButton,
          ]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={!password || !confirmPassword || password !== confirmPassword || password.length < 6}
        >
          <MaterialCommunityIcons name="lock-check" size={20} color="#FFFFFF" />
          <Text style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
            Définir le mot de passe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.confirmModalHeader}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
              <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
                ⚠️ Attention
              </Text>
            </View>
            
            <Text style={[styles.confirmModalText, { color: colors.text }]}>
              Êtes-vous sûr de vouloir définir ce mot de passe ?
            </Text>
            
            <View style={[styles.confirmModalWarning, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}>
              <Text style={[styles.confirmModalWarningText, { color: '#EF4444' }]}>
                ⚠️ EN CAS D'OUBLI, IL SERA IMPOSSIBLE DE RÉCUPÉRER VOTRE MOT DE PASSE OU D'ACCÉDER AU COFFRE-FORT.
              </Text>
            </View>
            
            <Text style={[styles.confirmModalSubtext, { color: colors.textSecondary }]}>
              Assurez-vous de bien mémoriser ce mot de passe ou de le stocker dans un endroit sûr.
            </Text>
            
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.confirmModalButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => setShowConfirmationModal(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmModalButtonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, { backgroundColor: '#EF4444' }]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={[styles.confirmModalButtonText, { color: '#FFFFFF' }]}>
                  Confirmer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
  },
  warningBold: {
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  successText: {
    fontSize: 13,
    color: '#10B981',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  strengthLabel: {
    fontSize: 13,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButton: {
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  confirmModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  confirmModalWarning: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  confirmModalWarningText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmModalSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SetVaultPassword;
