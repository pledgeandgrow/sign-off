import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { InheritancePlanDecrypted } from '@/types/heir';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface InheritancePlanCardProps {
  plan: InheritancePlanDecrypted;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  showActions?: boolean;
}

export const InheritancePlanCard: React.FC<InheritancePlanCardProps> = ({
  plan,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'full_access':
        return '#10b981';
      case 'partial_access':
        return colors.purple.primary;
      case 'view_only':
        return '#f59e0b';
      case 'destroy':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case 'full_access':
        return 'key';
      case 'partial_access':
        return 'key-outline';
      case 'view_only':
        return 'eye';
      case 'destroy':
        return 'delete-forever';
      default:
        return 'shield';
    }
  };

  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case 'full_access':
        return 'Accès Complet';
      case 'partial_access':
        return 'Accès Partiel';
      case 'view_only':
        return 'Lecture Seule';
      case 'destroy':
        return 'Détruire';
      default:
        return type;
    }
  };

  const getActivationMethodIcon = (method: string) => {
    switch (method) {
      case 'inactivity':
        return 'clock-outline';
      case 'death_certificate':
        return 'file-document';
      case 'manual_trigger':
        return 'hand-back-right';
      case 'scheduled':
        return 'calendar';
      default:
        return 'help-circle';
    }
  };

  const getActivationMethodLabel = (method: string) => {
    switch (method) {
      case 'inactivity':
        return 'Inactivité';
      case 'death_certificate':
        return 'Certificat';
      case 'manual_trigger':
        return 'Manuel';
      case 'scheduled':
        return 'Programmé';
      default:
        return method;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        !plan.is_active && styles.inactiveCard
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getPlanTypeColor(plan.plan_type) + '20' },
            ]}
          >
            <MaterialCommunityIcons 
              name={getPlanTypeIcon(plan.plan_type) as any} 
              size={24} 
              color={getPlanTypeColor(plan.plan_type)} 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.planName, { color: colors.text }]}>{plan.plan_name}</Text>
            <View style={styles.planTypeRow}>
              <View style={[styles.planTypeBadge, { backgroundColor: getPlanTypeColor(plan.plan_type) + '20' }]}>
                <Text style={[styles.planType, { color: getPlanTypeColor(plan.plan_type) }]}>
                  {getPlanTypeLabel(plan.plan_type)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {showActions && (
          <View style={styles.actions}>
            {onToggleStatus && (
              <TouchableOpacity onPress={onToggleStatus} style={styles.actionButton}>
                <MaterialCommunityIcons
                  name={plan.is_active ? 'pause-circle' : 'play-circle'}
                  size={24}
                  color={plan.is_active ? '#f59e0b' : '#10b981'}
                />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <MaterialCommunityIcons name="delete" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={[styles.detailIconContainer, { backgroundColor: colors.purple.primary + '15' }]}>
            <MaterialCommunityIcons
              name={getActivationMethodIcon(plan.activation_method) as any}
              size={14}
              color={colors.purple.primary}
            />
          </View>
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {getActivationMethodLabel(plan.activation_method)}
          </Text>
        </View>
        {plan.scheduled_date && (
          <View style={styles.detailRow}>
            <View style={[styles.detailIconContainer, { backgroundColor: colors.purple.primary + '15' }]}>
              <MaterialCommunityIcons name="calendar" size={14} color={colors.purple.primary} />
            </View>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Programmé: {formatDate(plan.scheduled_date)}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <View style={[styles.detailIconContainer, { backgroundColor: colors.purple.primary + '15' }]}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.purple.primary} />
          </View>
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            Créé: {formatDate(plan.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.badges}>
          {plan.is_active ? (
            <View style={[styles.badge, styles.activeBadge]}>
              <MaterialCommunityIcons name="check-circle" size={12} color="#fff" />
              <Text style={styles.badgeText}>Actif</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.inactiveBadge]}>
              <MaterialCommunityIcons name="pause-circle" size={12} color="#fff" />
              <Text style={styles.badgeText}>Inactif</Text>
            </View>
          )}
          {plan.is_triggered && (
            <View style={[styles.badge, styles.triggeredBadge]}>
              <MaterialCommunityIcons name="alert" size={12} color="#fff" />
              <Text style={styles.badgeText}>Déclenché</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  planTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planType: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  details: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: '#6b7280',
  },
  triggeredBadge: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
