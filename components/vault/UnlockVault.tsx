import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface UnlockVaultProps {
  vaultName: string;
  onUnlock: (password: string) => void;
  onCancel: () => void;
  error?: string;
}

export const UnlockVault: React.FC<UnlockVaultProps> = ({
  vaultName,
  onUnlock,
  onCancel,
  error,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = () => {
    if (!password.trim()) {
      return;
    }
    onUnlock(password);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="lock" size={48} color={colors.purple.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Coffre-fort verrouillé
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Entrez le mot de passe pour accéder à "{vaultName}"
        </Text>
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
            autoFocus={true}
            onSubmitEditing={handleUnlock}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
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
            styles.unlockButton,
            { backgroundColor: colors.purple.primary },
            !password && styles.disabledButton,
          ]}
          onPress={handleUnlock}
          activeOpacity={0.8}
          disabled={!password}
        >
          <MaterialCommunityIcons name="lock-open" size={20} color="#FFFFFF" />
          <Text style={[styles.buttonText, { color: '#FFFFFF', marginLeft: 8 }]}>
            Déverrouiller
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
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
  unlockButton: {
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
});

export default UnlockVault;
