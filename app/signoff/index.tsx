import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignOffSettings } from '@/components/signoff/SignOffSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SignOffSettings as SignOffSettingsType } from '@/types/signOff';

export default function SignOffScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Partial<SignOffSettingsType>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('sign_off_settings')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data?.sign_off_settings) {
          setSettings(data.sign_off_settings);
        }
      } catch (error) {
        console.error('Error fetching sign-off settings:', error);
        Alert.alert('Error', 'Failed to load sign-off settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async (updatedSettings: SignOffSettingsType) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          sign_off_settings: updatedSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      
      Alert.alert('Success', 'Your sign-off settings have been saved');
      router.back();
    } catch (error) {
      console.error('Error saving sign-off settings:', error);
      Alert.alert('Error', 'Failed to save sign-off settings');
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
