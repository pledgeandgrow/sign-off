import { InheritancePlanList } from '@/components/inheritance/InheritancePlanList';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
    deleteInheritancePlan,
    getInheritancePlans,
    toggleInheritancePlanStatus,
} from '@/lib/services/inheritanceService';
import { InheritancePlan } from '@/types/heir';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InheritancePlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [plans, setPlans] = useState<InheritancePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getInheritancePlans(user.id);
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
      Alert.alert('Error', 'Failed to load inheritance plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanPress = (plan: InheritancePlan) => {
    router.push(`/inheritance/${plan.id}` as any);
  };

  const handleAddPlan = () => {
    // Navigate to inheritance plan form
    router.push('/inheritance/create' as any);
  };

  const handleDeletePlan = async (plan: InheritancePlan) => {
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

  const handleToggleStatus = async (plan: InheritancePlan) => {
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

  // Calculate stats
  const activePlansCount = plans.filter(p => p.is_active).length;
  const triggeredPlansCount = plans.filter(p => p.is_triggered).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Plans d\'Héritage' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Plans d\'Héritage',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/sign-off' as any)} 
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleAddPlan} style={styles.headerButton}>
              <MaterialCommunityIcons name="plus" size={28} color={colors.purple.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vue d'ensemble
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.purple.primary + '20' }]}>
                <MaterialCommunityIcons name="file-document-multiple" size={20} color={colors.purple.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{plans.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Plans</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10b98120' }]}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{activePlansCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Actifs</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#ef444420' }]}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{triggeredPlansCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Déclenchés</Text>
            </View>
          </View>
        </View>

        {/* Plans List */}
        <View style={styles.plansSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mes Plans
            </Text>
            {plans.length > 0 && (
              <TouchableOpacity onPress={handleAddPlan}>
                <Text style={[styles.addText, { color: colors.purple.primary }]}>
                  + Nouveau
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <InheritancePlanList
            plans={plans as any}
            loading={false}
            onRefresh={loadPlans}
            onPlanPress={handlePlanPress}
            onDeletePlan={handleDeletePlan}
            onTogglePlanStatus={handleToggleStatus}
            onAddPlan={handleAddPlan}
            showActions={true}
            emptyMessage="Aucun plan d'héritage. Créez votre premier plan pour sécuriser votre héritage numérique."
          />
        </View>
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
  scrollViewContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  statsSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  plansSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
