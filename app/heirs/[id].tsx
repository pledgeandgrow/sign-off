import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { VaultAccessManager } from '@/components/inheritance';
import {
  getHeirDecrypted,
  getHeirVaultAccess,
  grantVaultAccessToHeir,
  grantVaultItemAccessToHeir,
  revokeVaultAccess,
  updateVaultAccess,
} from '@/lib/services/inheritanceService';
import { HeirDecrypted, HeirVaultAccess } from '@/types/heir';
import { Vault, VaultItem } from '@/types/database.types';

export default function HeirDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [heir, setHeir] = useState<HeirDecrypted | null>(null);
  const [vaultAccess, setVaultAccess] = useState<HeirVaultAccess[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccessManager, setShowAccessManager] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadHeirDetails();
    }
  }, [user, id]);

  const loadHeirDetails = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      
      // In a real implementation, you'd use the user's private key
      const privateKey = '';
      
      const heirData = await getHeirDecrypted(id, privateKey);
      const accessData = await getHeirVaultAccess(id);
      
      setHeir(heirData);
      setVaultAccess(accessData);
      
      // TODO: Load user's vaults and vault items
      // const userVaults = await getVaults(user.id);
      // const userVaultItems = await getVaultItems(user.id);
      // setVaults(userVaults);
      // setVaultItems(userVaultItems);
    } catch (error) {
      console.error('Error loading heir details:', error);
      Alert.alert('Error', 'Failed to load heir details');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantVaultAccess = async (vaultId: string, permissions: any) => {
    if (!id) return;

    try {
      await grantVaultAccessToHeir(id, vaultId, permissions);
      Alert.alert('Success', 'Vault access granted');
      loadHeirDetails();
    } catch (error) {
      console.error('Error granting vault access:', error);
      Alert.alert('Error', 'Failed to grant vault access');
    }
  };

  const handleGrantItemAccess = async (itemId: string, permissions: any) => {
    if (!id) return;

    try {
      await grantVaultItemAccessToHeir(id, itemId, permissions);
      Alert.alert('Success', 'Item access granted');
      loadHeirDetails();
    } catch (error) {
      console.error('Error granting item access:', error);
      Alert.alert('Error', 'Failed to grant item access');
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      await revokeVaultAccess(accessId);
      Alert.alert('Success', 'Access revoked');
      loadHeirDetails();
    } catch (error) {
      console.error('Error revoking access:', error);
      Alert.alert('Error', 'Failed to revoke access');
    }
  };

  const handleUpdatePermissions = async (accessId: string, permissions: any) => {
    try {
      await updateVaultAccess(accessId, permissions);
      loadHeirDetails();
    } catch (error) {
      console.error('Error updating permissions:', error);
      Alert.alert('Error', 'Failed to update permissions');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!heir) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Heir not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{heir.full_name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
            <Text style={styles.name}>{heir.full_name}</Text>
            {heir.relationship && (
              <Text style={styles.relationship}>{heir.relationship}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{heir.email}</Text>
            </View>
          </View>

          {heir.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#6b7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{heir.phone}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Access Settings</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Access Level</Text>
              <View
                style={[
                  styles.accessBadge,
                  { backgroundColor: getAccessLevelColor(heir.access_level) },
                ]}
              >
                <Text style={styles.accessBadgeText}>
                  {heir.access_level.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="notifications" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Notifications</Text>
              <Text style={styles.infoValue}>
                {heir.notify_on_activation
                  ? heir.notification_delay_days > 0
                    ? `${heir.notification_delay_days} days delay`
                    : 'Instant'
                  : 'Disabled'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  heir.has_accepted ? styles.acceptedBadge : styles.pendingBadge,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {heir.has_accepted ? 'Accepted' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vault Access</Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowAccessManager(true)}
            >
              <Ionicons name="settings" size={20} color="#3b82f6" />
              <Text style={styles.manageButtonText}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.accessStats}>
            <View style={styles.accessStat}>
              <Text style={styles.accessStatValue}>{vaultAccess.length}</Text>
              <Text style={styles.accessStatLabel}>Total Access</Text>
            </View>
            <View style={styles.accessStat}>
              <Text style={styles.accessStatValue}>
                {vaultAccess.filter((a) => a.vault_id).length}
              </Text>
              <Text style={styles.accessStatLabel}>Vaults</Text>
            </View>
            <View style={styles.accessStat}>
              <Text style={styles.accessStatValue}>
                {vaultAccess.filter((a) => a.vault_item_id).length}
              </Text>
              <Text style={styles.accessStatLabel}>Items</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAccessManager}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAccessManager(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Vault Access</Text>
            <TouchableOpacity onPress={() => setShowAccessManager(false)}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
          </View>
          <VaultAccessManager
            heirId={id!}
            vaults={vaults}
            vaultItems={vaultItems}
            currentAccess={vaultAccess}
            onGrantVaultAccess={handleGrantVaultAccess}
            onGrantItemAccess={handleGrantItemAccess}
            onRevokeAccess={handleRevokeAccess}
            onUpdatePermissions={handleUpdatePermissions}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backIcon: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  relationship: {
    fontSize: 16,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  accessBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  accessBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  acceptedBadge: {
    backgroundColor: '#10b981',
  },
  pendingBadge: {
    backgroundColor: '#f59e0b',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  accessStats: {
    flexDirection: 'row',
    gap: 12,
  },
  accessStat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  accessStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  accessStatLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
});
