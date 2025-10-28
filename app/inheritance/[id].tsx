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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { HeirList } from '@/components/heirs';
import {
  getInheritancePlanWithHeirs,
  triggerInheritancePlanManually,
} from '@/lib/services/inheritanceService';
import { InheritancePlanWithHeirs } from '@/types/heir';

export default function InheritancePlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [plan, setPlan] = useState<InheritancePlanWithHeirs | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'heirs'>('overview');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

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
      
      setPlan(planData);
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.purple.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Plan not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.purple.primary }]}
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
      <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Plan Type</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {plan.plan_type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Trigger Method</Text>
          <Text style={[styles.infoValue, { color: colors.purple.primary }]}>
            Global Settings
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: plan.is_active ? colors.purple.primary : 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={styles.statusText}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {plan.is_triggered && (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Triggered</Text>
            <Text style={[styles.infoValue, { color: '#ef4444' }]}>
              {new Date(plan.triggered_at!).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {plan.instructions && (
        <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions for Heirs</Text>
          <Text style={[styles.instructions, { color: colors.textSecondary }]}>{plan.instructions}</Text>
        </View>
      )}

      <View style={[styles.section, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <MaterialCommunityIcons name="account-group" size={20} color={colors.purple.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{plan.heirs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Heirs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <MaterialCommunityIcons name="lock" size={20} color={colors.purple.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{plan.vault_access_count}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vault Access</Text>
          </View>
        </View>
      </View>

      {!plan.is_triggered && (
        <TouchableOpacity
          style={[styles.triggerButton, { backgroundColor: colors.purple.primary }]}
          onPress={handleManualTrigger}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="flash" size={20} color="#fff" />
          <Text style={styles.triggerButtonText}>Manually Trigger Plan</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderHeirs = () => (
    <View style={styles.heirsContainer}>
      <HeirList
        heirs={plan.heirs}
        onRefresh={loadPlanDetails}
        onHeirPress={(heir) => {
          // Navigate to heir details
          console.log('Heir pressed:', heir);
        }}
        showActions={false}
      />
    </View>
  );


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{plan.plan_name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.background, borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && [styles.activeTab, { borderBottomColor: colors.purple.primary }]]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'overview' && [styles.activeTabText, { color: colors.purple.primary }]]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'heirs' && [styles.activeTab, { borderBottomColor: colors.purple.primary }]]}
          onPress={() => setSelectedTab('heirs')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, selectedTab === 'heirs' && [styles.activeTabText, { color: colors.purple.primary }]]}>
            Heirs ({plan.heirs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'heirs' && renderHeirs()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backIcon: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
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
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  heirsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
});
