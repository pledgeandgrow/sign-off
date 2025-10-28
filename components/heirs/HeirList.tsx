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
import { MaterialIcons } from '@expo/vector-icons';
import { HeirDecrypted } from '@/types/heir';
import { HeirCard } from './HeirCard';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface HeirListProps {
  heirs: HeirDecrypted[];
  loading?: boolean;
  onRefresh?: () => void;
  onHeirPress?: (heir: HeirDecrypted) => void;
  onEditHeir?: (heir: HeirDecrypted) => void;
  onDeleteHeir?: (heir: HeirDecrypted) => void;
  onAddHeir?: () => void;
  emptyMessage?: string;
  showActions?: boolean;
}

export const HeirList: React.FC<HeirListProps> = ({
  heirs,
  loading = false,
  onRefresh,
  onHeirPress,
  onEditHeir,
  onDeleteHeir,
  onAddHeir,
  emptyMessage = 'Aucun héritier',
  showActions = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
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
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyStateIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
          <MaterialIcons name="person-add" size={48} color={colors.purple.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyMessage}</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Ajoutez vos premiers héritiers pour qu'ils puissent accéder à vos données après votre décès
        </Text>
        {onAddHeir && (
          <TouchableOpacity style={[styles.addFirstButton, { backgroundColor: colors.purple.primary }]} onPress={onAddHeir}>
            <MaterialIcons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addFirstButtonText}>Ajouter un héritier</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => {
    if (heirs.length === 0) return null;

    const activeCount = heirs.filter((h) => h.is_active).length;
    const acceptedCount = heirs.filter((h) => h.has_accepted).length;

    return (
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <MaterialIcons name="people" size={20} color={colors.purple.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{heirs.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Héritiers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <MaterialIcons name="check-circle" size={20} color={colors.purple.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Actifs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <MaterialIcons name="how-to-reg" size={20} color={colors.purple.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{acceptedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Acceptés</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: HeirDecrypted }) => (
    <HeirCard
      heir={item}
      onPress={() => onHeirPress?.(item)}
      onEdit={() => onEditHeir?.(item)}
      onDelete={() => onDeleteHeir?.(item)}
      showActions={showActions}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={heirs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          heirs.length === 0 && styles.emptyListContent,
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
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  addFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
