import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InheritancePlanDecrypted } from '@/types/heir';
import { InheritancePlanCard } from './InheritancePlanCard';

interface InheritancePlanListProps {
  plans: InheritancePlanDecrypted[];
  loading?: boolean;
  onRefresh?: () => void;
  onPlanPress?: (plan: InheritancePlanDecrypted) => void;
  onEditPlan?: (plan: InheritancePlanDecrypted) => void;
  onDeletePlan?: (plan: InheritancePlanDecrypted) => void;
  onTogglePlanStatus?: (plan: InheritancePlanDecrypted) => void;
  onAddPlan?: () => void;
  emptyMessage?: string;
  showActions?: boolean;
}

export const InheritancePlanList: React.FC<InheritancePlanListProps> = ({
  plans,
  loading = false,
  onRefresh,
  onPlanPress,
  onEditPlan,
  onDeletePlan,
  onTogglePlanStatus,
  onAddPlan,
  emptyMessage = 'No inheritance plans created yet',
  showActions = true,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="shield-outline" size={64} color="#d1d5db" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          Create an inheritance plan to manage what happens to your digital legacy
        </Text>
        {onAddPlan && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPlan}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Create Your First Plan</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    if (plans.length === 0) return null;

    const activeCount = plans.filter((p) => p.is_active).length;
    const triggeredCount = plans.filter((p) => p.is_triggered).length;

    return (
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{plans.length}</Text>
            <Text style={styles.statLabel}>Total Plans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{triggeredCount}</Text>
            <Text style={styles.statLabel}>Triggered</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: InheritancePlanDecrypted }) => (
    <InheritancePlanCard
      plan={item}
      onPress={() => onPlanPress?.(item)}
      onEdit={() => onEditPlan?.(item)}
      onDelete={() => onDeletePlan?.(item)}
      onToggleStatus={() => onTogglePlanStatus?.(item)}
      showActions={showActions}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          plans.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
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
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
