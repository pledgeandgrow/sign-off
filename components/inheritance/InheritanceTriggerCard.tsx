import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InheritanceTrigger } from '@/types/heir';

interface InheritanceTriggerCardProps {
  trigger: InheritanceTrigger;
  onPress?: () => void;
  onVerify?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export const InheritanceTriggerCard: React.FC<InheritanceTriggerCardProps> = ({
  trigger,
  onPress,
  onVerify,
  onCancel,
  showActions = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'processing':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#6b7280';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'processing':
        return 'sync';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'failed':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'inactivity':
        return 'Inactivity';
      case 'manual':
        return 'Manual Trigger';
      case 'scheduled':
        return 'Scheduled';
      case 'death_certificate':
        return 'Death Certificate';
      case 'emergency_contact':
        return 'Emergency Contact';
      default:
        return reason;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.statusIcon,
            { backgroundColor: getStatusColor(trigger.status) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(trigger.status)}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.statusText}>
            {trigger.status.charAt(0).toUpperCase() + trigger.status.slice(1)}
          </Text>
          <Text style={styles.reasonText}>{getReasonLabel(trigger.trigger_reason)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            Triggered: {formatDate(trigger.triggered_at)}
          </Text>
        </View>

        {trigger.verified_at && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.detailText}>
              Verified: {formatDate(trigger.verified_at)}
            </Text>
          </View>
        )}

        {trigger.completed_at && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-done" size={16} color="#10b981" />
            <Text style={styles.detailText}>
              Completed: {formatDate(trigger.completed_at)}
            </Text>
          </View>
        )}

        {trigger.cancelled_at && (
          <View style={styles.detailRow}>
            <Ionicons name="close-circle" size={16} color="#ef4444" />
            <Text style={styles.detailText}>
              Cancelled: {formatDate(trigger.cancelled_at)}
            </Text>
          </View>
        )}

        {trigger.requires_verification && !trigger.verified_at && (
          <View style={styles.verificationBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#f59e0b" />
            <Text style={styles.verificationText}>Verification Required</Text>
          </View>
        )}
      </View>

      {showActions && trigger.status === 'pending' && (
        <View style={styles.actions}>
          {trigger.requires_verification && !trigger.verified_at && onVerify && (
            <TouchableOpacity style={styles.verifyButton} onPress={onVerify}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          )}
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Ionicons name="close" size={18} color="#ef4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
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
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 14,
    color: '#6b7280',
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
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  verifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
