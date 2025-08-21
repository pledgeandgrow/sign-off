import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert, ScrollView, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SecuritySettingsProps {
  onBack: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onBack }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  // Use the auth context if needed in the future
  // const { user } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    // Load user's biometric preference from your backend or secure storage
    // setBiometricEnabled(user?.settings?.biometricEnabled || false);
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const toggleBiometric = async (value: boolean) => {
    if (!biometricAvailable) return;
    
    setLoading(true);
    try {
      if (value) {
        const { success } = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentifiez-vous pour activer la connexion biométrique',
        });
        if (success) {
          setBiometricEnabled(true);
          // Save to your backend or secure storage
          // await updateUserSettings({ biometricEnabled: true });
        }
      } else {
        setBiometricEnabled(false);
        // Update your backend or secure storage
        // await updateUserSettings({ biometricEnabled: false });
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour des paramètres biométriques');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setChangePasswordLoading(true);
    try {
      // Implement password reset flow
      Alert.alert(
        'Changer le mot de passe',
        'Un lien de réinitialisation sera envoyé à votre adresse email.',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Envoyer le lien',
            onPress: async () => {
              // await sendPasswordResetEmail(user.email);
              Alert.alert('Succès', 'Lien de réinitialisation envoyé à votre email');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error initiating password reset:', error);
      Alert.alert('Erreur', 'Échec de l\'envoi de l\'email de réinitialisation');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sécurité</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Security Options */}
      <View style={styles.content}>
        {/* Biometric Authentication */}
        <View style={[styles.settingCard, { 
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border
        }]}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialIcons name="fingerprint" size={24} color={colors.purple.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Authentification biométrique
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {biometricAvailable 
                  ? 'Utilisez votre empreinte digitale ou votre visage pour vous connecter rapidement' 
                  : 'L\'authentification biométrique n\'est pas disponible sur cet appareil'}
              </Text>
            </View>
          </View>
          {biometricAvailable && (
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              disabled={loading || !biometricAvailable}
              trackColor={{ false: colors.border, true: colors.purple.primary }}
              thumbColor="white"
            />
          )}
        </View>

        {/* Change Password */}
        <View style={[styles.settingCard, { 
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border
        }]}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialIcons name="lock" size={24} color={colors.purple.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Changer le mot de passe
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Mettez à jour le mot de passe de votre compte
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.changeButton, { backgroundColor: colors.purple.primary }]}
            onPress={handleChangePassword}
            disabled={changePasswordLoading}
          >
            {changePasswordLoading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="white" />
            ) : (
              <Text style={styles.changeButtonText}>Changer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Two-Factor Authentication */}
        <View style={[styles.settingCard, { 
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border
        }]}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialIcons name="security" size={24} color={colors.purple.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Authentification à deux facteurs
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.changeButton, { backgroundColor: colors.purple.primary }]}
            onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
          >
            <Text style={styles.changeButtonText}>Activer</Text>
          </TouchableOpacity>
        </View>

        {/* Security Info Card */}
        <View style={[styles.infoCard, { 
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: 'rgba(139, 92, 246, 0.2)'
        }]}>
          <MaterialIcons name="shield" size={20} color={colors.purple.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Vos paramètres de sécurité sont essentiels pour protéger vos données sensibles et votre héritage numérique.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  settingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  changeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
});
