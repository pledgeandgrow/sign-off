import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateTOTPSecret,
  generateBackupCodes,
  enable2FA,
  generateQRCodeData,
  verifyTOTP,
} from '@/lib/services/twoFactorService';
import { createAuditLog } from '@/lib/services/auditLogService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TwoFactorSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const [step, setStep] = useState<'generate' | 'verify' | 'backup' | 'complete'>('generate');
  const [secret, setSecret] = useState('');
  const [qrData, setQrData] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      generateSecretAndQR();
    }
  }, [user]);

  const generateSecretAndQR = async () => {
    try {
      setIsLoading(true);
      const newSecret = await generateTOTPSecret();
      const codes = await generateBackupCodes();
      
      setSecret(newSecret);
      setBackupCodes(codes);
      
      if (user?.email) {
        const qr = generateQRCodeData(newSecret, user.email);
        setQrData(qr);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      Alert.alert('Erreur', 'Impossible de générer le secret 2FA');
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Verify the code matches
      const { valid } = await verifyTOTP(user.id, verificationCode);

      if (!valid) {
        setError('Code invalide. Veuillez réessayer.');
        setIsLoading(false);
        return;
      }

      // Enable 2FA
      const result = await enable2FA(user.id, secret, backupCodes);

      if (!result.success) {
        Alert.alert('Erreur', result.error || 'Impossible d\'activer 2FA');
        setIsLoading(false);
        return;
      }

      // Log the action
      await createAuditLog({
        user_id: user.id,
        action: '2fa_enable',
        resource_type: '2fa',
        resource_id: user.id,
        risk_level: 'medium',
        metadata: { method: 'totp' },
      });

      setIsLoading(false);
      setStep('backup');
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      Alert.alert('Erreur', 'Échec de la vérification');
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    Alert.alert(
      'Authentification à deux facteurs activée',
      'Votre compte est maintenant protégé par 2FA',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copié', 'Code copié dans le presse-papiers');
  };

  const copyAllBackupCodes = () => {
    const allCodes = backupCodes.join('\n');
    Clipboard.setString(allCodes);
    Alert.alert('Copié', 'Tous les codes de secours ont été copiés');
  };

  if (isLoading && step === 'generate') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Configuration 2FA', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Génération des clés de sécurité...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Configuration 2FA', headerShown: true }} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, step === 'generate' && styles.stepDotActive, { backgroundColor: colors.purple.primary }]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <View style={[styles.stepDot, step === 'verify' && styles.stepDotActive, { backgroundColor: step === 'verify' || step === 'backup' || step === 'complete' ? colors.purple.primary : colors.border }]}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            <View style={[styles.stepDot, step === 'backup' && styles.stepDotActive, { backgroundColor: step === 'backup' || step === 'complete' ? colors.purple.primary : colors.border }]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
          </View>
        </View>

        {/* Step 1: Scan QR Code */}
        {step === 'generate' && (
          <View style={styles.stepContent}>
            <MaterialCommunityIcons name="qrcode-scan" size={64} color={colors.purple.primary} style={styles.icon} />
            <Text style={[styles.title, { color: colors.text }]}>Scannez le QR Code</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Utilisez une application d'authentification comme Google Authenticator, Authy ou Microsoft Authenticator
            </Text>

            {qrData && (
              <View style={[styles.qrContainer, { backgroundColor: 'white' }]}>
                <QRCode value={qrData} size={200} />
              </View>
            )}

            <View style={[styles.secretContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.secretLabel, { color: colors.textSecondary }]}>
                Ou entrez manuellement cette clé :
              </Text>
              <TouchableOpacity onPress={() => copyToClipboard(secret)} style={styles.secretRow}>
                <Text style={[styles.secretText, { color: colors.text }]}>{secret}</Text>
                <MaterialCommunityIcons name="content-copy" size={20} color={colors.purple.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.purple.primary }]}
              onPress={() => setStep('verify')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Continuer</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <View style={styles.stepContent}>
            <MaterialCommunityIcons name="shield-check" size={64} color={colors.purple.primary} style={styles.icon} />
            <Text style={[styles.title, { color: colors.text }]}>Vérifiez votre code</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Entrez le code à 6 chiffres généré par votre application d'authentification
            </Text>

            <TextInput
              style={[styles.codeInput, { 
                backgroundColor: colors.cardBackground, 
                borderColor: error ? colors.red.primary : colors.border,
                color: colors.text 
              }]}
              value={verificationCode}
              onChangeText={(text) => {
                setVerificationCode(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {error && (
              <Text style={[styles.errorText, { color: colors.red.primary }]}>{error}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.purple.primary, opacity: verificationCode.length === 6 ? 1 : 0.5 }]}
              onPress={handleVerifyCode}
              disabled={verificationCode.length !== 6 || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Vérifier</Text>
                  <MaterialCommunityIcons name="check" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('generate')} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} />
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && (
          <View style={styles.stepContent}>
            <MaterialCommunityIcons name="key-variant" size={64} color={colors.purple.primary} style={styles.icon} />
            <Text style={[styles.title, { color: colors.text }]}>Codes de secours</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Sauvegardez ces codes en lieu sûr. Vous pouvez les utiliser si vous perdez l'accès à votre application d'authentification.
            </Text>

            <View style={[styles.warningCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <MaterialCommunityIcons name="alert" size={24} color={colors.red.primary} />
              <Text style={[styles.warningText, { color: colors.red.primary }]}>
                Chaque code ne peut être utilisé qu'une seule fois
              </Text>
            </View>

            <View style={[styles.codesContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {backupCodes.map((code, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.codeRow}
                  onPress={() => copyToClipboard(code)}
                >
                  <Text style={[styles.codeNumber, { color: colors.textSecondary }]}>
                    {(index + 1).toString().padStart(2, '0')}.
                  </Text>
                  <Text style={[styles.codeText, { color: colors.text }]}>{code}</Text>
                  <MaterialCommunityIcons name="content-copy" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.copyAllButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={copyAllBackupCodes}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color={colors.purple.primary} />
              <Text style={[styles.copyAllText, { color: colors.purple.primary }]}>
                Copier tous les codes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.purple.primary }]}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Terminer</Text>
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  stepIndicator: {
    padding: 20,
    paddingBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    transform: [{ scale: 1.1 }],
  },
  stepNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stepLine: {
    width: 60,
    height: 2,
  },
  stepContent: {
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  qrContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  secretContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 30,
  },
  secretLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secretText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  codeInput: {
    width: '100%',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    letterSpacing: 8,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  codesContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  codeNumber: {
    fontSize: 12,
    width: 30,
  },
  codeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    gap: 8,
    marginBottom: 10,
  },
  copyAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
