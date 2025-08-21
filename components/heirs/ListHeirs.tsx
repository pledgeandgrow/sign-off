import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Heir } from '../../types/heir';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ListHeirsProps {
  heirs: Heir[];
  onEdit: (heir: Heir) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const ListHeirs = ({
  heirs,
  onEdit,
  onDelete,
  onAdd,
}: ListHeirsProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const renderItem = ({ item }: { item: Heir }) => (
    <View style={[styles.itemContainer, { 
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }]}>
      <View style={[styles.avatar, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
        <MaterialIcons name="person" size={24} color={colors.purple.primary} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
        </View>
        <Text style={[styles.relationship, { color: colors.textSecondary }]}>
          {item.relationship}
        </Text>
        {item.email ? (
          <View style={styles.detailRow}>
            <MaterialIcons name="email" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {item.email}
            </Text>
          </View>
        ) : null}
        {item.phone ? (
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {item.phone}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => onEdit(item)} 
          style={[styles.actionButton, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
          accessibilityLabel={`Modifier ${item.name}`}
        >
          <MaterialIcons name="edit" size={20} color={colors.purple.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onDelete(item.id)} 
          style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
          accessibilityLabel={`Supprimer ${item.name}`}
        >
          <MaterialIcons name="delete-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Mes Héritiers</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gérez qui hérite de vos données
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onAdd} 
          style={[styles.addButton, { backgroundColor: colors.purple.primary }]}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <MaterialIcons name="people" size={20} color={colors.purple.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{heirs.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Héritiers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <MaterialIcons name="security" size={20} color={colors.purple.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>100%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sécurisé</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <MaterialIcons name="check-circle" size={20} color={colors.purple.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{heirs.filter(h => h.email).length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Contactés</Text>
        </View>
      </View>
      
      {heirs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
            <MaterialIcons name="person-add" size={48} color={colors.purple.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Aucun héritier
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Ajoutez vos premiers héritiers pour qu'ils puissent accéder à vos données après votre décès
          </Text>
          <TouchableOpacity 
            onPress={onAdd} 
            style={[styles.addFirstButton, { backgroundColor: colors.purple.primary }]}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addFirstText}>Ajouter un héritier</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={heirs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  relationship: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFirstText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export { ListHeirs };
