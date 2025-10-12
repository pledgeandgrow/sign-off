import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeirVaultAccess } from '@/types/heir';
import { Vault, VaultItem } from '@/types/database.types';

interface VaultAccessManagerProps {
  heirId: string;
  vaults: Vault[];
  vaultItems: VaultItem[];
  currentAccess: HeirVaultAccess[];
  onGrantVaultAccess: (vaultId: string, permissions: any) => void;
  onGrantItemAccess: (itemId: string, permissions: any) => void;
  onRevokeAccess: (accessId: string) => void;
  onUpdatePermissions: (accessId: string, permissions: any) => void;
}

export const VaultAccessManager: React.FC<VaultAccessManagerProps> = ({
  heirId,
  vaults,
  vaultItems,
  currentAccess,
  onGrantVaultAccess,
  onGrantItemAccess,
  onRevokeAccess,
  onUpdatePermissions,
}) => {
  const [selectedTab, setSelectedTab] = useState<'vaults' | 'items'>('vaults');

  const hasVaultAccess = (vaultId: string) => {
    return currentAccess.some((a) => a.vault_id === vaultId);
  };

  const hasItemAccess = (itemId: string) => {
    return currentAccess.some((a) => a.vault_item_id === itemId);
  };

  const getAccessForVault = (vaultId: string) => {
    return currentAccess.find((a) => a.vault_id === vaultId);
  };

  const getAccessForItem = (itemId: string) => {
    return currentAccess.find((a) => a.vault_item_id === itemId);
  };

  const handleToggleVaultAccess = (vaultId: string) => {
    const access = getAccessForVault(vaultId);
    if (access) {
      Alert.alert(
        'Revoke Access',
        'Are you sure you want to revoke access to this vault?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: () => onRevokeAccess(access.id),
          },
        ]
      );
    } else {
      onGrantVaultAccess(vaultId, {
        can_view: true,
        can_export: false,
        can_edit: false,
      });
    }
  };

  const handleToggleItemAccess = (itemId: string) => {
    const access = getAccessForItem(itemId);
    if (access) {
      Alert.alert(
        'Revoke Access',
        'Are you sure you want to revoke access to this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Revoke',
            style: 'destructive',
            onPress: () => onRevokeAccess(access.id),
          },
        ]
      );
    } else {
      onGrantItemAccess(itemId, {
        can_view: true,
        can_export: false,
        can_edit: false,
      });
    }
  };

  const handleUpdatePermission = (
    accessId: string,
    permission: 'can_view' | 'can_export' | 'can_edit',
    value: boolean
  ) => {
    onUpdatePermissions(accessId, { [permission]: value });
  };

  const renderVaultItem = ({ item: vault }: { item: Vault }) => {
    const access = getAccessForVault(vault.id);
    const hasAccess = !!access;

    return (
      <View style={styles.listItem}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Ionicons name="folder" size={24} color="#3b82f6" />
            <Text style={styles.itemName}>{vault.name}</Text>
          </View>
          <Switch
            value={hasAccess}
            onValueChange={() => handleToggleVaultAccess(vault.id)}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={hasAccess ? '#fff' : '#f3f4f6'}
          />
        </View>

        {hasAccess && access && (
          <View style={styles.permissions}>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Can View</Text>
              <Switch
                value={access.can_view}
                onValueChange={(value) =>
                  handleUpdatePermission(access.id, 'can_view', value)
                }
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={access.can_view ? '#fff' : '#f3f4f6'}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Can Export</Text>
              <Switch
                value={access.can_export}
                onValueChange={(value) =>
                  handleUpdatePermission(access.id, 'can_export', value)
                }
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={access.can_export ? '#fff' : '#f3f4f6'}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Can Edit</Text>
              <Switch
                value={access.can_edit}
                onValueChange={(value) =>
                  handleUpdatePermission(access.id, 'can_edit', value)
                }
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={access.can_edit ? '#fff' : '#f3f4f6'}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderVaultItemItem = ({ item }: { item: VaultItem }) => {
    const access = getAccessForItem(item.id);
    const hasAccess = !!access;

    return (
      <View style={styles.listItem}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Ionicons name="document" size={24} color="#6b7280" />
            <Text style={styles.itemName}>{item.title_encrypted}</Text>
          </View>
          <Switch
            value={hasAccess}
            onValueChange={() => handleToggleItemAccess(item.id)}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={hasAccess ? '#fff' : '#f3f4f6'}
          />
        </View>

        {hasAccess && access && (
          <View style={styles.permissions}>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Can View</Text>
              <Switch
                value={access.can_view}
                onValueChange={(value) =>
                  handleUpdatePermission(access.id, 'can_view', value)
                }
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={access.can_view ? '#fff' : '#f3f4f6'}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Can Export</Text>
              <Switch
                value={access.can_export}
                onValueChange={(value) =>
                  handleUpdatePermission(access.id, 'can_export', value)
                }
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={access.can_export ? '#fff' : '#f3f4f6'}
              />
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Can Edit</Text>
              <Switch
                value={access.can_edit}
                onValueChange={(value) =>
                  handleUpdatePermission(access.id, 'can_edit', value)
                }
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={access.can_edit ? '#fff' : '#f3f4f6'}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'vaults' && styles.activeTab]}
          onPress={() => setSelectedTab('vaults')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'vaults' && styles.activeTabText]}
          >
            Vaults ({vaults.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'items' && styles.activeTab]}
          onPress={() => setSelectedTab('items')}
        >
          <Text
            style={[styles.tabText, selectedTab === 'items' && styles.activeTabText]}
          >
            Items ({vaultItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'vaults' ? (
        <FlatList
          data={vaults}
          renderItem={renderVaultItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={vaultItems}
          renderItem={renderVaultItemItem}
          keyExtractor={(item) => item.id}
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
    backgroundColor: '#f9fafb',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  listItem: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  permissions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
});
