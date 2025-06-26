import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignOffSettings } from '@/components/signoff/SignOffSettings';

import { SignOffSettings as SignOffSettingsType } from '@/types/signOff';

export default function SignOffScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Partial<SignOffSettingsType>>({});

  useEffect(() => {
    // Load settings from local storage or use defaults
    const loadSettings = async () => {
      try {
        // TODO: Replace with actual local storage implementation
        // const savedSettings = await AsyncStorage.getItem('signOffSettings');
        // if (savedSettings) {
        //   setSettings(JSON.parse(savedSettings));
        // }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        Alert.alert('Error', 'Failed to load settings');
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (updatedSettings: SignOffSettingsType) => {
    try {
      setIsLoading(true);
      
      // TODO: Save to local storage
      // await AsyncStorage.setItem('signOffSettings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Sign-Off Settings',
          headerBackTitle: 'Back',
        }} 
      />
      
      <SignOffSettings
        initialSettings={settings}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
