import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface RemoveVaultPasswordProps {
  onRemove: (password: string) => void;
  onCancel: () => void;
}

export const RemoveVaultPassword: React.FC<RemoveVaultPasswordProps> = ({
  onRemove,
  onCancel,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleRemove = () => {
    if (!password.trim()) {
      return;
    }

    // Show custom confirmation modal for web compatibility
    setShowConfirmationModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmationModal(false);
    onRemove(password);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="lock-open-variant" size={32} color="#EF4444" />
        <Text style={[styles.title, { color: colors.text }]}>
          Supprimer le mot de passe
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Entrez votre mot de passe actuel pour le supprimer
        </Text>
      </View>

      {/* Warning Banner */}
      <View style={[styles.warningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}>
        <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
        <View style={styles.warningTextContainer}>
          <Text style={[styles.warningTitle, { color: '#EF4444' }]}>
            ⚠️ ATTENTION
          </Text>
          <Text style={[styles.warningText, { color: colors.text }]}>
            Après suppression du mot de passe, votre coffre-fort ne sera plus protégé.
            Toute personne ayant accès à votre appareil pourra y accéder.
          </Text>
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Mot de passe actuel</Text>
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
            styles.removeButton,
            { backgroundColor: '#EF4444' },
            !password && styles.disabledButton,
          ]}
          onPress={handleRemove}
          activeOpacity={0.8}
          disabled={!password}
        >
          <MaterialCommunityIcons name="lock-open-variant" size={20} color="#FFFFFF" />
          <Text style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
            Supprimer le mot de passe
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
              Êtes-vous sûr de vouloir supprimer le mot de passe de ce coffre-fort ?
            </Text>
            
            <Text style={[styles.confirmModalWarning, { color: '#EF4444' }]}>
              Le coffre-fort ne sera plus protégé par mot de passe.
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
                  Supprimer
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
  inputContainer: {
    marginBottom: 32,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
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
  removeButton: {
    shadowColor: '#EF4444',
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
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
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

export default RemoveVaultPassword;
