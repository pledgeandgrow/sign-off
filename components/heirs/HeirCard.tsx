import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HeirDecrypted } from '@/types/heir';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface HeirCardProps {
  heir: HeirDecrypted;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const HeirCard: React.FC<HeirCardProps> = ({
  heir,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return '#10b981';
      case 'partial':
        return '#f59e0b';
      case 'view':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'full':
        return 'Full Access';
      case 'partial':
        return 'Partial Access';
      case 'view':
        return 'View Only';
      default:
        return level;
    }
  };

  const getStatusColor = () => {
    if (!heir.is_active) return '#ef4444';
    if (heir.has_accepted) return '#10b981';
    return '#f59e0b';
  };

  const getStatusLabel = () => {
    if (!heir.is_active) return 'Inactive';
    if (heir.has_accepted) return 'Accepted';
    return 'Pending';
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
        <MaterialIcons name="person" size={24} color={colors.purple.primary} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {heir.full_name}
          </Text>
        </View>
        <Text style={[styles.relationship, { color: colors.textSecondary }]}>
          {heir.relationship || 'Relation non spécifiée'}
        </Text>
        {heir.email && (
          <View style={styles.detailRow}>
            <MaterialIcons name="email" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {heir.email}
            </Text>
          </View>
        )}
        {heir.phone && (
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {heir.phone}
            </Text>
          </View>
        )}
      </View>
      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={[styles.actionButton, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
              accessibilityLabel={`Modifier ${heir.full_name}`}
            >
              <MaterialIcons name="edit" size={20} color={colors.purple.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
              accessibilityLabel={`Supprimer ${heir.full_name}`}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
});
