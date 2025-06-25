import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

import { Button } from '../ui/Button';
import { Text } from '../ui/Text';

interface NotificationSettingsProps {
  onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  // Use the auth context if needed in the future
  // const { user } = useAuth();

  useEffect(() => {
    checkNotificationStatus();
    // Load user's notification preferences from your backend
    // setEmailNotifications(user?.settings?.emailNotifications ?? true);
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const settings = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(settings.granted);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive important updates.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open app settings
                // Linking.openSettings();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmailNotifications = async (value: boolean) => {
    try {
      setEmailNotifications(value);
      // Update user's email notification preference in your backend
      // await updateUserSettings({ emailNotifications: value });
    } catch (error) {
      console.error('Error updating email notification preference:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      setEmailNotifications(!value); // Revert on error
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingItem}>
        <View>
          <Text style={styles.settingTitle}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Receive important updates and reminders
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={requestNotificationPermission}
          disabled={loading}
          trackColor={{ false: '#e0e0e0', true: '#000' }}
          thumbColor="white"
        />
      </View>

      <View style={styles.settingItem}>
        <View>
          <Text style={styles.settingTitle}>Email Notifications</Text>
          <Text style={styles.settingDescription}>
            Receive email updates about your account
          </Text>
        </View>
        <Switch
          value={emailNotifications}
          onValueChange={toggleEmailNotifications}
          trackColor={{ false: '#e0e0e0', true: '#000' }}
          thumbColor="white"
        />
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          You can manage your notification preferences in your device settings at any time.
        </Text>
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
    flex: 1,
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
  note: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
