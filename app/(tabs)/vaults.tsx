import {
  AddItem,
  AddVault,
  VaultCard,
  VaultHeader,
  VaultItemCard,
  ViewItem,
  SharedVaultCard,
  EditVaultCategory,
  SetVaultPassword,
  RemoveVaultPassword,
  UnlockVault
} from '@/components/vault';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';
import { Vault, VaultCategory, VaultItem } from '@/types/vault';
import { canPerformAction } from '@/lib/services/subscriptionService';
import { getSharedVaultsAsHeir, SharedVault } from '@/lib/services/sharedVaultService';
import { hashPassword, verifyPassword } from '@/lib/crypto/passwordHash';
import React, { useCallback, useState, useEffect } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';

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
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);
  const [isCreateVaultModalVisible, setIsCreateVaultModalVisible] = useState(false);
  const [isCreateItemModalVisible, setIsCreateItemModalVisible] = useState(false);
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] = useState(false);
  const [isSetPasswordModalVisible, setIsSetPasswordModalVisible] = useState(false);
  const [isRemovePasswordModalVisible, setIsRemovePasswordModalVisible] = useState(false);
  const [isUnlockModalVisible, setIsUnlockModalVisible] = useState(false);
  const [vaultToUnlock, setVaultToUnlock] = useState<Vault | null>(null);
  const [unlockError, setUnlockError] = useState<string>('');
  const [isLegacyVaultModalVisible, setIsLegacyVaultModalVisible] = useState(false);
  const [legacyVault, setLegacyVault] = useState<Vault | null>(null);
  const [isSubscriptionLimitModalVisible, setIsSubscriptionLimitModalVisible] = useState(false);
  const [subscriptionLimitReason, setSubscriptionLimitReason] = useState('');
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [sharedVaults, setSharedVaults] = useState<SharedVault[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [isDeleteItemModalVisible, setIsDeleteItemModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; closeModal: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<VaultCategory | 'all'>('all');
  
  // Load shared vaults on mount
  useEffect(() => {
    loadSharedVaults();
  }, [user]);

  // Auto-update selectedVault when vaults change
  useEffect(() => {
    if (selectedVault && vaults.length > 0) {
      const updatedVault = vaults.find(v => v.id === selectedVault.id);
      if (updatedVault && JSON.stringify(updatedVault.items) !== JSON.stringify(selectedVault.items)) {
        console.log('Auto-updating selectedVault with fresh data');
        setSelectedVault(updatedVault);
      }
    }
  }, [vaults]);

  // Auto-open create vault modal if openCreate param is present
  useEffect(() => {
    if (params.openCreate === 'true') {
      setIsCreateVaultModalVisible(true);
      // Clean the URL parameter after opening the modal
      router.setParams({ openCreate: undefined });
    }
  }, [params.openCreate]);

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
    console.log('handleCreateVault called with:', vaultData);
    
    if (!user) {
      console.log('No user found');
      Alert.alert('Erreur', 'Veuillez vous connecter');
      return;
    }

    console.log('Checking subscription limits...');
    // Check if user can create vault (free tier limit)
    const { allowed, reason } = await canPerformAction(user.id, 'create_vault');
    console.log('Subscription check result:', { allowed, reason });
    
    if (!allowed) {
      setSubscriptionLimitReason(reason || 'Limite atteinte');
      setIsSubscriptionLimitModalVisible(true);
      return;
    }

    try {
      console.log('Creating vault...');
      await createVault(vaultData);
      console.log('Vault created successfully');
      setIsCreateVaultModalVisible(false);
    } catch (error) {
      console.error('Failed to create vault:', error);
      Alert.alert('Error', 'Failed to create vault. Please try again.');
    }
  }, [createVault, user]);
  
  const handleSelectVault = useCallback((vault: Vault) => {
    // Check if vault is encrypted
    if (vault.isEncrypted) {
      // Check if vault has password hash (legacy vaults might not have it)
      const passwordHash = (vault.settings as any).passwordHash;
      const passwordSalt = (vault.settings as any).passwordSalt;
      
      if (!passwordHash || !passwordSalt) {
        // Legacy vault marked as encrypted but no hash - allow access and offer to set password
        console.log('Legacy encrypted vault without hash, allowing access');
        setLegacyVault(vault);
        setIsLegacyVaultModalVisible(true);
        return;
      }
      
      // Show unlock modal
      setVaultToUnlock(vault);
      setUnlockError(''); // Clear any previous errors
      setIsUnlockModalVisible(true);
    } else {
      // Open vault directly
      setSelectedVault(vault);
      selectVault(vault.id);
    }
  }, [selectVault, updateVault]);

  const handleUnlockVault = useCallback(async (password: string) => {
    if (!vaultToUnlock) return;
    
    try {
      console.log('Verifying password...');
      
      // Get stored hash and salt from vault settings
      const passwordHash = (vaultToUnlock.settings as any).passwordHash;
      const passwordSalt = (vaultToUnlock.settings as any).passwordSalt;
      
      if (!passwordHash || !passwordSalt) {
        console.error('No password hash or salt found');
        setUnlockError('Configuration du mot de passe invalide');
        return;
      }
      
      // Verify the password
      const isValid = await verifyPassword(password, passwordHash, passwordSalt);
      
      if (isValid) {
        console.log('Password verified, unlocking vault');
        setIsUnlockModalVisible(false);
        setUnlockError('');
        setSelectedVault(vaultToUnlock);
        selectVault(vaultToUnlock.id);
        setVaultToUnlock(null);
      } else {
        console.log('Invalid password');
        setUnlockError('Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Failed to verify password:', error);
      setUnlockError('Échec de la vérification du mot de passe');
    }
  }, [vaultToUnlock, selectVault]);
  
  const handleSetPassword = useCallback(() => {
    if (selectedVault?.isEncrypted) {
      // Vault already has a password, show remove password modal
      setIsRemovePasswordModalVisible(true);
    } else {
      // No password set, show set password modal
      setIsSetPasswordModalVisible(true);
    }
  }, [selectedVault]);

  const handleSavePassword = useCallback(async (password: string) => {
    if (!selectedVault) {
      console.log('No selected vault');
      return;
    }
    
    console.log('Setting password for vault:', selectedVault.id);
    
    try {
      // Hash the password with a salt
      console.log('Hashing password...');
      const { hash, salt } = await hashPassword(password);
      console.log('Password hashed successfully');
      console.log('Hash:', hash);
      console.log('Salt:', salt);
      
      // Store the hash and salt in the vault settings
      console.log('Current vault settings:', selectedVault.settings);
      const updatedSettings = {
        ...selectedVault.settings,
        passwordHash: hash,
        passwordSalt: salt,
      };
      console.log('Updated settings to save:', updatedSettings);
      
      await updateVault(selectedVault.id, { 
        isEncrypted: true,
        settings: updatedSettings
      });
      console.log('Vault updated successfully');
      
      // Update selectedVault immediately with new data
      const updatedVaultData = {
        ...selectedVault,
        isEncrypted: true,
        settings: updatedSettings
      };
      setSelectedVault(updatedVaultData);
      
      setIsSetPasswordModalVisible(false);
      console.log('Refreshing vaults...');
      await refreshVaults();
      console.log('Vaults refreshed');
    } catch (error) {
      console.error('Failed to set vault password:', error);
      Alert.alert('Erreur', `Échec de la définition du mot de passe: ${error}`);
    }
  }, [selectedVault, updateVault, refreshVaults]);

  const handleRemovePassword = useCallback(async (password: string) => {
    if (!selectedVault) return;
    
    try {
      console.log('Verifying password before removal...');
      
      // Get stored hash and salt from vault settings
      const passwordHash = (selectedVault.settings as any).passwordHash;
      const passwordSalt = (selectedVault.settings as any).passwordSalt;
      
      if (!passwordHash || !passwordSalt) {
        console.error('No password hash or salt found');
        Alert.alert('Erreur', 'Configuration du mot de passe invalide');
        return;
      }
      
      // Verify the password
      const isValid = await verifyPassword(password, passwordHash, passwordSalt);
      
      if (!isValid) {
        console.log('Invalid password');
        Alert.alert('Erreur', 'Mot de passe incorrect');
        return;
      }
      
      console.log('Password verified, removing protection...');
      
      // Remove hash and salt from settings
      const updatedSettings = {
        ...selectedVault.settings,
        passwordHash: undefined,
        passwordSalt: undefined,
      };
      
      await updateVault(selectedVault.id, { 
        isEncrypted: false,
        settings: updatedSettings
      });
      
      // Update selectedVault immediately with new data
      const updatedVaultData = {
        ...selectedVault,
        isEncrypted: false,
        settings: updatedSettings
      };
      setSelectedVault(updatedVaultData);
      
      setIsRemovePasswordModalVisible(false);
      await refreshVaults();
    } catch (error) {
      console.error('Failed to remove vault password:', error);
      Alert.alert('Erreur', 'Échec de la suppression du mot de passe');
    }
  }, [selectedVault, updateVault, refreshVaults]);

  const handleDeleteVault = useCallback(async (vaultId: string) => {
    if (!selectedVault) return;
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeletePasswordError('');
    setShowDeletePassword(false);
    setIsDeleteConfirmModalVisible(true);
  }, [selectedVault]);

  const confirmDeleteVault = useCallback(async () => {
    if (!selectedVault) return;

    // If vault is encrypted, verify password first
    if (selectedVault.isEncrypted) {
      const passwordHash = (selectedVault.settings as any).passwordHash;
      const passwordSalt = (selectedVault.settings as any).passwordSalt;
      
      if (!passwordHash || !passwordSalt) {
        setDeletePasswordError('Configuration du mot de passe invalide');
        return;
      }
      
      if (!deletePassword) {
        setDeletePasswordError('Veuillez entrer le mot de passe');
        return;
      }
      
      try {
        const isValid = await verifyPassword(deletePassword, passwordHash, passwordSalt);
        
        if (!isValid) {
          setDeletePasswordError('Mot de passe incorrect');
          return;
        }
      } catch (error) {
        setDeletePasswordError('Erreur lors de la vérification du mot de passe');
        return;
      }
    }

    setIsDeleteConfirmModalVisible(false);
    
    try {
      console.log('Starting vault deletion:', selectedVault.id);
      await deleteVault(selectedVault.id);
      console.log('Vault deleted, closing view...');
      setSelectedVault(null);
      console.log('Refreshing vaults...');
      await refreshVaults();
      console.log('Vaults refreshed successfully');
    } catch (error: any) {
      console.error('Failed to delete vault:', error);
      console.error('Error details:', error.message, error.code);
    }
  }, [selectedVault, deleteVault, refreshVaults, deletePassword]);
  
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
          metadata: itemData.metadata || selectedItem.metadata,
          tags: itemData.tags || selectedItem.tags,
        });
      } else {
        // Add new item using VaultContext
        await addItem({
          title: itemData.title || 'Untitled',
          type: itemData.type || 'note',
          metadata: itemData.metadata || {},
          isEncrypted: itemData.isEncrypted !== undefined ? itemData.isEncrypted : false,
          encryptedFields: itemData.encryptedFields || [],
          tags: itemData.tags || [],
        });
      }
      
      setIsCreateItemModalVisible(false);
      setSelectedItem(null);
      
      // Refresh vaults - useEffect will auto-update selectedVault
      await refreshVaults();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  }, [selectedVault, selectedItem, addItem, updateItem, refreshVaults]);

  const handleDeleteItem = useCallback((itemId: string, closeModal: boolean = false) => {
    if (!selectedVault) return;
    
    setItemToDelete({ id: itemId, closeModal });
    setIsDeleteItemModalVisible(true);
  }, [selectedVault]);

  const confirmDeleteItem = useCallback(async () => {
    if (!itemToDelete) return;
    
    try {
      await deleteItem(itemToDelete.id);
      
      // Close modal if viewing item
      if (itemToDelete.closeModal) {
        setViewingItem(null);
      }
      
      setIsDeleteItemModalVisible(false);
      setItemToDelete(null);
      await refreshVaults();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }, [itemToDelete, deleteItem, refreshVaults]);
  
  const handleRefresh = useCallback(() => {
    refreshVaults();
    loadSharedVaults();
  }, [refreshVaults]);

  const handleUpdateCategory = useCallback(async (category: VaultCategory) => {
    if (!selectedVault) return;
    
    try {
      await updateVault(selectedVault.id, { category });
      setIsEditCategoryModalVisible(false);
      await refreshVaults();
      // Update local selected vault
      const updatedVault = vaults.find(v => v.id === selectedVault.id);
      if (updatedVault) {
        setSelectedVault(updatedVault);
      }
      Alert.alert('Succès', 'Catégorie mise à jour avec succès');
    } catch (error) {
      console.error('Failed to update vault category:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour de la catégorie');
    }
  }, [selectedVault, updateVault, refreshVaults, vaults]);

  // Calculate vault statistics
  const totalItems = vaults.reduce((sum, vault) => sum + (vault.items?.length || 0), 0);
  const totalVaults = vaults.length;
  const totalSharedVaults = sharedVaults.length;
  const securedVaults = vaults.filter(vault => vault.isEncrypted).length;
  const securityPercentage = totalVaults > 0 ? Math.round((securedVaults / totalVaults) * 100) : 0;
  
  // Filter vaults
  const filteredVaults = vaults.filter(vault => {
    const matchesSearch = vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vault.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || vault.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  
  const categories: Array<{ value: VaultCategory | 'all'; label: string; icon: string }> = [
    { value: 'all' as const, label: 'Tous', icon: 'view-grid' },
    { value: 'personal' as VaultCategory, label: 'Personnel', icon: 'account' },
    { value: 'work' as VaultCategory, label: 'Travail', icon: 'briefcase' },
    { value: 'family' as VaultCategory, label: 'Famille', icon: 'home-heart' },
    { value: 'finance' as VaultCategory, label: 'Finance', icon: 'cash' },
    { value: 'health' as VaultCategory, label: 'Santé', icon: 'medical-bag' },
    { value: 'other' as VaultCategory, label: 'Autre', icon: 'dots-horizontal' },
  ];
  
  const renderVaultList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Mes Coffres-forts</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {filteredVaults.length} coffre{filteredVaults.length > 1 ? 's' : ''}
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
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un coffre..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: filterCategory === cat.value ? colors.purple.primary : 'rgba(255, 255, 255, 0.05)',
                  borderColor: filterCategory === cat.value ? colors.purple.primary : 'rgba(255, 255, 255, 0.1)'
                }
              ]}
              onPress={() => setFilterCategory(cat.value)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={cat.icon as any} 
                size={16} 
                color={filterCategory === cat.value ? '#FFFFFF' : colors.textSecondary} 
              />
              <Text style={[
                styles.filterChipText,
                { color: filterCategory === cat.value ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.purple.primary + '20' }]}>
            <MaterialCommunityIcons name="lock" size={24} color={colors.purple.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalVaults}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Coffres</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#3B82F620' }]}>
            <MaterialCommunityIcons name="folder-multiple" size={24} color="#3B82F6" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalItems}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Éléments</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: securityPercentage >= 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderColor: securityPercentage >= 50 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: (securityPercentage >= 50 ? '#10B981' : '#F59E0B') + '20' }]}>
            <MaterialCommunityIcons name="shield-check" size={24} color={securityPercentage >= 50 ? '#10B981' : '#F59E0B'} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{securityPercentage}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Protégés</Text>
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
          {filteredVaults.length === 0 && vaults.length > 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyStateIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <MaterialCommunityIcons name="file-search" size={48} color={colors.purple.primary} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                Aucun résultat
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Aucun coffre ne correspond à votre recherche
              </Text>
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: colors.purple.primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                }}
              >
                <Text style={styles.emptyStateButtonText}>Réinitialiser les filtres</Text>
              </TouchableOpacity>
            </View>
          ) : vaults.length === 0 ? (
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
              {filteredVaults.map((vault) => (
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
          <View style={styles.vaultHeaderTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToVaults}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.vaultHeaderContent}>
              <Text style={[styles.vaultTitle, { color: colors.text }]} numberOfLines={2}>
                {selectedVault.name}
              </Text>
              <Text style={[styles.vaultSubtitle, { color: colors.textSecondary }]}>
                {selectedVault.items?.length || 0} éléments
              </Text>
            </View>
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
              onPress={() => setIsEditCategoryModalVisible(true)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={colors.purple.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.headerActionButton, 
                { backgroundColor: selectedVault.isEncrypted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)' }
              ]}
              onPress={handleSetPassword}
            >
              <MaterialCommunityIcons 
                name={selectedVault.isEncrypted ? "lock" : "lock-open-variant"} 
                size={20} 
                color={selectedVault.isEncrypted ? "#10B981" : colors.purple.primary} 
              />
            </TouchableOpacity>
            {selectedVault.items?.length > 0 && (
              <TouchableOpacity 
                style={[styles.headerActionButton, { backgroundColor: colors.purple.primary }]}
                onPress={handleAddItem}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
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
                vaultId={selectedVault.id}
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

      {/* Edit Category Modal */}
      <Modal
        visible={isEditCategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            {selectedVault && (
              <EditVaultCategory
                currentCategory={selectedVault.category}
                onSave={handleUpdateCategory}
                onCancel={() => setIsEditCategoryModalVisible(false)}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Set Password Modal */}
      <Modal
        visible={isSetPasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSetPasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            {selectedVault && (
              <SetVaultPassword
                onSave={handleSavePassword}
                onCancel={() => setIsSetPasswordModalVisible(false)}
                hasExistingPassword={selectedVault.isEncrypted}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Remove Password Modal */}
      <Modal
        visible={isRemovePasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRemovePasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            {selectedVault && (
              <RemoveVaultPassword
                onRemove={handleRemovePassword}
                onCancel={() => setIsRemovePasswordModalVisible(false)}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Unlock Vault Modal */}
      <Modal
        visible={isUnlockModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsUnlockModalVisible(false);
          setVaultToUnlock(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            {vaultToUnlock && (
              <UnlockVault
                vaultName={vaultToUnlock.name}
                onUnlock={handleUnlockVault}
                onCancel={() => {
                  setIsUnlockModalVisible(false);
                  setVaultToUnlock(null);
                  setUnlockError('');
                }}
                error={unlockError}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Legacy Vault Modal */}
      <Modal
        visible={isLegacyVaultModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLegacyVaultModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={[styles.alertModalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="alert-circle" size={48} color={colors.purple.primary} />
            <Text style={[styles.alertModalTitle, { color: colors.text }]}>
              Coffre-fort non protégé
            </Text>
            <Text style={[styles.alertModalText, { color: colors.textSecondary }]}>
              Ce coffre-fort était marqué comme protégé mais n'a pas de mot de passe configuré. Voulez-vous définir un mot de passe maintenant ?
            </Text>
            <View style={styles.alertModalActions}>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => {
                  if (legacyVault) {
                    updateVault(legacyVault.id, { isEncrypted: false }).then(() => {
                      setSelectedVault(legacyVault);
                      selectVault(legacyVault.id);
                      setIsLegacyVaultModalVisible(false);
                      setLegacyVault(null);
                    });
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertModalButtonText, { color: colors.text }]}>
                  Plus tard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: colors.purple.primary }]}
                onPress={() => {
                  if (legacyVault) {
                    setSelectedVault(legacyVault);
                    selectVault(legacyVault.id);
                    setIsLegacyVaultModalVisible(false);
                    setLegacyVault(null);
                    setTimeout(() => setIsSetPasswordModalVisible(true), 500);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertModalButtonText, { color: '#FFFFFF' }]}>
                  Définir un mot de passe
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Limit Modal */}
      <Modal
        visible={isSubscriptionLimitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSubscriptionLimitModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={[styles.alertModalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="crown" size={48} color="#F59E0B" />
            <Text style={[styles.alertModalTitle, { color: colors.text }]}>
              Limite atteinte
            </Text>
            <Text style={[styles.alertModalText, { color: colors.textSecondary }]}>
              {subscriptionLimitReason}
            </Text>
            <View style={styles.alertModalActions}>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => {
                  setIsSubscriptionLimitModalVisible(false);
                  setIsCreateVaultModalVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertModalButtonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: '#F59E0B' }]}
                onPress={() => {
                  setIsSubscriptionLimitModalVisible(false);
                  setIsCreateVaultModalVisible(false);
                  // TODO: Navigate to premium page
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertModalButtonText, { color: '#FFFFFF' }]}>
                  Passer au Premium
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isDeleteConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsDeleteConfirmModalVisible(false);
          setDeleteConfirmText('');
        }}
      >
        <View style={styles.alertModalOverlay}>
          <View style={[styles.alertModalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="delete-alert" size={48} color="#EF4444" />
            <Text style={[styles.alertModalTitle, { color: colors.text }]}>
              Supprimer le coffre-fort
            </Text>
            <Text style={[styles.alertModalText, { color: colors.textSecondary }]}>
              Êtes-vous sûr de vouloir supprimer "{selectedVault?.name}" ? Tous les éléments seront supprimés. Cette action est irréversible.
            </Text>
            
            {selectedVault?.isEncrypted && (
              <View style={styles.deleteConfirmInputContainer}>
                <Text style={[styles.deleteConfirmLabel, { color: colors.textSecondary }]}>
                  Ce coffre-fort est protégé. Entrez le mot de passe :
                </Text>
                <View style={[
                  styles.deletePasswordInputWrapper,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: deletePasswordError ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
                  }
                ]}>
                  <MaterialCommunityIcons name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.deletePasswordInput, { color: colors.text }]}
                    placeholder="Mot de passe"
                    placeholderTextColor={colors.textSecondary}
                    value={deletePassword}
                    onChangeText={(text) => {
                      setDeletePassword(text);
                      setDeletePasswordError('');
                    }}
                    secureTextEntry={!showDeletePassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowDeletePassword(!showDeletePassword)} style={styles.eyeButton}>
                    <MaterialCommunityIcons
                      name={showDeletePassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {deletePasswordError && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{deletePasswordError}</Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.deleteConfirmInputContainer}>
              <Text style={[styles.deleteConfirmLabel, { color: colors.textSecondary }]}>
                Tapez <Text style={{ color: '#EF4444', fontWeight: '700' }}>SUPPRIMER</Text> pour confirmer
              </Text>
              <TextInput
                style={[
                  styles.deleteConfirmInput,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: deleteConfirmText === 'SUPPRIMER' ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                    color: colors.text
                  }
                ]}
                placeholder="SUPPRIMER"
                placeholderTextColor="rgba(255, 255, 255, 0.2)"
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus={!selectedVault?.isEncrypted}
              />
            </View>
            
            <View style={styles.alertModalActions}>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => {
                  setIsDeleteConfirmModalVisible(false);
                  setDeleteConfirmText('');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertModalButtonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.alertModalButton,
                  { backgroundColor: '#EF4444' },
                  deleteConfirmText !== 'SUPPRIMER' && { opacity: 0.5 }
                ]}
                onPress={confirmDeleteVault}
                activeOpacity={0.8}
                disabled={deleteConfirmText !== 'SUPPRIMER'}
              >
                <Text style={[styles.alertModalButtonText, { color: '#FFFFFF' }]}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <Modal
        visible={isDeleteItemModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsDeleteItemModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={[styles.alertModalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.alertModalHeader}>
              <MaterialCommunityIcons name="delete-alert" size={48} color="#EF4444" />
            </View>
            
            <Text style={[styles.alertModalTitle, { color: colors.text }]}>
              Supprimer l'élément
            </Text>
            
            <Text style={[styles.alertModalMessage, { color: colors.textSecondary }]}>
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
            </Text>
            
            <View style={styles.alertModalActions}>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => {
                  setIsDeleteItemModalVisible(false);
                  setItemToDelete(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertModalButtonText, { color: colors.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertModalButton, { backgroundColor: '#EF4444' }]}
                onPress={confirmDeleteItem}
                activeOpacity={0.8}
              >
                <Text style={[styles.alertModalButtonText, { color: '#FFFFFF' }]}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
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
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
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
    paddingHorizontal: 20,
    paddingTop: 24,
    marginBottom: 20,
  },
  vaultHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 4,
    lineHeight: 30,
  },
  vaultSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  vaultHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    paddingLeft: 52,
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
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  alertModalHeader: {
    marginBottom: 16,
  },
  alertModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertModalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertModalMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteConfirmInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  deleteConfirmLabel: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteConfirmInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  deletePasswordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 12,
  },
  deletePasswordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  eyeButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
});