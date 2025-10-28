import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SharedVault } from '@/lib/services/sharedVaultService';

interface SharedVaultCardProps {
  vault: SharedVault;
  onPress: () => void;
}

export function SharedVaultCard({ vault, onPress }: SharedVaultCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      passwords: 'key',
      documents: 'file-document',
      notes: 'note-text',
      photos: 'image',
      other: 'folder',
    };
    return icons[category] || 'folder';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header with icon and name */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: vault.color || colors.purple.primary }]}>
          <MaterialCommunityIcons
            name={vault.icon as any || getCategoryIcon(vault.category)}
            size={24}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.vaultName, { color: colors.text }]} numberOfLines={1}>
            {vault.name}
          </Text>
          <View style={styles.sharedFromContainer}>
            <MaterialCommunityIcons name="account" size={14} color={colors.purple.primary} />
            <Text style={[styles.sharedFromText, { color: colors.purple.primary }]} numberOfLines={1}>
              De {vault.shared_from_user_name}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
      </View>

      {/* Description */}
      {vault.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {vault.description}
        </Text>
      )}

      {/* Footer with metadata */}
      <View style={styles.footer}>
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <MaterialCommunityIcons name="shield-check" size={16} color={colors.purple.primary} />
            <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
              {vault.inheritance_plan_name}
            </Text>
          </View>
        </View>
        
        <View style={styles.metadataRow}>
          <View style={styles.permissionBadge}>
            {vault.can_view && (
              <View style={[styles.badge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <MaterialCommunityIcons name="eye" size={12} color="#22C55E" />
                <Text style={[styles.badgeText, { color: '#22C55E' }]}>Voir</Text>
              </View>
            )}
            {vault.can_export && (
              <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <MaterialCommunityIcons name="download" size={12} color="#3B82F6" />
                <Text style={[styles.badgeText, { color: '#3B82F6' }]}>Export</Text>
              </View>
            )}
            {vault.can_edit && (
              <View style={[styles.badge, { backgroundColor: 'rgba(251, 146, 60, 0.2)' }]}>
                <MaterialCommunityIcons name="pencil" size={12} color="#FB923C" />
                <Text style={[styles.badgeText, { color: '#FB923C' }]}>Éditer</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.dateText, { color: colors.textTertiary }]}>
          Accès accordé le {formatDate(vault.access_granted_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  vaultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sharedFromContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sharedFromText: {
    fontSize: 13,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    fontWeight: '500',
  },
  permissionBadge: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
