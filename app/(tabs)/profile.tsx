import { ProfileHeader, ProfileMenuItem, ProfileSection } from '@/components/profile';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ViewType = 'main' | 'edit-profile' | 'security' | 'notifications';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('main');

  const handleSignOut = async () => {
    try {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/');
              } catch (error) {
                console.error('Error signing out:', error);
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error showing sign out alert:', error);
    }
  };

  const handleEditProfile = () => setCurrentView('edit-profile');
  const handleSecurityPress = () => setCurrentView('security');
  const handleNotificationPress = () => setCurrentView('notifications');
  const handleBack = () => setCurrentView('main');

  const fullName = user?.user_metadata?.full_name || 
    (user?.user_metadata?.first_name || user?.user_metadata?.last_name 
      ? `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim() 
      : 'User');
  const email = user?.email || '';

  const renderMainView = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ProfileSection>
        <ProfileHeader 
          name={fullName} 
          email={email} 
          onEditPress={handleEditProfile}
        />
      </ProfileSection>

      <ProfileSection title="Account">
        <ProfileMenuItem
          icon="person-outline"
          label="Personal Information"
          onPress={handleEditProfile}
        />
        <ProfileMenuItem
          icon="lock-outline"
          label="Security"
          onPress={handleSecurityPress}
        />
        <ProfileMenuItem
          icon="notifications-outline"
          label="Notifications"
          onPress={handleNotificationPress}
        />
      </ProfileSection>

      <ProfileSection title="Support">
        <ProfileMenuItem
          icon="help-outline"
          label="Help & Support"
          onPress={() => console.log('Navigate to help')}
        />
        <ProfileMenuItem
          icon="information-outline"
          label="About SignOff"
          onPress={() => console.log('Show about')}
        />
      </ProfileSection>

      <View style={styles.signOutButton}>
        <ProfileMenuItem
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleSignOut}
          labelStyle={{ color: '#FF3B30' }}
          iconColor="#FF3B30"
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {currentView === 'main' && renderMainView()}
      {currentView === 'edit-profile' && (
        <EditProfileForm onSuccess={handleBack} onCancel={handleBack} />
      )}
      {currentView === 'security' && (
        <SecuritySettings onBack={handleBack} />
      )}
      {currentView === 'notifications' && (
        <NotificationSettings onBack={handleBack} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  signOutButton: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
});