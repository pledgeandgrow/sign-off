import React, { useState } from 'react';
import { View, StyleSheet, Alert, StatusBar, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeirList, HeirForm } from '../../components/heirs';
import type { HeirDecrypted, HeirFormData } from '../../types/heir';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHeirs } from '@/contexts/HeirContext';

export default function HeirsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {view === 'list' && (
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
      )}
      
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
});
