import {
  AddItem,
  AddVault,
  VaultCard,
  VaultHeader,
  VaultItemCard,
  ViewItem
} from '@/components/vault';
import { useVault } from '@/contexts/VaultContext';
import { Vault, VaultCategory, VaultItem } from '@/types/vault';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VaultsScreen() {
  const { 
    vaults, 
    createVault,
    selectVault,
    updateVault,
    refreshVaults,
    loading: isRefreshing
  } = useVault();
  
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);
  const [isCreateVaultModalVisible, setIsCreateVaultModalVisible] = useState(false);
  const [isCreateItemModalVisible, setIsCreateItemModalVisible] = useState(false);
  
  const handleBackToVaults = useCallback(() => {
    setSelectedVault(null);
    selectVault(null);
  }, [selectVault]);
  
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
    setSelectedVault(vault);
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

  const handleSaveItem = useCallback(async (itemData: any) => {
    if (!selectedVault) return;
    
    try {
      if (selectedItem) {
        // Update existing item
        await updateVault(selectedVault.id, {
          ...selectedVault,
          items: selectedVault.items.map(item => 
            item.id === selectedItem.id 
              ? { ...item, ...itemData, updatedAt: new Date().toISOString() }
              : item
          )
        });
      } else {
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
          ...selectedVault,
          items: [...(selectedVault.items || []), newItem],
          updatedAt: new Date().toISOString()
        });
      }
      
      setIsCreateItemModalVisible(false);
      setSelectedItem(null);
      await refreshVaults();
    } catch (error) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  }, [selectedVault, selectedItem, updateVault, refreshVaults]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!selectedVault) return;
    
    try {
      const updatedVault = {
        ...selectedVault,
        items: selectedVault.items.filter(item => item.id !== itemId),
        updatedAt: new Date().toISOString(),
      };
      
      await updateVault(selectedVault.id, updatedVault);
      await refreshVaults();
    } catch (error) {
      console.error('Failed to delete item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  }, [selectedVault, updateVault, refreshVaults]);
  
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
          />
        }
      >
        {vaults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No vaults yet. Create your first vault to get started.</Text>
          </View>
        ) : (
          vaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              onPress={() => handleSelectVault(vault)}
            />
          ))
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
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh} 
            />
          }
        >
          {selectedVault.items?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items in this vault yet. Add your first item.</Text>
            </View>
          ) : (
            selectedVault.items?.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                onPress={() => handleSelectItem(item)}
                onEdit={() => handleEditItem(item)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))
          )}
        </ScrollView>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {selectedVault ? renderVaultDetail() : renderVaultList()}
      
      {/* Create Vault Modal */}
      <Modal
        visible={isCreateVaultModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateVaultModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AddVault
              onSubmit={handleCreateVault}
              onCancel={() => setIsCreateVaultModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
      
      {/* Create/Edit Item Modal */}
      <Modal
        visible={isCreateItemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateItemModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedVault && (
              <AddItem
                vaultId={selectedVault.id}
                initialData={selectedItem || undefined}
                onSubmit={handleSaveItem}
                onCancel={() => {
                  setIsCreateItemModalVisible(false);
                  setSelectedItem(null);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* View Item Modal */}
      <Modal
        visible={!!viewingItem}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseViewItem}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {viewingItem && (
              <ViewItem
                item={viewingItem}
                onEdit={() => {
                  setSelectedItem(viewingItem);
                  setViewingItem(null);
                  setIsCreateItemModalVisible(true);
                }}
                onClose={handleCloseViewItem}
              />
            )}
          </View>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    lineHeight: 26,
    marginTop: -2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
});