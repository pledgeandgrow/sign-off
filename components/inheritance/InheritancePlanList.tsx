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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { InheritancePlanDecrypted } from '@/types/heir';
import { InheritancePlanCard } from './InheritancePlanCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

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
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.purple.primary + '20' }]}>
          <MaterialCommunityIcons name="file-document-multiple-outline" size={64} color={colors.purple.primary} />
        </View>
        <Text style={[styles.emptyText, { color: colors.text }]}>{emptyMessage}</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Créez un plan pour gérer votre héritage numérique
        </Text>
        {onAddPlan && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.purple.primary }]} 
            onPress={onAddPlan}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Créer mon premier plan</Text>
          </TouchableOpacity>
        )}
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={plans}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          plans.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.purple.primary}
            />
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
  },
  listContent: {
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
