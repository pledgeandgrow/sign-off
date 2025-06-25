import { 
  VaultCard, 
  VaultHeader, 
  AddVault, 
  AddItem, 
  EditVault, 
  EditItem, 
  ViewItem, 
  VaultItemCard
} from '@/components/vault';
import { useVault } from '@/contexts/VaultContext';
import { Vault, VaultCategory, VaultItem } from '@/types/vault';
import { useTheme } from '@/contexts/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VaultsScreen() {
  const { theme } = useTheme();
  const { 
    vaults, 
    createVault,
    selectVault,
    updateVault,
    refreshVaults,
    loading: isRefreshing,
    deleteItem,
    currentVault
  } = useVault();
  
  const handleBackToVaults = useCallback(() => {
    // Reset both local state and context
    setSelectedVault(null);
    selectVault(null);
  }, [selectVault]);
  
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);
  const [isCreateVaultModalVisible, setIsCreateVaultModalVisible] = useState(false);
  const [isCreateItemModalVisible, setIsCreateItemModalVisible] = useState(false);
  
  const handleCreateVault = useCallback(async (vaultData: { name: string; category: VaultCategory; description?: string }) => {
    try {
      await createVault(vaultData);
      setIsCreateVaultModalVisible(false);
    } catch (error) {
      console.error('Failed to create vault:', error);
      Alert.alert('Error', 'Failed to create vault. Please try again.');
    }
  }, [createVault]);
  
  const handleSelectVault = useCallback((vault: Vault) => {
    // First set the selected vault in local state
    setSelectedVault(vault);
    // Then update the context with the selected vault ID
    selectVault(vault.id);
  }, [selectVault]);
  
  const handleLockVault = useCallback(() => {
    if (selectedVault) {
      // TODO: Implement vault locking logic
      Alert.alert('Vault Locked', `${selectedVault.name} has been locked.`);
    }
  }, [selectedVault]);
  
  const handleAddItem = useCallback(() => {
    setSelectedItem(null);
    setIsCreateItemModalVisible(true);
  }, []);
  
  const handleEditItem = useCallback((item: VaultItem) => {
    setSelectedItem(item);
    setIsCreateItemModalVisible(true);
    setViewingItem(null);
  }, []);

  const handleSelectItem = useCallback((item: VaultItem) => {
    setViewingItem(item);
  }, []);

  const handleCloseViewItem = useCallback(() => {
    setViewingItem(null);
  }, []);

  const { addItem, updateItem } = useVault();

  const handleSubmitItem = useCallback(async (itemData: Partial<VaultItem>) => {
    try {
      if (selectedItem) {
        // Update existing item
        await updateVault(selectedVault?.id || '', {
          items: selectedVault?.items.map(item => 
            item.id === selectedItem.id ? { ...item, ...itemData } : item
          ) || []
        });
      } else if (selectedVault) {
        // Add new item
        const newItem: VaultItem = {
          id: `item-${Date.now()}`,
          type: itemData.type || 'note',
          title: itemData.title || 'Untitled',
          metadata: itemData.metadata || {},
          isEncrypted: false,
          encryptedFields: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await updateVault(selectedVault.id, {
          items: [...(selectedVault.items || []), newItem]
        });
      }
      
      setIsCreateItemModalVisible(false);
      setSelectedItem(null);
      await refreshVaults();
    } catch (error) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  }, [selectedVault, selectedItem, addItem, updateItem]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!selectedVault) return;
    
    try {
      const updatedVault = {
        ...selectedVault,
        items: selectedVault.items.filter(item => item.id !== itemId),
        updatedAt: new Date().toISOString(),
      };
      
      await updateVault(selectedVault.id, updatedVault);
    } catch (error) {
      console.error('Failed to delete item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  }, [selectedVault, updateVault]);
  
  const handleRefresh = useCallback(() => {
    refreshVaults();
  }, [refreshVaults]);
  
  const renderVaultList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vaults</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsCreateVaultModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            colors={['#000000']}
            tintColor="#000000"
          />
        }>
        {vaults.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="folder-special" size={48} color="#999" />
            <Text style={styles.emptyStateText}>No vaults yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first vault to start securing your digital legacy
            </Text>
          </View>
        ) : (
          <View style={styles.vaultsList}>
            {vaults.map((vault) => (
              <View key={vault.id} style={styles.vaultCardWrapper}>
                <VaultCard
                  vault={vault}
                  onPress={() => handleSelectVault(vault)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
  
  const renderVaultDetail = () => {
    if (!selectedVault) return null;
    
    return (
      <View style={styles.container}>
        <VaultHeader 
          vault={selectedVault} 
          onBack={handleBackToVaults}
          onLock={handleLockVault}
          onAddItem={handleAddItem}
          onEdit={() => {
            setSelectedVault(selectedVault);
            setIsCreateVaultModalVisible(true);
          }}
        />
        
        <ScrollView style={styles.vaultContent}>
          {selectedVault.items.length === 0 ? (
            <View style={styles.emptyVaultState}>
              <MaterialIcons name="inbox" size={48} color="rgba(0, 0, 0, 0.5)" />
              <Text style={styles.emptyStateText}>This vault is empty</Text>
              <Text style={styles.emptyStateSubtext}>
                Add items to keep them secure and organized
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleAddItem}
              >
                <Text style={styles.primaryButtonText}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {selectedVault.items.map((item) => (
                <VaultItemCard 
                  key={item.id}
                  item={item}
                  onPress={() => handleSelectItem(item)}
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {selectedVault ? renderVaultDetail() : renderVaultList()}
      
      <Modal
        visible={isCreateVaultModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setIsCreateVaultModalVisible(false);
          setSelectedVault(null);
        }}
      >
        {selectedVault ? (
          <EditVault 
            vault={selectedVault}
            onSave={handleCreateVault}
            onCancel={() => {
              setIsCreateVaultModalVisible(false);
              setSelectedVault(null);
            }}
          />
        ) : (
          <AddVault 
            onSave={handleCreateVault}
            onCancel={() => setIsCreateVaultModalVisible(false)}
          />
        )}
      </Modal>

      <Modal
        visible={isCreateItemModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setIsCreateItemModalVisible(false);
          setSelectedItem(null);
        }}
      >
        {selectedItem ? (
          <EditItem 
            item={selectedItem}
            onSave={handleSubmitItem}
            onCancel={() => {
              setIsCreateItemModalVisible(false);
              setSelectedItem(null);
            }}
          />
        ) : (
          <AddItem 
            onSave={handleSubmitItem}
            onCancel={() => setIsCreateItemModalVisible(false)}
          />
        )}
      </Modal>

      <Modal
        visible={!!viewingItem}
        animationType="slide"
        onRequestClose={handleCloseViewItem}
      >
        {viewingItem && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseViewItem}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                handleEditItem(viewingItem);
                setViewingItem(null);
              }}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            </View>
            <ViewItem 
              item={viewingItem} 
              onEdit={() => {
                handleEditItem(viewingItem);
                setViewingItem(null);
              }} 
            />
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'black',
  },
  addButton: {
    backgroundColor: 'black',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    marginTop: -2,
  },
  vaultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  vaultCardWrapper: {
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  vaultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  vaultContent: {
    flex: 1,
    marginTop: 16,
  },
  emptyVaultState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  itemsList: {
    paddingBottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editButton: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
