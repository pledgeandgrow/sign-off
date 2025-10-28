import { ProfileHeader, ProfileMenuItem, ProfileSection } from '@/components/profile';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, StatusBar, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

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

  const handleDeleteAccount = async () => {
    try {
      Alert.alert(
        'Supprimer le compte',
        'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement supprimées (coffres-forts, héritiers, plans d\'héritage).',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer définitivement',
            style: 'destructive',
            onPress: async () => {
              try {
                if (!user?.id) {
                  Alert.alert('Erreur', 'Utilisateur non connecté');
                  return;
                }

                // Delete all user data in order (respecting foreign keys)
                const { error: itemsError } = await supabase
                  .from('vault_items')
                  .delete()
                  .in('vault_id', 
                    supabase.from('vaults').select('id').eq('user_id', user.id)
                  );

                const { error: vaultsError } = await supabase
                  .from('vaults')
                  .delete()
                  .eq('user_id', user.id);

                const { error: accessError } = await supabase
                  .from('heir_vault_access')
                  .delete()
                  .in('heir_id',
                    supabase.from('heirs').select('id').eq('user_id', user.id)
                  );

                const { error: triggersError } = await supabase
                  .from('inheritance_triggers')
                  .delete()
                  .eq('user_id', user.id);

                const { error: plansError } = await supabase
                  .from('inheritance_plans')
                  .delete()
                  .eq('user_id', user.id);

                const { error: heirsError } = await supabase
                  .from('heirs')
                  .delete()
                  .eq('user_id', user.id);

                const { error: subscriptionsError } = await supabase
                  .from('subscriptions')
                  .delete()
                  .eq('user_id', user.id);

                const { error: userError } = await supabase
                  .from('users')
                  .delete()
                  .eq('id', user.id);

                // Delete auth user
                const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

                if (vaultsError || heirsError || plansError || userError) {
                  console.error('Delete errors:', { vaultsError, heirsError, plansError, userError });
                  Alert.alert('Erreur', 'Échec de la suppression du compte. Veuillez réessayer.');
                  return;
                }

                // Sign out
                await signOut();
                router.replace('/');
                
                Alert.alert('Compte supprimé', 'Votre compte et toutes vos données ont été supprimés.');
              } catch (error) {
                console.error('Error deleting account:', error);
                Alert.alert('Erreur', 'Échec de la suppression du compte. Veuillez réessayer.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error showing delete account alert:', error);
    }
  };

  const handleExportData = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      Alert.alert(
        'Exporter mes données',
        'Vos données seront exportées au format JSON. Cela peut prendre quelques instants.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Exporter',
            onPress: async () => {
              try {
                // Fetch all user data
                const { data: userData } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', user.id)
                  .single();

                const { data: vaults } = await supabase
                  .from('vaults')
                  .select('*')
                  .eq('user_id', user.id);

                const { data: vaultItems } = await supabase
                  .from('vault_items')
                  .select('*')
                  .in('vault_id', vaults?.map(v => v.id) || []);

                const { data: heirs } = await supabase
                  .from('heirs')
                  .select('*')
                  .eq('user_id', user.id);

                const { data: plans } = await supabase
                  .from('inheritance_plans')
                  .select('*')
                  .eq('user_id', user.id);

                const { data: subscriptions } = await supabase
                  .from('subscriptions')
                  .select('*')
                  .eq('user_id', user.id);

                // Create export object
                const exportData = {
                  export_info: {
                    app: 'Sign-Off',
                    version: '1.0.0',
                    exported_at: new Date().toISOString(),
                    user_id: user.id,
                  },
                  user: userData,
                  vaults: vaults || [],
                  vault_items: vaultItems || [],
                  heirs: heirs || [],
                  inheritance_plans: plans || [],
                  subscriptions: subscriptions || [],
                };

                // Convert to JSON
                const jsonString = JSON.stringify(exportData, null, 2);
                
                // Save to file
                const fileName = `sign-off-export-${new Date().toISOString().split('T')[0]}.json`;
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;
                
                await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                  encoding: FileSystem.EncodingType.UTF8,
                });

                // Share the file
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Exporter mes données Sign-Off',
                  });
                } else {
                  Alert.alert(
                    'Export réussi',
                    `Vos données ont été exportées vers:\n${fileUri}`
                  );
                }
              } catch (error) {
                console.error('Error exporting data:', error);
                Alert.alert('Erreur', 'Échec de l\'export des données. Veuillez réessayer.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing export data alert:', error);
    }
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Prendre une photo', 'Choisir depuis la galerie'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromCamera();
          } else if (buttonIndex === 2) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Photo de profil',
        'Choisissez une option',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Prendre une photo', onPress: pickImageFromCamera },
          { text: 'Choisir depuis la galerie', onPress: pickImageFromGallery },
        ]
      );
    }
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la galerie');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      // TODO: Upload to Supabase storage and update user profile
      Alert.alert('En cours', 'Upload de l\'avatar en cours de développement');
      console.log('Avatar URI:', uri);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Erreur', 'Échec de l\'upload de l\'avatar');
    }
  };

  const renderMainView = () => (
    <>
      <View style={[styles.profileCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <ProfileHeader 
          name={fullName} 
          email={email} 
          onEditPress={handleEditProfile}
          onAvatarPress={handleAvatarPress}
          avatarUrl={user?.avatar_url}
        />
      </View>

      <ProfileSection title="Compte">
        <ProfileMenuItem
          icon="account"
          label="Informations personnelles"
          onPress={handleEditProfile}
        />
        <ProfileMenuItem
          icon="shield-lock-outline"
          label="Sécurité"
          onPress={handleSecurityPress}
        />
        <ProfileMenuItem
          icon="bell-outline"
          label="Notifications"
          onPress={handleNotificationPress}
        />
      </ProfileSection>

      <ProfileSection title="Support">
        <ProfileMenuItem
          icon="help-circle-outline"
          label="Aide & Support"
          onPress={() => WebBrowser.openBrowserAsync('https://heriwill.com/contact')}
        />
        <ProfileMenuItem
          icon="school-outline"
          label="Revoir l'introduction"
          onPress={handleViewOnboarding}
        />
        <ProfileMenuItem
          icon="information-outline"
          label="À propos de Sign-off"
          onPress={() => WebBrowser.openBrowserAsync('https://heriwill.com/about')}
        />
      </ProfileSection>

      <ProfileSection title="Légal">
        <ProfileMenuItem
          icon="shield-lock"
          label="Politique de confidentialité"
          onPress={() => WebBrowser.openBrowserAsync('https://heriwill.com/legal/privacy')}
        />
        <ProfileMenuItem
          icon="file-document-outline"
          label="Conditions d'utilisation"
          onPress={() => WebBrowser.openBrowserAsync('https://heriwill.com/legal/terms')}
        />
        <ProfileMenuItem
          icon="cookie-outline"
          label="Politique des cookies"
          onPress={() => WebBrowser.openBrowserAsync('https://heriwill.com/legal/cookies')}
        />
        <ProfileMenuItem
          icon="shield-account"
          label="Protection des données (RGPD)"
          onPress={() => WebBrowser.openBrowserAsync('https://heriwill.com/legal/gdpr')}
        />
      </ProfileSection>

      <ProfileSection title="Mes données (RGPD)">
        <ProfileMenuItem
          icon="download"
          label="Exporter mes données"
          onPress={handleExportData}
        />
        <ProfileMenuItem
          icon="delete-forever"
          label="Supprimer mon compte"
          onPress={handleDeleteAccount}
          labelStyle={{ color: colors.error }}
          iconColor={colors.error}
        />
      </ProfileSection>

      <View style={styles.signOutButton}>
        <ProfileMenuItem
          icon="logout-variant"
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