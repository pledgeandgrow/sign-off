import { Vault, VaultCategory, VaultItem, VaultEncryptionType } from '@/types/vault';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface VaultContextType {
  vaults: Vault[];
  currentVault: Vault | null;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for backward compatibility
  isRefreshing: boolean;
  error: string | null;
  createVault: (vaultData: { name: string; category: VaultCategory; description?: string }) => Promise<Vault>;
  updateVault: (vaultId: string, updates: Partial<Vault>) => Promise<void>;
  deleteVault: (vaultId: string) => Promise<void>;
  selectVault: (vaultId: string | null) => void;
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<VaultItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  lockVault: () => void;
  unlockVault: (vaultId: string, password?: string) => Promise<boolean>;
  refreshVaults: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [currentVault, setCurrentVault] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load vaults from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadVaults();
    } else {
      setVaults([]);
      setCurrentVault(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadVaults = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log('Loading vaults for user:', user.id);
      
      // Load vaults
      const { data: vaultsData, error: vaultsError } = await supabase
        .from('vaults')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (vaultsError) {
        console.error('Supabase error loading vaults:', vaultsError);
        throw vaultsError;
      }

      console.log('Loaded vaults:', vaultsData?.length || 0);

      // Load all vault items for this user
      const { data: itemsData, error: itemsError } = await supabase
        .from('vault_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Supabase error loading vault items:', itemsError);
        // Don't throw, just log - vaults can exist without items
      }

      console.log('Loaded vault items:', itemsData?.length || 0);

      // Map items to vaults
      const vaultsWithItems = (vaultsData || []).map(vault => {
        const vaultItems = (itemsData || [])
          .filter(item => item.vault_id === vault.id)
          .map(item => ({
            id: item.id,
            title: item.title_encrypted,
            type: item.item_type,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            metadata: item.metadata || {},
            isEncrypted: false,
            tags: item.tags || [],
          }));

        return {
          ...vault,
          items: vaultItems,
          encryptionType: 'none' as VaultEncryptionType,
          createdAt: vault.created_at,
          updatedAt: vault.updated_at,
          isEncrypted: vault.is_encrypted,
          isLocked: vault.is_locked,
        };
      });

      setVaults(vaultsWithItems);
      setError(null);
    } catch (err) {
      console.error('Failed to load vaults:', err);
      setError('Failed to load vaults. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createVault = async (vaultData: { name: string; category: VaultCategory; description?: string }): Promise<Vault> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      
      const vaultToInsert = {
        user_id: user.id,
        name: vaultData.name,
        description: vaultData.description || null,
        category: vaultData.category,
        icon: null,
        color: null,
        settings: {
          autoLock: true,
          autoLockTimeout: 15,
          maxFailedAttempts: 5,
          twoFactorEnabled: false,
        },
        access_control: {
          allowedUsers: [],
          allowedHeirs: [],
          requireApproval: true,
        },
        death_settings: {
          triggerAfterDays: 30,
          notifyContacts: true,
          notifyEmail: [],
          notifySMS: [],
          instructions: '',
        },
        is_encrypted: false,
        is_locked: false,
        is_shared: false,
        is_favorite: false,
        tags: [],
        sort_order: 0,
      };

      console.log('Creating vault:', vaultToInsert);

      const { data, error: insertError } = await supabase
        .from('vaults')
        .insert(vaultToInsert)
        .select()
        .single();

      if (insertError) {
        console.error('Supabase error creating vault:', insertError);
        throw insertError;
      }

      console.log('Vault created successfully:', data);

      const newVault: Vault = {
        ...data,
        items: [],
        encryptionType: 'none',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isEncrypted: data.is_encrypted,
        isLocked: data.is_locked,
      };
      
      setVaults((prev) => [newVault, ...prev]);
      return newVault;
    } catch (err) {
      console.error('Failed to create vault:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectVault = async (vaultId: string | null) => {
    if (!vaultId) {
      setCurrentVault(null);
      return;
    }
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      setCurrentVault(vault);
      // Update last_accessed timestamp
      try {
        await supabase
          .from('vaults')
          .update({ last_accessed: new Date().toISOString() })
          .eq('id', vaultId);
      } catch (err) {
        console.error('Failed to update last_accessed:', err);
      }
    }
  };

  const addItem = async (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentVault || !user) throw new Error('Vault not selected or user not authenticated');

    try {
      setIsLoading(true);
      
      // Generate storage path for the item
      const storagePath = `${user.id}/${currentVault.id}/${Date.now()}_${item.title}`;
      
      const itemToInsert = {
        vault_id: currentVault.id,
        user_id: user.id,
        item_type: item.type,
        storage_path: storagePath,
        storage_bucket: 'vault-items',
        file_size: null,
        title_encrypted: item.title, // TODO: Encrypt later
        metadata: item.metadata || {},
        tags: item.tags || [],
        is_favorite: false,
        password_strength: null,
        password_last_changed: null,
        requires_password_change: false,
      };

      console.log('Creating vault item:', itemToInsert);

      const { data, error } = await supabase
        .from('vault_items')
        .insert(itemToInsert)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating item:', error);
        throw error;
      }

      console.log('Item created successfully:', data);

      const newItem: VaultItem = {
        id: data.id,
        title: data.title_encrypted,
        type: data.item_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        metadata: data.metadata || {},
        isEncrypted: false,
        tags: data.tags,
      };

      // Update local vault with new item
      const updatedVault = {
        ...currentVault,
        items: [...(currentVault.items || []), newItem],
      };
      
      setVaults((prev) => prev.map(v => v.id === currentVault.id ? updatedVault : v));
      setCurrentVault(updatedVault);
    } catch (err) {
      console.error('Failed to add item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: string, updates: Partial<VaultItem>) => {
    if (!currentVault || !user) throw new Error('Vault not selected or user not authenticated');

    try {
      setIsLoading(true);
      
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.title) dbUpdates.title_encrypted = updates.title;
      if (updates.type) dbUpdates.item_type = updates.type;
      if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

      console.log('Updating vault item:', itemId, dbUpdates);

      const { data, error } = await supabase
        .from('vault_items')
        .update(dbUpdates)
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating item:', error);
        throw error;
      }

      console.log('Item updated successfully:', data);

      const updatedItem: VaultItem = {
        id: data.id,
        title: data.title_encrypted,
        type: data.item_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        metadata: {},
        isEncrypted: false,
        tags: data.tags,
      };

      // Update local vault items
      const updatedVault = {
        ...currentVault,
        items: currentVault.items.map(item => item.id === itemId ? updatedItem : item),
      };
      
      setVaults((prev) => prev.map(v => v.id === currentVault.id ? updatedVault : v));
      setCurrentVault(updatedVault);
    } catch (err) {
      console.error('Failed to update item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!currentVault || !user) throw new Error('Vault not selected or user not authenticated');

    try {
      setIsLoading(true);
      
      console.log('Deleting vault item:', itemId);

      // Step 1: Get item data to check for file
      const { data: itemData, error: fetchError } = await supabase
        .from('vault_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching item:', fetchError);
        throw fetchError;
      }

      // Step 2: Delete file from storage if it exists
      if (itemData && itemData.metadata && itemData.metadata.fileUrl) {
        try {
          console.log('Item has file, deleting from storage...');
          
          // Extract file path from URL
          const urlParts = itemData.metadata.fileUrl.split('/');
          const pathIndex = urlParts.findIndex((part: string) => part === 'vault-files');
          
          if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
            const pathParts = urlParts.slice(pathIndex + 1);
            const fullPath = pathParts.join('/').split('?')[0]; // Remove query params
            
            console.log(`Deleting file: ${fullPath}`);
            
            const { error: deleteFileError } = await supabase.storage
              .from('vault-files')
              .remove([fullPath]);
            
            if (deleteFileError) {
              console.error(`⚠️ Error deleting file ${fullPath}:`, deleteFileError);
              // Don't throw, continue with item deletion
            } else {
              console.log(`✅ File deleted: ${fullPath}`);
            }
          }
        } catch (fileError) {
          console.error('⚠️ Error processing file deletion:', fileError);
          // Don't throw, continue with item deletion
        }
      }

      // Step 3: Delete item from database
      const { error } = await supabase
        .from('vault_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting item:', error);
        throw error;
      }

      console.log('Item deleted successfully');

      // Update local vault items
      const updatedVault = {
        ...currentVault,
        items: currentVault.items.filter(item => item.id !== itemId),
      };
      
      setVaults((prev) => prev.map(v => v.id === currentVault.id ? updatedVault : v));
      setCurrentVault(updatedVault);
    } catch (err) {
      console.error('Failed to delete item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const lockVault = async () => {
    if (!currentVault) return;
    
    try {
      const { error } = await supabase
        .from('vaults')
        .update({ 
          is_locked: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentVault.id);

      if (error) throw error;

      const updatedVault = { ...currentVault, isLocked: true };
      setVaults((prev) => prev.map(v => v.id === currentVault.id ? updatedVault : v));
      setCurrentVault(updatedVault);
    } catch (err) {
      console.error('Failed to lock vault:', err);
    }
  };

  const unlockVault = async (vaultId: string, password?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // TODO: Verify password in production
      const vault = vaults.find(v => v.id === vaultId);
      if (!vault) return false;
      
      const { error } = await supabase
        .from('vaults')
        .update({ 
          is_locked: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', vaultId);

      if (error) throw error;

      const updatedVault = { ...vault, isLocked: false };
      setVaults((prev) => prev.map(v => v.id === vaultId ? updatedVault : v));
      setCurrentVault(updatedVault);
      return true;
    } catch (err) {
      console.error('Failed to unlock vault:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshVaults = async () => {
    try {
      setIsRefreshing(true);
      await loadVaults();
    } catch (err) {
      console.error('Failed to refresh vaults:', err);
      setError('Failed to refresh vaults. Please try again.');
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateVault = async (vaultId: string, updates: Partial<Vault>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      
      // Map frontend field names to database field names
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.settings) dbUpdates.settings = updates.settings;
      if (updates.accessControl) dbUpdates.access_control = updates.accessControl;
      if (updates.deathSettings) dbUpdates.death_settings = updates.deathSettings;
      if (updates.isEncrypted !== undefined) dbUpdates.is_encrypted = updates.isEncrypted;
      if (updates.encryptionType !== undefined) dbUpdates.encryption_type = updates.encryptionType;
      if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
      if (updates.is_shared !== undefined) dbUpdates.is_shared = updates.is_shared;
      if (updates.is_favorite !== undefined) dbUpdates.is_favorite = updates.is_favorite;
      if (updates.tags) dbUpdates.tags = updates.tags;
      if (updates.sort_order !== undefined) dbUpdates.sort_order = updates.sort_order;

      console.log('Updating vault:', vaultId, dbUpdates);

      const { data, error } = await supabase
        .from('vaults')
        .update(dbUpdates)
        .eq('id', vaultId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating vault:', error);
        throw error;
      }

      console.log('Vault updated successfully:', data);

      const updatedVault: Vault = {
        ...data,
        items: vaults.find(v => v.id === vaultId)?.items || [],
        encryptionType: 'none',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isEncrypted: data.is_encrypted,
        isLocked: data.is_locked,
      };

      setVaults((prev) => prev.map(v => v.id === vaultId ? updatedVault : v));
      if (currentVault?.id === vaultId) {
        setCurrentVault(updatedVault);
      }
    } catch (err) {
      console.error('Failed to update vault:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVault = async (vaultId: string) => {
    if (!user) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      setIsLoading(true);
      
      console.log('🗑️ Starting vault deletion:', vaultId);
      console.log('User ID:', user.id);

      // Step 1: Delete heir_vault_access records (foreign key constraint)
      console.log('Step 1: Deleting heir_vault_access records...');
      const { data: accessData, error: heirAccessError } = await supabase
        .from('heir_vault_access')
        .delete()
        .eq('vault_id', vaultId)
        .select();

      console.log('Deleted heir_vault_access records:', accessData?.length || 0);
      if (heirAccessError) {
        console.error('❌ Error deleting heir_vault_access:', heirAccessError);
        throw new Error(`Failed to delete vault access records: ${heirAccessError.message}`);
      }

      // Step 2: Delete shared_vaults records (foreign key constraint)
      console.log('Step 2: Deleting shared_vaults records...');
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_vaults')
        .delete()
        .eq('vault_id', vaultId)
        .select();

      console.log('Deleted shared_vaults records:', sharedData?.length || 0);
      if (sharedError) {
        console.error('❌ Error deleting shared_vaults:', sharedError);
        throw new Error(`Failed to delete shared vault records: ${sharedError.message}`);
      }

      // Step 3: Get all vault items to delete their files from storage
      console.log('Step 3: Getting vault items to delete files...');
      const { data: itemsToDelete, error: fetchItemsError } = await supabase
        .from('vault_items')
        .select('*')
        .eq('vault_id', vaultId)
        .eq('user_id', user.id);

      if (fetchItemsError) {
        console.error('❌ Error fetching vault items:', fetchItemsError);
        throw new Error(`Failed to fetch vault items: ${fetchItemsError.message}`);
      }

      // Step 3a: Delete files from storage bucket
      if (itemsToDelete && itemsToDelete.length > 0) {
        console.log(`Step 3a: Deleting ${itemsToDelete.length} files from storage...`);
        
        for (const item of itemsToDelete) {
          // Check if item has a fileUrl in metadata
          if (item.metadata && item.metadata.fileUrl) {
            try {
              // Extract file path from URL
              const urlParts = item.metadata.fileUrl.split('/');
              const pathIndex = urlParts.findIndex(part => part === 'vault-files');
              
              if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
                // Get everything after 'vault-files/' and before query params
                const pathParts = urlParts.slice(pathIndex + 1);
                const fullPath = pathParts.join('/').split('?')[0]; // Remove query params
                
                console.log(`Deleting file: ${fullPath}`);
                
                const { error: deleteFileError } = await supabase.storage
                  .from('vault-files')
                  .remove([fullPath]);
                
                if (deleteFileError) {
                  console.error(`⚠️ Error deleting file ${fullPath}:`, deleteFileError);
                  // Don't throw, continue with other deletions
                } else {
                  console.log(`✅ File deleted: ${fullPath}`);
                }
              }
            } catch (fileError) {
              console.error('⚠️ Error processing file deletion:', fileError);
              // Don't throw, continue with other deletions
            }
          }
        }
      }

      // Step 3b: Delete all vault items from database
      console.log('Step 3b: Deleting vault items from database...');
      const { data: itemsData, error: itemsError } = await supabase
        .from('vault_items')
        .delete()
        .eq('vault_id', vaultId)
        .eq('user_id', user.id)
        .select();

      console.log('Deleted vault items:', itemsData?.length || 0);
      if (itemsError) {
        console.error('❌ Error deleting vault items:', itemsError);
        throw new Error(`Failed to delete vault items: ${itemsError.message}`);
      }

      // Step 4: Delete the vault itself
      console.log('Step 4: Deleting vault...');
      const { data: vaultData, error: vaultError } = await supabase
        .from('vaults')
        .delete()
        .eq('id', vaultId)
        .eq('user_id', user.id)
        .select();

      console.log('Deleted vault:', vaultData);
      if (vaultError) {
        console.error('❌ Supabase error deleting vault:', vaultError);
        throw new Error(`Failed to delete vault: ${vaultError.message}`);
      }

      if (!vaultData || vaultData.length === 0) {
        console.error('❌ No vault was deleted - vault not found or permission denied');
        throw new Error('Vault not found or you do not have permission to delete it');
      }

      console.log('✅ Vault deleted successfully from database');

      // Update local state
      console.log('Updating local state...');
      setVaults((prev) => {
        const filtered = prev.filter(v => v.id !== vaultId);
        console.log('Vaults before:', prev.length, 'after:', filtered.length);
        return filtered;
      });
      
      if (currentVault?.id === vaultId) {
        console.log('Clearing current vault');
        setCurrentVault(null);
      }

      console.log('✅ Vault deletion complete!');
    } catch (err: any) {
      console.error('❌ Failed to delete vault:', err);
      console.error('Error message:', err.message);
      console.error('Error details:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: VaultContextType = {
    vaults,
    currentVault,
    isLoading,
    loading: isLoading,
    isRefreshing,
    error,
    createVault,
    updateVault,
    deleteVault,
    selectVault,
    addItem,
    updateItem,
    deleteItem,
    lockVault,
    unlockVault,
    refreshVaults,
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

