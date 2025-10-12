import { ProfileHeader, ProfileMenuItem, ProfileSection } from '@/components/profile';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ViewType = 'main' | 'edit-profile' | 'security' | 'notifications';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [currentView, setCurrentView] = useState<ViewType>('main');

  const handleSignOut = async () => {
    try {
      Alert.alert(
        'Se déconnecter',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se déconnecter',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/');
              } catch (error) {
                console.error('Error signing out:', error);
                Alert.alert('Erreur', 'Échec de la déconnexion. Veuillez réessayer.');
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

  const fullName = user?.full_name || 'Utilisateur';
  const email = user?.email || '';

  const handleViewOnboarding = async () => {
    try {
      await resetOnboarding();
      router.push('/onboarding' as any);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      Alert.alert('Erreur', 'Impossible de réinitialiser l\'introduction.');
    }
  };

  const renderMainView = () => (
    <>
      <View style={[styles.profileCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <ProfileHeader 
          name={fullName} 
          email={email} 
          onEditPress={handleEditProfile}
        />
      </View>

      <ProfileSection title="Compte">
        <ProfileMenuItem
          icon="account"
          label="Informations personnelles"
          onPress={handleEditProfile}
        />
        <ProfileMenuItem
          icon="shield-check"
          label="Sécurité"
          onPress={handleSecurityPress}
        />
        <ProfileMenuItem
          icon="bell"
          label="Notifications"
          onPress={handleNotificationPress}
        />
      </ProfileSection>

      <ProfileSection title="Support">
        <ProfileMenuItem
          icon="help-circle"
          label="Aide & Support"
          onPress={() => console.log('Navigate to help')}
        />
        <ProfileMenuItem
          icon="school"
          label="Revoir l'introduction"
          onPress={handleViewOnboarding}
        />
        <ProfileMenuItem
          icon="information"
          label="À propos de Sign-off"
          onPress={() => console.log('Show about')}
        />
      </ProfileSection>

      <View style={styles.signOutButton}>
        <ProfileMenuItem
          icon="logout"
          label="Se déconnecter"
          onPress={handleSignOut}
          labelStyle={{ color: colors.error }}
          iconColor={colors.error}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profil</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 120, // Augmenté pour éviter que le contenu soit caché par la tab bar
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signOutButton: {
    marginTop: 8,
  }
});