import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { SignOffSettings as SignOffSettingsType } from '@/types/signOff';
import { useTheme } from '@/contexts/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

interface SignOffSettingsProps {
  initialSettings?: Partial<SignOffSettingsType>;
  onSave?: (settings: SignOffSettingsType) => void;
  onCancel?: () => void;
}

export const SignOffSettings: React.FC<SignOffSettingsProps> = ({
  initialSettings = {},
  onSave,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<SignOffSettingsType>({
    inactivityCheck: {
      enabled: true,
      daysOfInactivity: 90,
      checkFrequency: 'weekly',
    },
    notifications: {
      email: {
        enabled: true,
        recipients: [],
        message: 'I wanted to let you know about my digital legacy...',
      },
      sms: {
        enabled: false,
        phoneNumbers: [],
        message: 'Important: Please check your email regarding my digital legacy.',
      },
      socialMedia: {
        enabled: false,
        platforms: [
          { name: 'Facebook', enabled: false, message: '' },
          { name: 'Twitter', enabled: false, message: '' },
          { name: 'LinkedIn', enabled: false, message: '' },
        ],
      },
    },
    digitalLegacy: {
      dataHandling: 'transfer',
      recipients: [],
      messageToHeirs: '',
    },
    posthumousMessages: [],
    accountActions: {
      closeAccounts: false,
      accountsToClose: [],
      donation: {
        enabled: false,
        organizations: [],
      },
    },
    verification: {
      required: true,
      method: 'trustedContact',
      trustedContacts: [],
      verificationWindowDays: 7,
    },
    legalDocuments: {
      willAttached: false,
      poaAttached: false,
      livingWillAttached: false,
    },
    lastUpdated: new Date().toISOString(),
    ...initialSettings,
  });

  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString(),
    };
    onSave?.(updatedSettings);
  };

  const toggleInactivityCheck = (value: boolean) => {
    setSettings(prev => ({
      ...prev,
      inactivityCheck: {
        ...prev.inactivityCheck,
        enabled: value,
      },
    }));
  };

  const updateInactivityDays = (days: string) => {
    const daysNum = parseInt(days, 10) || 90;
    setSettings(prev => ({
      ...prev,
      inactivityCheck: {
        ...prev.inactivityCheck,
        daysOfInactivity: daysNum,
      },
    }));
  };

  const toggleNotificationMethod = (method: 'email' | 'sms' | 'socialMedia', value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [method]: {
          ...prev.notifications[method],
          enabled: value,
        },
      },
    }));
  };

  const updateRecipients = (type: 'email' | 'sms', recipients: string) => {
    const recipientList = recipients.split(',').map(r => r.trim()).filter(Boolean);
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: {
          ...prev.notifications[type],
          recipients: type === 'email' ? recipientList : [],
          phoneNumbers: type === 'sms' ? recipientList : [],
        },
      },
    }));
  };

  const toggleSocialMedia = (platformName: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        socialMedia: {
          ...prev.notifications.socialMedia,
          platforms: prev.notifications.socialMedia.platforms.map(platform => 
            platform.name === platformName 
              ? { ...platform, enabled: value } 
             : platform
          ),
        },
      },
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inactivity Detection</Text>
          <Switch
            value={settings.inactivityCheck.enabled}
            onValueChange={toggleInactivityCheck}
            trackColor={{ false: '#767577', true: theme.colors.primary }}
          />
        </View>
        
        {settings.inactivityCheck.enabled && (
          <View style={styles.settingItem}>
            <Text>Days of inactivity before activation:</Text>
            <TextInput
              style={styles.input}
              value={settings.inactivityCheck.daysOfInactivity.toString()}
              onChangeText={updateInactivityDays}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Methods</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text>Email Notifications</Text>
            <Switch
              value={settings.notifications.email.enabled}
              onValueChange={(value) => toggleNotificationMethod('email', value)}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>
          {settings.notifications.email.enabled && (
            <View style={styles.nestedSetting}>
              <Text>Recipients (comma-separated emails):</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.notifications.email.recipients.join(', ')}
                onChangeText={(value) => updateRecipients('email', value)}
                multiline
              />
              <Text>Message:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.notifications.email.message}
                onChangeText={(value) => setSettings(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    email: { ...prev.notifications.email, message: value }
                  }
                }))}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text>SMS Notifications</Text>
            <Switch
              value={settings.notifications.sms.enabled}
              onValueChange={(value) => toggleNotificationMethod('sms', value)}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>
          {settings.notifications.sms.enabled && (
            <View style={styles.nestedSetting}>
              <Text>Phone Numbers (comma-separated):</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={settings.notifications.sms.phoneNumbers.join(', ')}
                onChangeText={(value) => updateRecipients('sms', value)}
                keyboardType="phone-pad"
                multiline
              />
            </View>
          )}
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text>Social Media</Text>
            <Switch
              value={settings.notifications.socialMedia.enabled}
              onValueChange={(value) => toggleNotificationMethod('socialMedia', value)}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
            />
          </View>
          {settings.notifications.socialMedia.enabled && (
            <View style={styles.nestedSetting}>
              {settings.notifications.socialMedia.platforms.map((platform) => (
                <View key={platform.name} style={styles.platformItem}>
                  <View style={styles.platformRow}>
                    <Text>{platform.name}</Text>
                    <Switch
                      value={platform.enabled}
                      onValueChange={(value) => toggleSocialMedia(platform.name, value)}
                      trackColor={{ false: '#767577', true: theme.colors.primary }}
                    />
                  </View>
                  {platform.enabled && (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={platform.message}
                      onChangeText={(value) => {
                        const updatedPlatforms = settings.notifications.socialMedia.platforms.map(p => 
                          p.name === platform.name ? { ...p, message: value } : p
                        );
                        setSettings(prev => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            socialMedia: {
                              ...prev.notifications.socialMedia,
                              platforms: updatedPlatforms,
                            },
                          },
                        }));
                      }}
                      placeholder={`Your message for ${platform.name}`}
                      multiline
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Digital Legacy</Text>
        <View style={styles.settingItem}>
          <Text>What should happen to your data?</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={[
                styles.radioButton, 
                settings.digitalLegacy.dataHandling === 'transfer' && styles.radioButtonActive
              ]}
              onPress={() => setSettings(prev => ({
                ...prev,
                digitalLegacy: {
                  ...prev.digitalLegacy,
                  dataHandling: 'transfer',
                },
              }))}
            >
              <View style={[
                styles.radioCircle,
                settings.digitalLegacy.dataHandling === 'transfer' && styles.radioCircleActive
              ]}>
                {settings.digitalLegacy.dataHandling === 'transfer' && <View style={styles.radioInner} />}
              </View>
              <Text>Transfer to heirs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.radioButton, 
                settings.digitalLegacy.dataHandling === 'archive' && styles.radioButtonActive
              ]}
              onPress={() => setSettings(prev => ({
                ...prev,
                digitalLegacy: {
                  ...prev.digitalLegacy,
                  dataHandling: 'archive',
                },
              }))}
            >
              <View style={[
                styles.radioCircle,
                settings.digitalLegacy.dataHandling === 'archive' && styles.radioCircleActive
              ]}>
                {settings.digitalLegacy.dataHandling === 'archive' && <View style={styles.radioInner} />}
              </View>
              <Text>Archive</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.radioButton, 
                settings.digitalLegacy.dataHandling === 'delete' && styles.radioButtonActive
              ]}
              onPress={() => setSettings(prev => ({
                ...prev,
                digitalLegacy: {
                  ...prev.digitalLegacy,
                  dataHandling: 'delete',
                },
              }))}
            >
              <View style={[
                styles.radioCircle,
                settings.digitalLegacy.dataHandling === 'delete' && styles.radioCircleActive
              ]}>
                {settings.digitalLegacy.dataHandling === 'delete' && <View style={styles.radioInner} />}
              </View>
              <Text>Delete all data</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.settingDescription}>
            {settings.digitalLegacy.dataHandling === 'transfer' 
              ? 'Your data will be transferred to your designated heirs.'
              : settings.digitalLegacy.dataHandling === 'archive'
              ? 'Your data will be archived for legal and historical purposes.'
              : 'All your data will be permanently deleted.'}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text>Message to your heirs:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.digitalLegacy.messageToHeirs}
            onChangeText={(value) => setSettings(prev => ({
              ...prev,
              digitalLegacy: {
                ...prev.digitalLegacy,
                messageToHeirs: value,
              },
            }))}
            placeholder="Write a personal message to your heirs..."
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Save Settings"
          onPress={handleSave}
          style={styles.saveButton}
        />
        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nestedSetting: {
    marginTop: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  platformItem: {
    marginBottom: 16,
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioGroup: {
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  radioButtonActive: {
    borderColor: '#4a90e2',
    backgroundColor: '#f0f7ff',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#4a90e2',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4a90e2',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});
