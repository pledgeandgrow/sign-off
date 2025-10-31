import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { JoinAsHeirForm } from '@/components/heirs/JoinAsHeirForm';
import { 
  validateInvitationCode, 
  acceptHeirInvitation 
} from '@/lib/services/heirInvitationService';

export default function JoinAsHeirScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmitCode = async (code: string) => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour accepter une invitation');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      // Valider le code
      const validation = await validateInvitationCode(code);
      
      if (!validation.valid) {
        Alert.alert('Code invalide', validation.error || 'Ce code d\'invitation n\'est pas valide');
        return;
      }

      // Afficher une confirmation
      Alert.alert(
        'Invitation trouvée',
        `Vous êtes invité à devenir héritier.\n\nSouhaitez-vous accepter cette invitation ?`,
        [
          {
            text: 'Refuser',
            style: 'cancel',
          },
          {
            text: 'Accepter',
            onPress: async () => {
              try {
                await acceptHeirInvitation(user.id, code);
                Alert.alert(
                  'Invitation acceptée !',
                  'Vous êtes maintenant héritier. Vous recevrez les informations selon les conditions définies.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.push('/(tabs)/heirs'),
                    },
                  ]
                );
              } catch (error: any) {
                console.error('Error accepting invitation:', error);
                Alert.alert('Erreur', error.message || 'Impossible d\'accepter l\'invitation');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error validating code:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // TODO: Implémenter le scanner QR
    Alert.alert(
      'Scanner QR',
      'La fonctionnalité de scan QR sera bientôt disponible.\n\nPour l\'instant, veuillez saisir le code manuellement.'
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <JoinAsHeirForm
          onSubmit={handleSubmitCode}
          onCancel={handleCancel}
          onScanQR={handleScanQR}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
