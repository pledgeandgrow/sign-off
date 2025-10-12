import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InheritancePlanDecrypted } from '@/types/heir';

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
  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'full_access':
        return '#10b981';
      case 'partial_access':
        return '#3b82f6';
      case 'view_only':
        return '#f59e0b';
      case 'destroy':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case 'full_access':
        return 'Full Access';
      case 'partial_access':
        return 'Partial Access';
      case 'view_only':
        return 'View Only';
      case 'destroy':
        return 'Destroy Data';
      default:
        return type;
    }
  };

  const getActivationMethodIcon = (method: string) => {
    switch (method) {
      case 'inactivity':
        return 'time-outline';
      case 'death_certificate':
        return 'document-text-outline';
      case 'manual_trigger':
        return 'hand-left-outline';
      case 'scheduled':
        return 'calendar-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getActivationMethodLabel = (method: string) => {
    switch (method) {
      case 'inactivity':
        return 'Inactivity';
      case 'death_certificate':
        return 'Death Certificate';
      case 'manual_trigger':
        return 'Manual Trigger';
      case 'scheduled':
        return 'Scheduled';
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
      style={[styles.card, !plan.is_active && styles.inactiveCard]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getPlanTypeColor(plan.plan_type) },
            ]}
          >
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.planName}>{plan.plan_name}</Text>
            <Text style={styles.planType}>{getPlanTypeLabel(plan.plan_type)}</Text>
          </View>
        </View>
        {showActions && (
          <View style={styles.actions}>
            {onToggleStatus && (
              <TouchableOpacity onPress={onToggleStatus} style={styles.actionButton}>
                <Ionicons
                  name={plan.is_active ? 'pause-circle' : 'play-circle'}
                  size={24}
                  color={plan.is_active ? '#f59e0b' : '#10b981'}
                />
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                <Ionicons name="pencil" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons
            name={getActivationMethodIcon(plan.activation_method)}
            size={16}
            color="#6b7280"
          />
          <Text style={styles.detailText}>
            {getActivationMethodLabel(plan.activation_method)}
          </Text>
        </View>
        {plan.scheduled_date && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Scheduled: {formatDate(plan.scheduled_date)}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            Created: {formatDate(plan.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.badges}>
          {plan.is_active ? (
            <View style={[styles.badge, styles.activeBadge]}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.inactiveBadge]}>
              <Text style={styles.badgeText}>Inactive</Text>
            </View>
          )}
          {plan.is_triggered && (
            <View style={[styles.badge, styles.triggeredBadge]}>
              <Ionicons name="warning" size={12} color="#fff" />
              <Text style={styles.badgeText}>Triggered</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  planType: {
    fontSize: 14,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
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
