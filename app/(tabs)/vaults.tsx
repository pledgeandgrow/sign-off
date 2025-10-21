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
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function VaultsScreen() {
  const { 
    vaults, 
    createVault,
    selectVault,
    updateVault,
    refreshVaults,
    addItem,
    updateItem,
    deleteItem,
    loading: isRefreshing
  } = useVault();
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
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
        // Update existing item using VaultContext
        await updateItem(selectedItem.id, {
          title: itemData.title || selectedItem.title,
          type: itemData.type || selectedItem.type,
          tags: itemData.tags || selectedItem.tags,
        });
      } else {
        // Add new item using VaultContext
        await addItem({
          title: itemData.title || 'Untitled',
          type: itemData.type || 'note',
          metadata: itemData.metadata || {},
          isEncrypted: false,
          tags: itemData.tags || [],
        });
      }
      
      setIsCreateItemModalVisible(false);
      setSelectedItem(null);
      await refreshVaults();
      Alert.alert('Success', selectedItem ? 'Item updated successfully' : 'Item added successfully');
    } catch (error) {
      console.error('Failed to save item:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  }, [selectedVault, selectedItem, addItem, updateItem, refreshVaults]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!selectedVault) return;
    
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(itemId);
              await refreshVaults();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  }, [selectedVault, deleteItem, refreshVaults]);
  
  const handleRefresh = useCallback(() => {
    refreshVaults();
  }, [refreshVaults]);

  // Calculate vault statistics
  const totalItems = vaults.reduce((sum, vault) => sum + (vault.items?.length || 0), 0);
  const totalVaults = vaults.length;
  
  const renderVaultList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Mes Coffres-forts</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gérez vos données sécurisées
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.purple.primary }]}
          onPress={() => setIsCreateVaultModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <MaterialCommunityIcons name="lock" size={20} color={colors.purple.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalVaults}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Coffres-forts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <MaterialCommunityIcons name="file-document" size={20} color={colors.purple.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalItems}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Éléments</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <MaterialCommunityIcons name="shield-check" size={20} color={colors.purple.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>100%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sécurisé</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh}
            tintColor={colors.purple.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {vaults.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyStateIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MaterialCommunityIcons name="lock-plus" size={48} color={colors.purple.primary} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              Aucun coffre-fort
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Créez votre premier coffre-fort pour commencer à sécuriser vos données
            </Text>
            <TouchableOpacity 
              style={[styles.emptyStateButton, { backgroundColor: colors.purple.primary }]}
              onPress={() => setIsCreateVaultModalVisible(true)}
            >
              <Text style={styles.emptyStateButtonText}>Créer un coffre-fort</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.vaultsList}>
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
    </View>
  );

  const renderVaultDetail = () => {
    if (!selectedVault) return null;
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        
        {/* Custom Vault Header */}
        <View style={styles.vaultHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToVaults}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.vaultHeaderContent}>
            <Text style={[styles.vaultTitle, { color: colors.text }]}>{selectedVault.name}</Text>
            <Text style={[styles.vaultSubtitle, { color: colors.textSecondary }]}>
              {selectedVault.items?.length || 0} éléments
            </Text>
          </View>
          <View style={styles.vaultHeaderActions}>
            <TouchableOpacity 
              style={[styles.headerActionButton, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
              onPress={handleLockVault}
            >
              <MaterialCommunityIcons name="lock" size={20} color={colors.purple.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerActionButton, { backgroundColor: colors.purple.primary }]}
              onPress={handleAddItem}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.purple.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {selectedVault.items?.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyStateIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <MaterialCommunityIcons name="file-plus" size={48} color={colors.purple.primary} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Aucun élément
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Ajoutez votre premier élément à ce coffre-fort
              </Text>
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: colors.purple.primary }]}
                onPress={handleAddItem}
              >
                <Text style={styles.emptyStateButtonText}>Ajouter un élément</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {selectedVault.items?.map((item) => (
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {selectedVault ? renderVaultDetail() : renderVaultList()}
      
      {/* Create Vault Modal */}
      <Modal
        visible={isCreateVaultModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateVaultModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <AddVault
              onSave={handleCreateVault}
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
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            {selectedVault && (
              <AddItem
                initialData={selectedItem || undefined}
                onSave={handleSaveItem}
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
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            {viewingItem && (
              <ViewItem
                item={viewingItem}
                onEdit={() => {
                  setSelectedItem(viewingItem);
                  setViewingItem(null);
                  setIsCreateItemModalVisible(true);
                }}
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
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Augmenté pour éviter que le contenu soit caché par la tab bar
  },
  vaultsList: {
    gap: 12,
  },
  itemsList: {
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vaultHeaderContent: {
    flex: 1,
  },
  vaultTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  vaultSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  vaultHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});