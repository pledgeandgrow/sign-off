import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getPrivateKey, getPublicKey } from '@/lib/encryption';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export default function PrivateKeyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const router = useRouter();

  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    loadPublicKey();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const loadPublicKey = async () => {
    try {
      const key = await getPublicKey();
      setPublicKey(key);
    } catch (error) {
      console.error('Error loading public key:', error);
    }
  };

  const handleRevealKey = async () => {
    setLoading(true);

    try {
      // Require biometric authentication if available
      if (biometricAvailable) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentifiez-vous pour voir votre clé privée',
          fallbackLabel: 'Utiliser le code',
          cancelLabel: 'Annuler',
        });

        if (!result.success) {
          Alert.alert('Authentification échouée', 'Vous devez vous authentifier pour voir votre clé privée');
          setLoading(false);
          return;
        }
      } else {
        // Show warning if no biometric
        Alert.alert(
          'Attention',
          'Votre clé privée est très sensible. Ne la partagez jamais avec personne.',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => setLoading(false) },
            { text: 'Continuer', onPress: () => revealKey() }
          ]
        );
        return;
      }

      await revealKey();
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Erreur', 'Impossible d\'authentifier');
    } finally {
      setLoading(false);
    }
  };

  const revealKey = async () => {
    try {
      const key = await getPrivateKey();
      if (key) {
        setPrivateKey(key);
        setIsRevealed(true);
      } else {
        Alert.alert('Erreur', 'Clé privée introuvable');
      }
    } catch (error) {
      console.error('Error loading private key:', error);
      Alert.alert('Erreur', 'Impossible de charger la clé privée');
    }
  };

  const handleCopyPrivateKey = async () => {
    if (privateKey) {
      await Clipboard.setStringAsync(privateKey);
      Alert.alert('Copié', 'Clé privée copiée dans le presse-papiers');
    }
  };

  const handleCopyPublicKey = async () => {
    if (publicKey) {
      await Clipboard.setStringAsync(publicKey);
      Alert.alert('Copié', 'Clé publique copiée dans le presse-papiers');
    }
  };

  const handleHideKey = () => {
    setIsRevealed(false);
    setPrivateKey(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
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
            Clés de chiffrement
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Warning Card */}
        <View style={[styles.warningCard, { 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        }]}>
          <MaterialIcons name="warning" size={24} color={colors.error} />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: colors.error }]}>
              Attention - Très Important
            </Text>
            <Text style={[styles.warningText, { color: colors.error }]}>
              Votre clé privée permet de déchiffrer toutes vos données. Ne la partagez JAMAIS avec personne et conservez-la en lieu sûr.
            </Text>
          </View>
        </View>

        {/* Public Key Section */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="vpn-key" size={24} color={colors.purple.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Clé Publique
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Votre clé publique peut être partagée en toute sécurité. Elle est utilisée pour chiffrer les données.
          </Text>
          
          {publicKey ? (
            <>
              <View style={[styles.keyContainer, { 
                backgroundColor: colors.background,
                borderColor: colors.border
              }]}>
                <Text style={[styles.keyText, { color: colors.text }]} selectable>
                  {publicKey}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: colors.purple.primary }]}
                onPress={handleCopyPublicKey}
              >
                <MaterialIcons name="content-copy" size={20} color="#FFFFFF" />
                <Text style={styles.copyButtonText}>Copier la clé publique</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.noKeyText, { color: colors.textSecondary }]}>
              Clé publique introuvable
            </Text>
          )}
        </View>

        {/* Private Key Section */}
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="lock" size={24} color={colors.error} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Clé Privée
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Votre clé privée est ultra-sensible. Elle permet de déchiffrer toutes vos données chiffrées.
          </Text>
          
          {!isRevealed ? (
            <>
              <View style={[styles.hiddenKeyContainer, { 
                backgroundColor: colors.background,
                borderColor: colors.border
              }]}>
                <MaterialIcons name="visibility-off" size={32} color={colors.textSecondary} />
                <Text style={[styles.hiddenKeyText, { color: colors.textSecondary }]}>
                  Clé privée masquée
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.revealButton, { 
                  backgroundColor: colors.error,
                  opacity: loading ? 0.6 : 1
                }]}
                onPress={handleRevealKey}
                disabled={loading}
              >
                <MaterialIcons name="visibility" size={20} color="#FFFFFF" />
                <Text style={styles.revealButtonText}>
                  {loading ? 'Chargement...' : 'Révéler la clé privée'}
                </Text>
              </TouchableOpacity>
              {biometricAvailable && (
                <View style={[styles.biometricInfo, { 
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  borderColor: 'rgba(139, 92, 246, 0.2)'
                }]}>
                  <MaterialIcons name="fingerprint" size={16} color={colors.purple.primary} />
                  <Text style={[styles.biometricText, { color: colors.purple.primary }]}>
                    Authentification biométrique requise
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={[styles.keyContainer, { 
                backgroundColor: colors.background,
                borderColor: colors.error
              }]}>
                <Text style={[styles.keyText, { color: colors.text }]} selectable>
                  {privateKey}
                </Text>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.copyButton, styles.halfButton, { backgroundColor: colors.purple.primary }]}
                  onPress={handleCopyPrivateKey}
                >
                  <MaterialIcons name="content-copy" size={20} color="#FFFFFF" />
                  <Text style={styles.copyButtonText}>Copier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.hideButton, styles.halfButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  onPress={handleHideKey}
                >
                  <MaterialIcons name="visibility-off" size={20} color={colors.text} />
                  <Text style={[styles.hideButtonText, { color: colors.text }]}>Masquer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <MaterialIcons name="info-outline" size={20} color={colors.purple.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.purple.primary }]}>
              À propos du chiffrement
            </Text>
            <Text style={[styles.infoText, { color: colors.purple.primary }]}>
              • Vos données sont chiffrées avec AES-256-CBC{'\n'}
              • Seule votre clé privée peut les déchiffrer{'\n'}
              • Conservez une copie sécurisée de votre clé{'\n'}
              • Si vous perdez votre clé, vos données sont perdues
            </Text>
          </View>
        </View>
      </ScrollView>
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
  warningCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  keyContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  keyText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  hiddenKeyContainer: {
    padding: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hiddenKeyText: {
    fontSize: 14,
    marginTop: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  revealButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  biometricText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
  },
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  hideButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  noKeyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  infoSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
