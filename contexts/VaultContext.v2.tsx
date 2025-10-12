/**
 * VaultContext - Supabase Integrated Version
 * 
 * Manages vaults and vault items with full Supabase integration:
 * - Database storage (vaults, vault_items tables)
 * - Supabase Storage for encrypted files
 * - End-to-end encryption
 * - Shared vaults support
 * - Audit logging
 * - Death/inheritance settings
 */

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { 
  createVault as createVaultService,
  getVaults as getVaultsService,
  updateVault as updateVaultService,
  deleteVault as deleteVaultService,
  createVaultItem,
  getVaultItems,
  updateVaultItem,
  deleteVaultItem,
  createAuditLog,
} from '@/lib/services/supabaseService';
import { encryptData, decryptData, getPrivateKey, getPublicKey } from '@/lib/encryption';
import type { Vault, VaultItem } from '@/types/database.types';

// Vault category type
export type VaultCategory = 'delete_after_death' | 'share_after_death' | 'handle_after_death' | 'sign_off_after_death';

// Vault settings interface
export interface VaultSettings {
  autoLock: boolean;
  autoLockTimeout: number;
  maxFailedAttempts: number;
  twoFactorEnabled: boolean;
}

// Death settings interface
export interface DeathSettings {
  triggerAfterDays: number;
  notifyContacts: boolean;
  notifyEmail: string[];
  notifySMS: string[];
  instructions: string;
}

// Access control interface
export interface AccessControl {
  allowedUsers: string[];
  allowedHeirs: string[];
  requireApproval: boolean;
}

interface VaultContextType {
  // State
  vaults: Vault[];
  currentVault: Vault | null;
  currentVaultItems: VaultItem[];
  isLoading: boolean;
  loading: boolean; // Alias for backward compatibility
  isRefreshing: boolean;
  error: string | null;

  // Vault operations
  createVault: (vaultData: {
    name: string;
    category: VaultCategory;
    description?: string;
    icon?: string;
    color?: string;
    settings?: Partial<VaultSettings>;
    deathSettings?: Partial<DeathSettings>;
  }) => Promise<Vault>;
  updateVault: (vaultId: string, updates: Partial<Vault>) => Promise<void>;
  deleteVault: (vaultId: string) => Promise<void>;
  selectVault: (vaultId: string | null) => Promise<void>;
  refreshVaults: () => Promise<void>;
  lockVault: (vaultId: string) => Promise<void>;
  unlockVault: (vaultId: string) => Promise<boolean>;

  // Vault item operations
  addItem: (itemData: {
    vaultId: string;
    itemType: string;
    title: string;
    file?: File | Blob;
    metadata?: Record<string, any>;
  }) => Promise<VaultItem>;
  updateItem: (itemId: string, updates: Partial<VaultItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  
  // Sharing
  shareVault: (vaultId: string, userId: string, permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
  }) => Promise<void>;
  
  // Statistics
  getVaultStats: () => {
    totalVaults: number;
    totalItems: number;
    sharedVaults: number;
    lockedVaults: number;
  };
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [currentVault, setCurrentVault] = useState<Vault | null>(null);
  const [currentVaultItems, setCurrentVaultItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load vaults when user changes
  useEffect(() => {
    if (user) {
      loadVaults();
    } else {
      setVaults([]);
      setCurrentVault(null);
      setCurrentVaultItems([]);
    }
  }, [user]);

  // Load vault items when current vault changes
  useEffect(() => {
    if (currentVault) {
      loadVaultItems(currentVault.id);
    } else {
      setCurrentVaultItems([]);
    }
  }, [currentVault]);

  /**
   * Load all vaults for the current user
   */
  const loadVaults = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const fetchedVaults = await getVaultsService(user.id);
      setVaults(fetchedVaults);
    } catch (err: any) {
      console.error('Failed to load vaults:', err);
      setError(err.message || 'Failed to load vaults');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load items for a specific vault
   */
  const loadVaultItems = async (vaultId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const items = await getVaultItems(vaultId);
      setCurrentVaultItems(items);
    } catch (err: any) {
      console.error('Failed to load vault items:', err);
      setError(err.message || 'Failed to load vault items');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new vault
   */
  const createVault = async (vaultData: {
    name: string;
    category: VaultCategory;
    description?: string;
    icon?: string;
    color?: string;
    settings?: Partial<VaultSettings>;
    deathSettings?: Partial<DeathSettings>;
  }): Promise<Vault> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      // Default settings
      const defaultSettings: VaultSettings = {
        autoLock: true,
        autoLockTimeout: 15,
        maxFailedAttempts: 5,
        twoFactorEnabled: false,
      };

      const defaultDeathSettings: DeathSettings = {
        triggerAfterDays: 30,
        notifyContacts: true,
        notifyEmail: [],
        notifySMS: [],
        instructions: '',
      };

      const newVault = await createVaultService(user.id, {
        name: vaultData.name,
        description: vaultData.description,
        category: vaultData.category,
        icon: vaultData.icon,
        color: vaultData.color,
      });

      // Update with settings if provided
      if (vaultData.settings || vaultData.deathSettings) {
        await updateVaultService(newVault.id, {
          settings: { ...defaultSettings, ...vaultData.settings } as any,
          death_settings: { ...defaultDeathSettings, ...vaultData.deathSettings } as any,
        });
      }

      // Audit log
      await createAuditLog(
        user.id,
        'create',
        'vault',
        newVault.id,
        null,
        { name: vaultData.name, category: vaultData.category }
      );

      // Refresh vaults
      await loadVaults();

      return newVault;
    } catch (err: any) {
      console.error('Failed to create vault:', err);
      setError(err.message || 'Failed to create vault');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update a vault
   */
  const updateVault = async (vaultId: string, updates: Partial<Vault>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const oldVault = vaults.find(v => v.id === vaultId);
      await updateVaultService(vaultId, updates);

      // Audit log
      await createAuditLog(
        user.id,
        'update',
        'vault',
        vaultId,
        oldVault as any,
        updates as any
      );

      // Refresh vaults
      await loadVaults();

      // Update current vault if it's the one being updated
      if (currentVault?.id === vaultId) {
        const updatedVault = vaults.find(v => v.id === vaultId);
        if (updatedVault) setCurrentVault(updatedVault);
      }
    } catch (err: any) {
      console.error('Failed to update vault:', err);
      setError(err.message || 'Failed to update vault');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a vault
   */
  const deleteVault = async (vaultId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      await deleteVaultService(vaultId);

      // Audit log
      await createAuditLog(
        user.id,
        'delete',
        'vault',
        vaultId,
        null,
        null
      );

      // Refresh vaults
      await loadVaults();

      // Clear current vault if it was deleted
      if (currentVault?.id === vaultId) {
        setCurrentVault(null);
        setCurrentVaultItems([]);
      }
    } catch (err: any) {
      console.error('Failed to delete vault:', err);
      setError(err.message || 'Failed to delete vault');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Select a vault
   */
  const selectVault = async (vaultId: string | null) => {
    if (!vaultId) {
      setCurrentVault(null);
      setCurrentVaultItems([]);
      return;
    }

    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      setCurrentVault(vault);
      // Items will be loaded by useEffect
    }
  };

  /**
   * Lock a vault
   */
  const lockVault = async (vaultId: string) => {
    await updateVault(vaultId, { is_locked: true });
  };

  /**
   * Unlock a vault
   */
  const unlockVault = async (vaultId: string): Promise<boolean> => {
    try {
      // In a real implementation, you would verify credentials here
      await updateVault(vaultId, { is_locked: false });
      return true;
    } catch (err) {
      console.error('Failed to unlock vault:', err);
      return false;
    }
  };

  /**
   * Refresh vaults
   */
  const refreshVaults = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      setError(null);
      await loadVaults();
    } catch (err: any) {
      console.error('Failed to refresh vaults:', err);
      setError(err.message || 'Failed to refresh vaults');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Add an item to a vault
   */
  const addItem = async (itemData: {
    vaultId: string;
    itemType: string;
    title: string;
    file?: File | Blob;
    metadata?: Record<string, any>;
  }): Promise<VaultItem> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      // Get user's public key for encryption
      const publicKey = await getPublicKey();
      if (!publicKey) throw new Error('Public key not found');

      // Encrypt title
      const titleEncrypted = await encryptData(itemData.title, publicKey);

      // Upload file to Supabase Storage if provided
      let storagePath = '';
      let storageBucket = 'vault-items';
      let fileSize = 0;

      if (itemData.file) {
        const fileName = `${user.id}/${itemData.vaultId}/${Date.now()}.enc`;
        
        // Encrypt file content
        const fileBuffer = await itemData.file.arrayBuffer();
        const encryptedFile = await encryptData(
          Buffer.from(fileBuffer).toString('base64'),
          publicKey
        );

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, encryptedFile);

        if (uploadError) throw uploadError;

        storagePath = fileName;
        fileSize = itemData.file.size;
      }

      // Create vault item in database
      const newItem = await createVaultItem(user.id, itemData.vaultId, {
        item_type: itemData.itemType as any,
        title_encrypted: titleEncrypted,
        storage_path: storagePath,
        storage_bucket: storageBucket,
        file_size: fileSize,
      });

      // Audit log
      await createAuditLog(
        user.id,
        'create',
        'vault_item',
        newItem.id,
        null,
        { vault_id: itemData.vaultId, item_type: itemData.itemType }
      );

      // Refresh items if this is the current vault
      if (currentVault?.id === itemData.vaultId) {
        await loadVaultItems(itemData.vaultId);
      }

      return newItem;
    } catch (err: any) {
      console.error('Failed to add item:', err);
      setError(err.message || 'Failed to add item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update a vault item
   */
  const updateItem = async (itemId: string, updates: Partial<VaultItem>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      await updateVaultItem(itemId, updates);

      // Audit log
      await createAuditLog(
        user.id,
        'update',
        'vault_item',
        itemId,
        null,
        updates as any
      );

      // Refresh items if in current vault
      if (currentVault) {
        await loadVaultItems(currentVault.id);
      }
    } catch (err: any) {
      console.error('Failed to update item:', err);
      setError(err.message || 'Failed to update item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a vault item
   */
  const deleteItem = async (itemId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      // Get item to delete file from storage
      const item = currentVaultItems.find(i => i.id === itemId);
      
      // Delete from storage if exists
      if (item?.storage_path) {
        await supabase.storage
          .from(item.storage_bucket)
          .remove([item.storage_path]);
      }

      // Delete from database
      await deleteVaultItem(itemId);

      // Audit log
      await createAuditLog(
        user.id,
        'delete',
        'vault_item',
        itemId,
        null,
        null
      );

      // Refresh items
      if (currentVault) {
        await loadVaultItems(currentVault.id);
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      setError(err.message || 'Failed to delete item');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Share a vault with another user
   */
  const shareVault = async (
    vaultId: string,
    userId: string,
    permissions: {
      canView: boolean;
      canEdit: boolean;
      canDelete: boolean;
      canShare: boolean;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      // Get recipient's public key
      const { data: recipientData } = await supabase
        .from('users')
        .select('public_key')
        .eq('id', userId)
        .single();

      if (!recipientData?.public_key) {
        throw new Error('Recipient public key not found');
      }

      // Re-encrypt vault key for recipient
      // In a real implementation, you would:
      // 1. Decrypt vault key with your private key
      // 2. Re-encrypt with recipient's public key
      const sharedKeyEncrypted = 'encrypted_key_placeholder';

      // Create shared vault record
      const { error: shareError } = await supabase
        .from('shared_vaults')
        .insert({
          vault_id: vaultId,
          owner_id: user.id,
          shared_with_user_id: userId,
          can_view: permissions.canView,
          can_edit: permissions.canEdit,
          can_delete: permissions.canDelete,
          can_share: permissions.canShare,
          shared_key_encrypted: sharedKeyEncrypted,
        });

      if (shareError) throw shareError;

      // Audit log
      await createAuditLog(
        user.id,
        'share',
        'vault',
        vaultId,
        null,
        { shared_with: userId, permissions }
      );
    } catch (err: any) {
      console.error('Failed to share vault:', err);
      setError(err.message || 'Failed to share vault');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get vault statistics
   */
  const getVaultStats = () => {
    return {
      totalVaults: vaults.length,
      totalItems: currentVaultItems.length,
      sharedVaults: vaults.filter(v => v.is_shared).length,
      lockedVaults: vaults.filter(v => v.is_locked).length,
    };
  };

  const contextValue: VaultContextType = {
    vaults,
    currentVault,
    currentVaultItems,
    isLoading,
    loading: isLoading,
    isRefreshing,
    error,
    createVault,
    updateVault,
    deleteVault,
    selectVault,
    refreshVaults,
    lockVault,
    unlockVault,
    addItem,
    updateItem,
    deleteItem,
    shareVault,
    getVaultStats,
  };

  return (
    <VaultContext.Provider value={contextValue}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
