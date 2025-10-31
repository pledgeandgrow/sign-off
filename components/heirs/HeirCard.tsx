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
  onCancelInvitation?: () => void;
  showActions?: boolean;
}

export const HeirCard: React.FC<HeirCardProps> = ({
  heir,
  onPress,
  onEdit,
  onDelete,
  onCancelInvitation,
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
    switch (heir.invitation_status) {
      case 'accepted':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      case 'expired':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = () => {
    switch (heir.invitation_status) {
      case 'accepted':
        return 'Accepté';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Refusé';
      case 'expired':
        return 'Expiré';
      default:
        return 'Inconnu';
    }
  };

  const isPending = heir.invitation_status === 'pending';
  const displayName = heir.heir_full_name || heir.relationship || 'Invitation en attente';
  const displayEmail = heir.heir_email;

  // Debug log
  console.log('👤 HeirCard render:', {
    id: heir.id,
    status: heir.invitation_status,
    isPending,
    hasCancel: !!onCancelInvitation,
    hasDelete: !!onDelete,
    showActions
  });

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.card,
        {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.avatar, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
        <MaterialIcons name="person" size={24} color={colors.purple.primary} />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {displayName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>
        {heir.relationship && (
          <Text style={[styles.relationship, { color: colors.textSecondary }]}>
            {heir.relationship}
          </Text>
        )}
        {displayEmail && (
          <View style={styles.detailRow}>
            <MaterialIcons name="email" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
              {displayEmail}
            </Text>
          </View>
        )}
        {isPending && heir.invitation_code && (
          <View style={styles.detailRow}>
            <MaterialIcons name="qr-code" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Code: {heir.invitation_code}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <MaterialIcons name="security" size={14} color={colors.textSecondary} style={styles.detailIcon} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {getAccessLevelLabel(heir.access_level)}
          </Text>
        </View>
      </View>
      {showActions && (
        <View style={styles.actions}>
          {isPending ? (
            onCancelInvitation ? (
              <TouchableOpacity
                onPress={() => {
                  console.log('🔴 Cancel invitation clicked for:', heir.id);
                  onCancelInvitation();
                }}
                style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                accessibilityLabel="Annuler l'invitation"
              >
                <MaterialIcons name="cancel" size={20} color={colors.error} />
              </TouchableOpacity>
            ) : null
          ) : (
            onDelete ? (
              <TouchableOpacity
                onPress={() => {
                  console.log('🗑️ Delete heir clicked for:', heir.id);
                  onDelete();
                }}
                style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                accessibilityLabel={`Supprimer ${displayName}`}
              >
                <MaterialIcons name="delete-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            ) : null
          )}
        </View>
      )}

    </CardWrapper>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
