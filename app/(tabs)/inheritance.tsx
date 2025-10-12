import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import {
  InheritancePlanList,
  InheritancePlanForm,
} from '@/components/inheritance';
import {
  getInheritancePlans,
  createInheritancePlan,
  updateInheritancePlan,
  deleteInheritancePlan,
  toggleInheritancePlanStatus,
  getInheritancePlanDecrypted,
} from '@/lib/services/inheritanceService';
import {
  InheritancePlan,
  InheritancePlanFormData,
  InheritancePlanDecrypted,
} from '@/types/heir';

export default function InheritanceScreen() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<InheritancePlanDecrypted[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InheritancePlanDecrypted | null>(null);

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedPlans = await getInheritancePlans(user.id);
      
      // For now, we'll show plans without decryption since we don't have the private key
      // In a real implementation, you'd decrypt the instructions
      const decryptedPlans: InheritancePlanDecrypted[] = fetchedPlans.map(plan => ({
        ...plan,
        instructions: null, // Would decrypt here with private key
      }));
      
      setPlans(decryptedPlans);
    } catch (error) {
      console.error('Error loading inheritance plans:', error);
      Alert.alert('Error', 'Failed to load inheritance plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (formData: InheritancePlanFormData) => {
    if (!user) return;

    try {
      // In a real implementation, you'd use the user's public key for encryption
      const publicKey = user.public_key || '';
      
      await createInheritancePlan(user.id, formData, publicKey);
      
      Alert.alert('Success', 'Inheritance plan created successfully');
      setShowForm(false);
      loadPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      Alert.alert('Error', 'Failed to create inheritance plan');
    }
  };

  const handleUpdatePlan = async (formData: InheritancePlanFormData) => {
    if (!user || !editingPlan) return;

    try {
      const publicKey = user.public_key || '';
      
      await updateInheritancePlan(editingPlan.id, formData, publicKey);
      
      Alert.alert('Success', 'Inheritance plan updated successfully');
      setShowForm(false);
      setEditingPlan(null);
      loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      Alert.alert('Error', 'Failed to update inheritance plan');
    }
  };

  const handleDeletePlan = (plan: InheritancePlanDecrypted) => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.plan_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInheritancePlan(plan.id);
              Alert.alert('Success', 'Plan deleted successfully');
              loadPlans();
            } catch (error) {
              console.error('Error deleting plan:', error);
              Alert.alert('Error', 'Failed to delete plan');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (plan: InheritancePlanDecrypted) => {
    try {
      await toggleInheritancePlanStatus(plan.id, !plan.is_active);
      Alert.alert(
        'Success',
        `Plan ${!plan.is_active ? 'activated' : 'deactivated'} successfully`
      );
      loadPlans();
    } catch (error) {
      console.error('Error toggling plan status:', error);
      Alert.alert('Error', 'Failed to update plan status');
    }
  };

  const handleEditPlan = (plan: InheritancePlanDecrypted) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to manage inheritance plans</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Inheritance Plans</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <InheritancePlanList
          plans={plans}
          onRefresh={loadPlans}
          onPlanPress={(plan) => {
            // Navigate to plan details
            console.log('Plan pressed:', plan);
          }}
          onEditPlan={handleEditPlan}
          onDeletePlan={handleDeletePlan}
          onTogglePlanStatus={handleToggleStatus}
          onAddPlan={() => setShowForm(true)}
        />
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingPlan ? 'Edit Plan' : 'Create Plan'}
            </Text>
            <TouchableOpacity onPress={handleCloseForm}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
          </View>
          <InheritancePlanForm
            initialData={editingPlan || undefined}
            onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
            onCancel={handleCloseForm}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
});
