import { VaultCard, VaultForm, VaultHeader, VaultItemCard, VaultItemForm } from '@/components/vault';
import { useVault } from '@/contexts/VaultContext';
import { Vault, VaultCategory, VaultItem } from '@/types/vault';
import { MaterialIcons } from '@expo/vector-icons';
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
    isRefreshing
  } = useVault();
  
  const [isCreateVaultModalVisible, setIsCreateVaultModalVisible] = useState(false);
  const [isCreateItemModalVisible, setIsCreateItemModalVisible] = useState(false);
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  
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
  }, []);

  const { addItem, updateItem } = useVault();

  const handleSubmitItem = useCallback(async (itemData: any) => {
    if (!selectedVault) return;
    
    try {
      if (selectedItem) {
        // Update existing item
        await updateItem(selectedItem.id, {
          title: itemData.title,
          type: itemData.type,
          metadata: itemData.metadata,
        });
      } else {
        // Add new item
        await addItem({
          title: itemData.title,
          type: itemData.type,
          metadata: itemData.metadata,
          isEncrypted: true,
        });
      }

      setIsCreateItemModalVisible(false);
      setSelectedItem(null);
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={isRefreshing} 
          onRefresh={handleRefresh} 
        />
      }>
        <View style={styles.header}>
          <Text style={styles.title}>My Vaults</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsCreateVaultModalVisible(true)}
          >
            <MaterialIcons name="add" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {vaults.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="folder-special" size={48} color="#666" />
            <Text style={styles.emptyStateText}>No vaults yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first vault to start securing your digital legacy
            </Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setIsCreateVaultModalVisible(true)}
            >
              <Text style={styles.primaryButtonText}>Create Vault</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.vaultsGrid}>
            {vaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onPress={() => handleSelectVault(vault)}
              />
            ))}
          </View>
        )}
      </ScrollView>
  );
  
  const renderVaultDetail = () => {
    if (!selectedVault) return null;
    
    return (
      <View style={styles.container}>
        <VaultHeader 
          vault={selectedVault} 
          onBack={() => setSelectedVault(null)}
          onLock={handleLockVault}
          onAddItem={handleAddItem}
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
                  onPress={() => handleEditItem(item)}
                  onLongPress={() => {
                    Alert.alert(
                      'Delete Item',
                      'Are you sure you want to delete this item?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(item.id) },
                      ]
                    );
                  }}
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
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCreateVaultModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <VaultForm
            initialData={{
              name: '',
              description: '',
              category: 'share_after_death'
            }}
            onSubmit={handleCreateVault}
            onCancel={() => setIsCreateVaultModalVisible(false)}
          />
        </View>
      </Modal>

      <Modal
        visible={isCreateItemModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsCreateItemModalVisible(false);
          setSelectedItem(null);
        }}
      >
        <View style={styles.modalContainer}>
          <VaultItemForm
            initialData={selectedItem || undefined}
            onSubmit={handleSubmitItem}
            onCancel={() => {
              setIsCreateItemModalVisible(false);
              setSelectedItem(null);
            }}
          />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  addButton: {
    backgroundColor: 'black',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: 'black',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
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
    backgroundColor: 'white',
    padding: 16,
  },
});
