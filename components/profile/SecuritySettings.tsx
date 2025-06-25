import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { Button } from '../ui/Button';
import { Text } from '../ui/Text';

interface SecuritySettingsProps {
  onBack: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onBack }) => {
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
          promptMessage: 'Authenticate to enable biometric login',
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
      Alert.alert('Error', 'Failed to update biometric settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setChangePasswordLoading(true);
    try {
      // Implement password reset flow
      Alert.alert(
        'Change Password',
        'A password reset link will be sent to your email address.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Send Link',
            onPress: async () => {
              // await sendPasswordResetEmail(user.email);
              Alert.alert('Success', 'Password reset link sent to your email');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error initiating password reset:', error);
      Alert.alert('Error', 'Failed to send password reset email');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingItem}>
        <View>
          <Text style={styles.settingTitle}>Biometric Authentication</Text>
          <Text style={styles.settingDescription}>
            {biometricAvailable 
              ? 'Use your fingerprint or face to log in quickly' 
              : 'Biometric authentication is not available on this device'}
          </Text>
        </View>
        {biometricAvailable && (
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            disabled={loading || !biometricAvailable}
            trackColor={{ false: '#e0e0e0', true: '#000' }}
            thumbColor="white"
          />
        )}
      </View>

      <View style={styles.settingItem}>
        <View>
          <Text style={styles.settingTitle}>Change Password</Text>
          <Text style={styles.settingDescription}>
            Update your account password
          </Text>
        </View>
        <Button
          variant="outline"
          onPress={handleChangePassword}
          loading={changePasswordLoading}
        >
          Change
        </Button>
      </View>

      <View style={styles.buttonContainer}>
        <Button onPress={onBack} variant="outline">
          Back to Profile
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    maxWidth: '80%',
  },
  buttonContainer: {
    marginTop: 24,
  },
});
