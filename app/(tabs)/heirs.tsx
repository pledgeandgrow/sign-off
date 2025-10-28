import { Colors } from '@/constants/Colors';
import { useHeirs } from '@/contexts/HeirContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { canPerformAction } from '@/lib/services/subscriptionService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeirForm, HeirList } from '../../components/heirs';
import type { HeirDecrypted, HeirFormData } from '../../types/heir';

export default function HeirsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const { user } = useAuth();
  const { heirs, loading, createHeir, updateHeir, deleteHeir, refreshHeirs } = useHeirs();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [currentHeir, setCurrentHeir] = useState<HeirDecrypted | null>(null);

  const handleSubmitForm = async (data: HeirFormData) => {
    try {
      if (currentHeir) {
        // Update existing heir
        await updateHeir(currentHeir.id, data);
        Alert.alert('Succès', 'Héritier mis à jour avec succès');
      } else {
        // Check if user can add heir (free tier limit)
        if (user) {
          const { allowed, reason } = await canPerformAction(user.id, 'add_heir');
          if (!allowed) {
            Alert.alert(
              'Limite atteinte',
              reason,
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Passer au Premium', onPress: () => {
                  setView('list');
                  setCurrentHeir(null);
                }}
              ]
            );
            return;
          }
        }

        // Create new heir
        await createHeir(data);
        Alert.alert('Succès', 'Héritier ajouté avec succès');
      }
      setView('list');
      setCurrentHeir(null);
    } catch (error) {
      console.error('Error saving heir:', error);
      Alert.alert('Erreur', currentHeir ? 'Échec de la mise à jour' : 'Échec de l\'ajout');
    }
  };

  const handleDeleteHeir = async (heir: HeirDecrypted) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer ${heir.full_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHeir(heir.id);
              Alert.alert('Succès', 'Héritier supprimé avec succès');
            } catch (error) {
              console.error('Error deleting heir:', error);
              Alert.alert('Erreur', 'Échec de la suppression');
            }
          },
        },
      ]
    );
  };

  const handleEditHeir = (heir: HeirDecrypted) => {
    setCurrentHeir(heir);
    setView('form');
  };

  const handleAddHeir = () => {
    setCurrentHeir(null);
    setView('form');
  };

  const handleCancelForm = () => {
    setCurrentHeir(null);
    setView('list');
  };

  const renderContent = () => {
    if (view === 'form') {
      // Convert HeirDecrypted to HeirFormData format for editing
      const initialData = currentHeir ? {
        full_name_encrypted: currentHeir.full_name,
        email_encrypted: currentHeir.email,
        phone_encrypted: currentHeir.phone || '',
        relationship_encrypted: currentHeir.relationship || '',
        access_level: currentHeir.access_level,
        inheritance_plan_id: currentHeir.inheritance_plan_id,
        heir_user_id: currentHeir.heir_user_id,
        heir_public_key: currentHeir.heir_public_key,
        notify_on_activation: currentHeir.notify_on_activation,
        notification_delay_days: currentHeir.notification_delay_days,
        is_active: currentHeir.is_active,
      } : undefined;

      return (
        <HeirForm
          initialData={initialData}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
        />
      );
    }

    return (
      <HeirList
        heirs={heirs}
        loading={loading}
        onRefresh={refreshHeirs}
        onEditHeir={handleEditHeir}
        onDeleteHeir={handleDeleteHeir}
        onAddHeir={handleAddHeir}
        emptyMessage="Aucun héritier. Ajoutez-en un pour commencer."
        showActions={true}
      />
    );
  };

  const totalHeirs = heirs.length;
  const activeHeirs = heirs.filter(heir => heir.is_active).length;
  const notificationEnabled = heirs.filter(heir => heir.notify_on_activation).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {view === 'list' ? (
        <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: 20, paddingVertical: 16 }]}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Mes Héritiers</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Gérez vos bénéficiaires
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.purple.primary }]}
              onPress={handleAddHeir}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {renderContent()}
        </View>
      ) : (
        <View style={styles.formContainer}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          {renderContent()}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
});
