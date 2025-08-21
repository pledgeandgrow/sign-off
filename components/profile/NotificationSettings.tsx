import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, Alert, ScrollView, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import { MaterialIcons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface NotificationSettingsProps {
  onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
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
          'Permission requise',
          'Veuillez activer les notifications dans les paramètres de votre appareil pour recevoir des mises à jour importantes.',
          [
            {
              text: 'Annuler',
              style: 'cancel',
            },
            {
              text: 'Ouvrir les paramètres',
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
      Alert.alert('Erreur', 'Échec de la mise à jour des paramètres de notification');
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
      Alert.alert('Erreur', 'Échec de la mise à jour des paramètres de notification');
      setEmailNotifications(!value); // Revert on error
    }
  };

  const toggleSmsNotifications = async (value: boolean) => {
    try {
      setSmsNotifications(value);
      // Update user's SMS notification preference in your backend
      // await updateUserSettings({ smsNotifications: value });
    } catch (error) {
      console.error('Error updating SMS notification preference:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour des paramètres de notification');
      setSmsNotifications(!value); // Revert on error
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Notification Options */}
      <View style={styles.content}>
        {/* Push Notifications */}
        <View style={[styles.settingCard, { 
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border
        }]}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialIcons name="notifications" size={24} color={colors.purple.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notifications push
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Recevez des mises à jour importantes et des rappels
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={requestNotificationPermission}
            disabled={loading}
            trackColor={{ false: colors.border, true: colors.purple.primary }}
            thumbColor="white"
          />
        </View>

        {/* Email Notifications */}
        <View style={[styles.settingCard, { 
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border
        }]}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialIcons name="email" size={24} color={colors.purple.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notifications par email
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Recevez des mises à jour par email concernant votre compte
              </Text>
            </View>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={toggleEmailNotifications}
            trackColor={{ false: colors.border, true: colors.purple.primary }}
            thumbColor="white"
          />
        </View>

        {/* SMS Notifications */}
        <View style={[styles.settingCard, { 
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border
        }]}>
          <View style={styles.settingHeader}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialIcons name="sms" size={24} color={colors.purple.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Notifications par SMS
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Recevez des alertes importantes par SMS
              </Text>
            </View>
          </View>
          <Switch
            value={smsNotifications}
            onValueChange={toggleSmsNotifications}
            trackColor={{ false: colors.border, true: colors.purple.primary }}
            thumbColor="white"
          />
        </View>

        {/* Notification Types */}
        <View style={[styles.sectionCard, { 
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border
        }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Types de notifications</Text>
          
          <View style={styles.notificationType}>
            <View style={styles.typeInfo}>
              <MaterialIcons name="security" size={20} color={colors.purple.primary} />
              <Text style={[styles.typeText, { color: colors.text }]}>Alertes de sécurité</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.purple.primary }}
              thumbColor="white"
            />
          </View>

          <View style={styles.notificationType}>
            <View style={styles.typeInfo}>
              <MaterialIcons name="schedule" size={20} color={colors.purple.primary} />
              <Text style={[styles.typeText, { color: colors.text }]}>Rappels et échéances</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.purple.primary }}
              thumbColor="white"
            />
          </View>

          <View style={styles.notificationType}>
            <View style={styles.typeInfo}>
              <MaterialIcons name="update" size={20} color={colors.purple.primary} />
              <Text style={[styles.typeText, { color: colors.text }]}>Mises à jour du système</Text>
            </View>
            <Switch
              value={false}
              trackColor={{ false: colors.border, true: colors.purple.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { 
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderColor: 'rgba(139, 92, 246, 0.2)'
        }]}>
          <MaterialIcons name="info" size={20} color={colors.purple.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Vous pouvez gérer vos préférences de notification dans les paramètres de votre appareil à tout moment.
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
    backgroundColor: 'transparent', // Ensure it's transparent to allow background color to show
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40, // Adjust as needed for spacing
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
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  notificationType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 16,
    marginLeft: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
