import { Vault, VaultCategory, VaultItem } from '@/types/vault';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

const VAULT_STORAGE_KEY = '@vaults_data';

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
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [currentVault, setCurrentVault] = useState<Vault | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load vaults from AsyncStorage on mount
  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
      setIsLoading(true);
      const storedVaults = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (storedVaults) {
        setVaults(JSON.parse(storedVaults));
      }
    } catch (err) {
      console.error('Failed to load vaults:', err);
      setError('Failed to load vaults. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save vaults to AsyncStorage whenever they change
  const saveVaults = useCallback(async (vaultsToSave: Vault[]) => {
    try {
      await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vaultsToSave));
    } catch (err) {
      console.error('Failed to save vaults:', err);
      throw new Error('Failed to save vaults');
    }
  }, []);

  const createVault = async (vaultData: { name: string; category: VaultCategory; description?: string }): Promise<Vault> => {
    try {
      setIsLoading(true);
      
      const newVault: Vault = {
        id: `vault-${Date.now()}`,
        name: vaultData.name,
        description: vaultData.description,
        category: vaultData.category,
        isEncrypted: false,
        encryptionType: 'none',
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        settings: {
          autoLock: true,
          autoLockTimeout: 15,
          maxFailedAttempts: 5,
          twoFactorEnabled: false,
        },
        accessControl: {
          allowedUsers: [],
          allowedHeirs: [],
          requireApproval: true,
        },
        deathSettings: {
          triggerAfterDays: 30,
          notifyContacts: true,
          notifyEmail: [],
          notifySMS: [],
          instructions: '',
        },
        tags: []
      };
      
      const updatedVaults = [...vaults, newVault];
      await saveVaults(updatedVaults);
      setVaults(updatedVaults);
      return newVault;
    } catch (err) {
      console.error('Failed to create vault:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectVault = (vaultId: string | null) => {
    if (!vaultId) {
      setCurrentVault(null);
      return;
    }
    const vault = vaults.find(v => v.id === vaultId);
    if (vault) {
      setCurrentVault(vault);
    }
  };

  const addItem = async (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentVault) return;

    try {
      setIsLoading(true);
      const newItem: VaultItem = {
        ...item,
        id: `item-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedVault = {
        ...currentVault,
        items: [...currentVault.items, newItem],
        updatedAt: new Date().toISOString(),
      };

      const updatedVaults = vaults.map(v => 
        v.id === currentVault.id ? updatedVault : v
      );
      
      await saveVaults(updatedVaults);
      setVaults(updatedVaults);
      setCurrentVault(updatedVault);
    } catch (err) {
      console.error('Failed to add item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: string, updates: Partial<VaultItem>) => {
    if (!currentVault) return;

    try {
      setIsLoading(true);
      
      const updatedVault = {
        ...currentVault,
        items: currentVault.items.map(item => 
          item.id === itemId 
            ? { ...item, ...updates, updatedAt: new Date().toISOString() } 
            : item
        ),
        updatedAt: new Date().toISOString(),
      };

      const updatedVaults = vaults.map(v => 
        v.id === currentVault.id ? updatedVault : v
      );
      
      await saveVaults(updatedVaults);
      setVaults(updatedVaults);
      setCurrentVault(updatedVault);
    } catch (err) {
      console.error('Failed to update item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!currentVault) return;

    try {
      setIsLoading(true);
      
      const updatedVault = {
        ...currentVault,
        items: currentVault.items.filter(item => item.id !== itemId),
        updatedAt: new Date().toISOString(),
      };

      const updatedVaults = vaults.map(v => 
        v.id === currentVault.id ? updatedVault : v
      );
      
      await saveVaults(updatedVaults);
      setVaults(updatedVaults);
      setCurrentVault(updatedVault);
    } catch (err) {
      console.error('Failed to delete item:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const lockVault = () => {
    if (!currentVault) return;
    
    const updatedVault = { 
      ...currentVault, 
      isLocked: true,
      updatedAt: new Date().toISOString()
    };
    
    const updatedVaults = vaults.map(v => 
      v.id === currentVault.id ? updatedVault : v
    );
    
    setVaults(updatedVaults);
    setCurrentVault(updatedVault);
    saveVaults(updatedVaults).catch(console.error);
  };

  const unlockVault = async (vaultId: string, password?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // In a real app, you would verify the password here
      const vault = vaults.find(v => v.id === vaultId);
      if (!vault) return false;
      
      const updatedVault = { 
        ...vault, 
        isLocked: false,
        updatedAt: new Date().toISOString()
      };
      
      const updatedVaults = vaults.map(v => 
        v.id === vaultId ? updatedVault : v
      );
      
      await saveVaults(updatedVaults);
      setVaults(updatedVaults);
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
      const storedVaults = await AsyncStorage.getItem(VAULT_STORAGE_KEY);
      if (storedVaults) {
        setVaults(JSON.parse(storedVaults));
      }
    } catch (err) {
      console.error('Failed to refresh vaults:', err);
      setError('Failed to refresh vaults. Please try again.');
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateVault = async (vaultId: string, updates: Partial<Vault>) => {
    try {
      setIsLoading(true);
      const updatedVaults = vaults.map(v => 
        v.id === vaultId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      );
      await saveVaults(updatedVaults);
      setVaults(updatedVaults);
      if (currentVault?.id === vaultId) {
        setCurrentVault(updatedVaults.find(v => v.id === vaultId) || null);
      }
    } catch (err) {
      console.error('Failed to update vault:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVault = async (vaultId: string) => {
    try {
      setIsLoading(true);
      const updatedVaults = vaults.filter(v => v.id !== vaultId);
      await saveVaults(updatedVaults);
      setVaults(updatedVaults);
      if (currentVault?.id === vaultId) {
        setCurrentVault(null);
      }
    } catch (err) {
      console.error('Failed to delete vault:', err);
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

