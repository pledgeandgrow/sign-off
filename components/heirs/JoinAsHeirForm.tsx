import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface JoinAsHeirFormProps {
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
  onScanQR?: () => void;
}

export const JoinAsHeirForm: React.FC<JoinAsHeirFormProps> = ({
  onSubmit,
  onCancel,
  onScanQR,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un code d\'invitation');
      return;
    }

    // Formater le code (enlever les espaces, mettre en majuscules)
    const formattedCode = code.trim().toUpperCase();

    // Vérifier le format (SIGN-XXXXXX)
    if (!formattedCode.match(/^SIGN-[A-Z0-9]{6}$/)) {
      Alert.alert(
        'Format invalide',
        'Le code doit être au format SIGN-XXXXXX\nExemple: SIGN-AB12CD'
      );
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formattedCode);
    } catch (error) {
      console.error('Error submitting code:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCodeInput = (text: string) => {
    // Enlever les caractères non alphanumériques sauf le tiret
    let formatted = text.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Ajouter automatiquement "SIGN-" si pas présent
    if (formatted && !formatted.startsWith('SIGN-')) {
      if (formatted.startsWith('SIGN')) {
        formatted = 'SIGN-' + formatted.substring(4);
      } else {
        formatted = 'SIGN-' + formatted;
      }
    }

    // Limiter à 11 caractères (SIGN-XXXXXX)
    formatted = formatted.substring(0, 11);

    setCode(formatted);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.purple.primary + '20' }]}>
            <MaterialCommunityIcons name="account-plus" size={24} color={colors.purple.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Rejoindre comme héritier
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Saisissez ou scannez le code
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* QR Scanner Button */}
      {onScanQR && (
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.surface }]}
          onPress={onScanQR}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={48} color={colors.purple.primary} />
          <Text style={[styles.scanButtonText, { color: colors.text }]}>
            Scanner un QR code
          </Text>
          <Text style={[styles.scanButtonSubtext, { color: colors.textSecondary }]}>
            Utilisez votre caméra pour scanner
          </Text>
        </TouchableOpacity>
      )}

      {/* Divider */}
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.textSecondary + '30' }]} />
        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OU</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.textSecondary + '30' }]} />
      </View>

      {/* Manual Code Input */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Code d'invitation
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="ticket" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={code}
            onChangeText={formatCodeInput}
            placeholder="SIGN-XXXXXX"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={11}
          />
        </View>
        <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
          Format: SIGN-AB12CD (11 caractères)
        </Text>
      </View>

      {/* Info Box */}
      <View style={[styles.infoBox, { backgroundColor: colors.purple.primary + '10' }]}>
        <MaterialCommunityIcons name="information" size={20} color={colors.purple.primary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Comment ça marche ?
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Demandez à la personne qui souhaite vous désigner comme héritier de vous envoyer son code d'invitation. Une fois saisi, vous pourrez accepter ou refuser l'invitation.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.surface }]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>
            Annuler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.purple.primary,
              opacity: loading || !code ? 0.5 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading || !code}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Valider</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  scanButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  scanButtonSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
