import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { HeirList } from '@/components/heirs';
import {
  getInheritancePlanWithHeirs,
  getInheritanceTriggersByPlan,
  triggerInheritancePlanManually,
} from '@/lib/services/inheritanceService';
import { InheritancePlanWithHeirs, InheritanceTrigger } from '@/types/heir';
import { InheritanceTriggerCard } from '@/components/inheritance';

export default function InheritancePlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [plan, setPlan] = useState<InheritancePlanWithHeirs | null>(null);
  const [triggers, setTriggers] = useState<InheritanceTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'heirs' | 'triggers'>('overview');

  useEffect(() => {
    if (user && id) {
      loadPlanDetails();
    }
  }, [user, id]);

  const loadPlanDetails = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      
      // In a real implementation, you'd use the user's private key
      const privateKey = '';
      
      const planData = await getInheritancePlanWithHeirs(id, privateKey);
      const triggersData = await getInheritanceTriggersByPlan(id);
      
      setPlan(planData);
      setTriggers(triggersData);
    } catch (error) {
      console.error('Error loading plan details:', error);
      Alert.alert('Error', 'Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTrigger = () => {
    if (!user || !id) return;

    Alert.alert(
      'Trigger Inheritance Plan',
      'Are you sure you want to manually trigger this inheritance plan? This action will notify all heirs and grant them access according to the plan settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger',
          style: 'destructive',
          onPress: async () => {
            try {
              await triggerInheritancePlanManually(id, user.id);
              Alert.alert('Success', 'Inheritance plan triggered successfully');
              loadPlanDetails();
            } catch (error) {
              console.error('Error triggering plan:', error);
              Alert.alert('Error', 'Failed to trigger inheritance plan');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Plan not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Plan Type</Text>
          <Text style={styles.infoValue}>
            {plan.plan_type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Activation Method</Text>
          <Text style={styles.infoValue}>
            {plan.activation_method.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        {plan.scheduled_date && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Scheduled Date</Text>
            <Text style={styles.infoValue}>
              {new Date(plan.scheduled_date).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[styles.statusBadge, plan.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {plan.is_triggered && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Triggered</Text>
            <Text style={[styles.infoValue, { color: '#ef4444' }]}>
              {new Date(plan.triggered_at!).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {plan.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions for Heirs</Text>
          <Text style={styles.instructions}>{plan.instructions}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{plan.heirs.length}</Text>
            <Text style={styles.statLabel}>Total Heirs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{plan.vault_access_count}</Text>
            <Text style={styles.statLabel}>Vault Access</Text>
          </View>
        </View>
      </View>

      {!plan.is_triggered && plan.activation_method === 'manual_trigger' && (
        <TouchableOpacity
          style={styles.triggerButton}
          onPress={handleManualTrigger}
        >
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.triggerButtonText}>Manually Trigger Plan</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderHeirs = () => (
    <HeirList
      heirs={plan.heirs}
      onRefresh={loadPlanDetails}
      onHeirPress={(heir) => {
        // Navigate to heir details
        console.log('Heir pressed:', heir);
      }}
      showActions={false}
    />
  );

  const renderTriggers = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {triggers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flash-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No triggers yet</Text>
        </View>
      ) : (
        triggers.map((trigger) => (
          <InheritanceTriggerCard
            key={trigger.id}
            trigger={trigger}
            onPress={() => {
              // Navigate to trigger details
              console.log('Trigger pressed:', trigger);
            }}
            showActions={false}
          />
        ))
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{plan.plan_name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'heirs' && styles.activeTab]}
          onPress={() => setSelectedTab('heirs')}
        >
          <Text style={[styles.tabText, selectedTab === 'heirs' && styles.activeTabText]}>
            Heirs ({plan.heirs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'triggers' && styles.activeTab]}
          onPress={() => setSelectedTab('triggers')}
        >
          <Text style={[styles.tabText, selectedTab === 'triggers' && styles.activeTabText]}>
            Triggers ({triggers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'heirs' && renderHeirs()}
      {selectedTab === 'triggers' && renderTriggers()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backIcon: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: '#6b7280',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  instructions: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  triggerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});
