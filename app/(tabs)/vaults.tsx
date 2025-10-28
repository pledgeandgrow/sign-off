import {
  AddItem,
  AddVault,
  VaultCard,
  VaultHeader,
  VaultItemCard,
  ViewItem,
  SharedVaultCard
} from '@/components/vault';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';
import { Vault, VaultCategory, VaultItem } from '@/types/vault';
import { canPerformAction } from '@/lib/services/subscriptionService';
import { getSharedVaultsAsHeir, SharedVault } from '@/lib/services/sharedVaultService';
import React, { useCallback, useState, useEffect } from 'react';
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
    deleteVault,
    refreshVaults,
    addItem,
    updateItem,
    deleteItem,
    loading: isRefreshing
  } = useVault();
  
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);
  const [isCreateVaultModalVisible, setIsCreateVaultModalVisible] = useState(false);
  const [isCreateItemModalVisible, setIsCreateItemModalVisible] = useState(false);
  const [sharedVaults, setSharedVaults] = useState<SharedVault[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  
  // Load shared vaults on mount
  useEffect(() => {
    loadSharedVaults();
  }, [user]);

  const loadSharedVaults = async () => {
    if (!user) return;
    setLoadingShared(true);
    try {
      const shared = await getSharedVaultsAsHeir(user.id);
      setSharedVaults(shared);
    } catch (error) {
      console.error('Error loading shared vaults:', error);
    } finally {
      setLoadingShared(false);
    }
  };

  const handleBackToVaults = useCallback(() => {
    setSelectedVault(null);
    selectVault(null);
  }, [selectVault]);
  
  const handleCreateVault = useCallback(async (vaultData: { name: string; category: VaultCategory; description?: string }) => {
    if (!user) {
      Alert.alert('Erreur', 'Veuillez vous connecter');
      return;
    }

    // Check if user can create vault (free tier limit)
    const { allowed, reason } = await canPerformAction(user.id, 'create_vault');
    if (!allowed) {
      Alert.alert(
        'Limite atteinte',
        reason,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Passer au Premium', onPress: () => {
            // Navigate to home screen where upgrade button is
            setIsCreateVaultModalVisible(false);
          }}
        ]
      );
      return;
    }

    try {
      await createVault(vaultData);
      setIsCreateVaultModalVisible(false);
    } catch (error) {
      console.error('Failed to create vault:', error);
      Alert.alert('Error', 'Failed to create vault. Please try again.');
    }
  }, [createVault, user]);
  
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

  const handleDeleteVault = useCallback(async (vaultId: string) => {
    if (!selectedVault) return;

    Alert.alert(
      'Supprimer le coffre-fort',
      `Êtes-vous sûr de vouloir supprimer "${selectedVault.name}" ? Tous les éléments seront supprimés. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting vault deletion:', vaultId);
              await deleteVault(vaultId);
              console.log('Vault deleted, closing view...');
              setSelectedVault(null);
              console.log('Refreshing vaults...');
              await refreshVaults();
              console.log('Vaults refreshed successfully');
              Alert.alert('Succès', 'Coffre-fort supprimé avec succès');
            } catch (error: any) {
              console.error('Failed to delete vault:', error);
              console.error('Error details:', error.message, error.code);
              Alert.alert('Erreur', `Échec de la suppression: ${error.message || 'Erreur inconnue'}`);
            }
          },
        },
      ]
    );
  }, [selectedVault, deleteVault, refreshVaults]);
  
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

  const handleDeleteItem = useCallback(async (itemId: string, closeModal: boolean = false) => {
    if (!selectedVault) return;
    
    Alert.alert(
      'Supprimer l\'élément',
      'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(itemId);
              
              // Close modal if viewing item
              if (closeModal) {
                setViewingItem(null);
              }
              
              await refreshVaults();
              Alert.alert('Succès', 'Élément supprimé avec succès');
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Erreur', 'Échec de la suppression. Veuillez réessayer.');
            }
          },
        },
      ]
    );
  }, [selectedVault, deleteItem, refreshVaults]);
  
  const handleRefresh = useCallback(() => {
    refreshVaults();
    loadSharedVaults();
  }, [refreshVaults]);

  // Calculate vault statistics
  const totalItems = vaults.reduce((sum, vault) => sum + (vault.items?.length || 0), 0);
  const totalVaults = vaults.length;
  const totalSharedVaults = sharedVaults.length;
  
  const renderVaultList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Mes Coffres-forts</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gérez vos données sécurisées
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.purple.primary }]}
          onPress={() => setIsCreateVaultModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <View style={styles.statIconContainer}>
            <MaterialCommunityIcons name="lock" size={20} color={colors.purple.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalVaults}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Coffres-forts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <View style={styles.statIconContainer}>
            <MaterialCommunityIcons name="file-document" size={20} color={colors.purple.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalItems}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Éléments</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <View style={styles.statIconContainer}>
            <MaterialCommunityIcons name="shield-check" size={20} color={colors.purple.primary} />
          </View>
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
        {/* My Vaults Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Mes coffres-forts
          </Text>
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
        </View>

        {/* Shared Vaults Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Coffres-forts partagés
            </Text>
            {totalSharedVaults > 0 && (
              <View style={[styles.sharedBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <MaterialCommunityIcons name="account-heart" size={16} color={colors.purple.primary} />
                <Text style={[styles.sharedBadgeText, { color: colors.purple.primary }]}>
                  {totalSharedVaults}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Coffres-forts hérités de proches décédés
          </Text>
          
          {loadingShared ? (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="loading" size={32} color={colors.purple.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Chargement...
              </Text>
            </View>
          ) : totalSharedVaults === 0 ? (
            <View style={styles.emptySharedState}>
              <View style={[styles.emptySharedIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <MaterialCommunityIcons name="account-heart-outline" size={40} color={colors.purple.primary} />
              </View>
              <Text style={[styles.emptySharedTitle, { color: colors.text }]}>
                Aucun coffre-fort partagé
              </Text>
              <Text style={[styles.emptySharedText, { color: colors.textSecondary }]}>
                Les coffres-forts hérités de vos proches apparaîtront ici après vérification du décès
              </Text>
            </View>
          ) : (
            <View style={styles.vaultsList}>
              {sharedVaults.map((vault) => (
                <SharedVaultCard
                  key={vault.id}
                  vault={vault}
                  onPress={() => handleSelectVault(vault as Vault)}
                />
              ))}
            </View>
          )}
        </View>
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
              style={[styles.headerActionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
              onPress={() => handleDeleteVault(selectedVault.id)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
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
        transparent={false}
        onRequestClose={handleCloseViewItem}
      >
        {viewingItem && (
          <ViewItem
            item={viewingItem}
            onEdit={() => {
              setSelectedItem(viewingItem);
              setViewingItem(null);
              setIsCreateItemModalVisible(true);
            }}
            onDelete={() => {
              handleDeleteItem(viewingItem.id, true); // true = close modal after delete
            }}
            onBack={handleCloseViewItem}
          />
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
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
    paddingHorizontal: 20,
    paddingBottom: 120,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  sharedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptySharedState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptySharedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptySharedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySharedText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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