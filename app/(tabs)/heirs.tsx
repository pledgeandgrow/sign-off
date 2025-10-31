import { Colors } from '@/constants/Colors';
import { useHeirs } from '@/contexts/HeirContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { canPerformAction } from '@/lib/services/subscriptionService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeirList, CreateInvitationForm, InvitationCodeDisplay, JoinAsHeirForm } from '../../components/heirs';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { AlertModal } from '../../components/common/AlertModal';
import type { HeirDecrypted, CreateHeirInvitationData } from '../../types/heir';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { FlatList, ActivityIndicator, RefreshControl } from 'react-native';

// Inheritances List Component
interface InheritancesListProps {
  inheritances: any[];
  loading: boolean;
  onRefresh: () => void;
  onJoin: () => void;
  colors: any;
}

const InheritancesList: React.FC<InheritancesListProps> = ({
  inheritances,
  loading,
  onRefresh,
  onJoin,
  colors,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const renderInheritanceCard = ({ item }: { item: any }) => (
    <View
      style={[
        {
          flexDirection: 'row',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          marginBottom: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      ]}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
      }}>
        <MaterialCommunityIcons name="account-heart" size={24} color={colors.purple.primary} />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text }}>
          {item.owner_full_name || item.owner_email}
        </Text>
        
        {item.relationship && (
          <Text style={{ fontSize: 14, marginBottom: 8, color: colors.textSecondary }}>
            {item.relationship}
          </Text>
        )}
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MaterialCommunityIcons name="email" size={14} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            {item.owner_email}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: item.access_level === 'full' ? '#10b981' : item.access_level === 'partial' ? '#f59e0b' : '#3b82f6',
          }} />
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>
            {item.access_level === 'full' ? 'Accès Complet' : item.access_level === 'partial' ? 'Accès Partiel' : 'Lecture Seule'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={colors.purple.primary} />
          <Text style={{ marginTop: 16, fontSize: 16, color: colors.textSecondary }}>
            Chargement...
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 40 }}>
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
        }}>
          <MaterialCommunityIcons name="account-heart-outline" size={64} color={colors.purple.primary} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'center', color: colors.text }}>
          Aucune succession
        </Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24, color: colors.textSecondary }}>
          Vous n'êtes héritier d'aucune personne pour le moment.{'\n'}
          Acceptez une invitation pour commencer.
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: colors.purple.primary,
          }}
          onPress={onJoin}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            Accepter une invitation
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={inheritances}
      renderItem={renderInheritanceCard}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={inheritances.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.purple.primary}
        />
      }
    />
  );
};

export default function HeirsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const { user } = useAuth();
  const { heirs, loading, createInvitation, cancelInvitation, deleteHeir, refreshHeirs } = useHeirs();
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [showInvitationCode, setShowInvitationCode] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedHeir, setSelectedHeir] = useState<HeirDecrypted | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'heirs' | 'invitations' | 'inheritances'>('heirs');
  const [inheritances, setInheritances] = useState<any[]>([]);
  const [inheritancesLoading, setInheritancesLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  // Fetch inheritances (where I am heir)
  const fetchInheritances = async () => {
    if (!user) return;
    
    setInheritancesLoading(true);
    try {
      const { data, error } = await supabase
        .from('heirs_with_user_info')
        .select('*')
        .eq('heir_user_id', user.id)
        .eq('invitation_status', 'accepted');

      if (error) throw error;
      setInheritances(data || []);
    } catch (error) {
      console.error('Error fetching inheritances:', error);
    } finally {
      setInheritancesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inheritances') {
      fetchInheritances();
    }
  }, [activeTab, user]);

  const handleCreateInvitation = async (data: CreateHeirInvitationData) => {
    try {
      // Check if user can add heir (free tier limit)
      if (user) {
        const { allowed, reason } = await canPerformAction(user.id, 'add_heir');
        if (!allowed) {
          setAlertModal({
            visible: true,
            type: 'warning',
            title: 'Limite atteinte',
            message: reason || 'Vous avez atteint la limite de votre plan.',
          });
          setShowInvitationForm(false);
          return;
        }
      }

      // Create invitation
      const { heir, invitationCode } = await createInvitation(data);
      
      setInvitationData({
        code: invitationCode,
        expiresAt: heir.invitation_expires_at!,
      });
      
      setShowInvitationForm(false);
      setShowInvitationCode(true);
    } catch (error) {
      console.error('Error creating invitation:', error);
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la création de l\'invitation. Veuillez réessayer.',
      });
    }
  };

  const handleCancelInvitation = (heir: HeirDecrypted) => {
    setSelectedHeir(heir);
    setShowCancelConfirm(true);
  };

  const confirmCancelInvitation = async () => {
    if (!selectedHeir) return;
    
    setActionLoading(true);
    try {
      await cancelInvitation(selectedHeir.id);
      setShowCancelConfirm(false);
      setSelectedHeir(null);
      setAlertModal({
        visible: true,
        type: 'success',
        title: 'Succès',
        message: 'L\'invitation a été annulée avec succès.',
      });
    } catch (error) {
      console.error('Error canceling invitation:', error);
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Échec de l\'annulation de l\'invitation.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHeir = (heir: HeirDecrypted) => {
    setSelectedHeir(heir);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteHeir = async () => {
    if (!selectedHeir) return;
    
    setActionLoading(true);
    try {
      await deleteHeir(selectedHeir.id);
      setShowDeleteConfirm(false);
      setSelectedHeir(null);
      setAlertModal({
        visible: true,
        type: 'success',
        title: 'Succès',
        message: 'L\'héritier a été supprimé avec succès.',
      });
    } catch (error) {
      console.error('Error deleting heir:', error);
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Échec de la suppression de l\'héritier.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddHeir = () => {
    setShowInvitationForm(true);
  };

  const handleJoinSubmit = async (code: string) => {
    try {
      const { acceptHeirInvitation } = await import('@/lib/services/heirInvitationService');
      if (!user) {
        setAlertModal({
          visible: true,
          type: 'error',
          title: 'Erreur',
          message: 'Vous devez être connecté pour accepter une invitation.',
        });
        throw new Error('User not found');
      }
      
      await acceptHeirInvitation(user.id, code);
      setShowJoinForm(false);
      fetchInheritances();
      
      setAlertModal({
        visible: true,
        type: 'success',
        title: 'Invitation acceptée !',
        message: 'Vous êtes maintenant héritier. Vous pourrez accéder aux données après activation.',
      });
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      // Messages d'erreur personnalisés
      let errorMessage = 'Une erreur est survenue';
      
      if (error.message) {
        if (error.message.includes('invalide') || error.message.includes('introuvable')) {
          errorMessage = 'Code d\'invitation invalide ou introuvable.\n\nVérifiez que vous avez saisi le bon code.';
        } else if (error.message.includes('expiré')) {
          errorMessage = 'Cette invitation a expiré.\n\nDemandez un nouveau code d\'invitation.';
        } else if (error.message.includes('acceptée')) {
          errorMessage = 'Cette invitation a déjà été acceptée par quelqu\'un d\'autre.';
        } else if (error.message.includes('propre héritier')) {
          errorMessage = 'Vous ne pouvez pas être votre propre héritier.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAlertModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: errorMessage,
      });
      
      throw error;
    }
  };

  const handleScanQR = () => {
    setAlertModal({
      visible: true,
      type: 'info',
      title: 'Scanner QR Code',
      message: 'La fonctionnalité de scan de QR code sera disponible prochainement.\n\nPour l\'instant, veuillez saisir le code manuellement.',
    });
    // TODO: Implémenter avec expo-camera ou expo-barcode-scanner
  };

  const handleHeirPress = (heir: HeirDecrypted) => {
    // Si l'invitation est en attente, afficher le code
    if (heir.invitation_status === 'pending' && heir.invitation_code && heir.invitation_expires_at) {
      setInvitationData({
        code: heir.invitation_code,
        expiresAt: heir.invitation_expires_at,
      });
      setShowInvitationCode(true);
    }
  };

  const pendingHeirs = heirs.filter(h => h.invitation_status === 'pending');
  const acceptedHeirs = heirs.filter(h => h.invitation_status === 'accepted');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: 20, paddingVertical: 16 }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Héritages</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {activeTab === 'heirs' && `${acceptedHeirs.length} héritier${acceptedHeirs.length > 1 ? 's' : ''}`}
              {activeTab === 'invitations' && `${pendingHeirs.length} invitation${pendingHeirs.length > 1 ? 's' : ''}`}
              {activeTab === 'inheritances' && `${inheritances.length} succession${inheritances.length > 1 ? 's' : ''}`}
            </Text>
          </View>
          {((heirs.length > 0 && activeTab !== 'inheritances') || (activeTab === 'inheritances' && inheritances.length > 0)) && (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.purple.primary }]}
              onPress={activeTab === 'inheritances' ? () => setShowJoinForm(true) : handleAddHeir}
            >
              <MaterialCommunityIcons 
                name={activeTab === 'inheritances' ? 'qrcode-scan' : 'email-plus'} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'heirs' && styles.activeTab,
              { borderBottomColor: activeTab === 'heirs' ? colors.purple.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab('heirs')}
          >
            <MaterialCommunityIcons 
              name="account-check" 
              size={20} 
              color={activeTab === 'heirs' ? colors.purple.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'heirs' ? colors.purple.primary : colors.textSecondary }
            ]}>
              Héritiers ({acceptedHeirs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'invitations' && styles.activeTab,
              { borderBottomColor: activeTab === 'invitations' ? colors.purple.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab('invitations')}
          >
            <MaterialCommunityIcons 
              name="email-outline" 
              size={20} 
              color={activeTab === 'invitations' ? colors.purple.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'invitations' ? colors.purple.primary : colors.textSecondary }
            ]}>
              Invitations ({pendingHeirs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'inheritances' && styles.activeTab,
              { borderBottomColor: activeTab === 'inheritances' ? colors.purple.primary : 'transparent' }
            ]}
            onPress={() => setActiveTab('inheritances')}
          >
            <MaterialCommunityIcons 
              name="account-heart" 
              size={20} 
              color={activeTab === 'inheritances' ? colors.purple.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'inheritances' ? colors.purple.primary : colors.textSecondary }
            ]}>
              Successions ({inheritances.length})
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'inheritances' ? (
          <InheritancesList
            inheritances={inheritances}
            loading={inheritancesLoading}
            onRefresh={fetchInheritances}
            onJoin={() => setShowJoinForm(true)}
            colors={colors}
          />
        ) : (
          <HeirList
            heirs={activeTab === 'heirs' ? acceptedHeirs : pendingHeirs}
            loading={loading}
            onRefresh={refreshHeirs}
            onHeirPress={handleHeirPress}
            onDeleteHeir={handleDeleteHeir}
            onCancelInvitation={handleCancelInvitation}
            onAddHeir={handleAddHeir}
            emptyMessage={
              activeTab === 'heirs' 
                ? "Aucun héritier actif. Les invitations acceptées apparaîtront ici."
                : "Aucune invitation en attente. Créez-en une pour commencer."
            }
            showActions={true}
          />
        )}
      </View>

      {/* Invitation Form Modal */}
      <Modal
        visible={showInvitationForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInvitationForm(false)}
      >
        <CreateInvitationForm
          onSubmit={handleCreateInvitation}
          onCancel={() => setShowInvitationForm(false)}
        />
      </Modal>

      {/* Invitation Code Display Modal */}
      <Modal
        visible={showInvitationCode}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowInvitationCode(false);
          setInvitationData(null);
        }}
      >
        {invitationData && (
          <InvitationCodeDisplay
            invitationCode={invitationData.code}
            expiresAt={invitationData.expiresAt}
            onClose={() => {
              setShowInvitationCode(false);
              setInvitationData(null);
              refreshHeirs();
            }}
          />
        )}
      </Modal>

      {/* Join As Heir Form Modal */}
      <Modal
        visible={showJoinForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinForm(false)}
      >
        <JoinAsHeirForm
          onSubmit={handleJoinSubmit}
          onCancel={() => setShowJoinForm(false)}
          onScanQR={handleScanQR}
        />
      </Modal>

      {/* Cancel Invitation Confirmation */}
      <ConfirmationModal
        visible={showCancelConfirm}
        title="Annuler l'invitation"
        message="Êtes-vous sûr de vouloir annuler cette invitation ? Le code ne sera plus valide."
        confirmText="Oui, annuler"
        cancelText="Non"
        confirmColor="#EF4444"
        icon="cancel"
        loading={actionLoading}
        onConfirm={confirmCancelInvitation}
        onCancel={() => {
          setShowCancelConfirm(false);
          setSelectedHeir(null);
        }}
      />

      {/* Delete Heir Confirmation */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Supprimer l'héritier"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedHeir?.heir_full_name || selectedHeir?.relationship || 'cet héritier'} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmColor="#EF4444"
        icon="delete-alert"
        loading={actionLoading}
        onConfirm={confirmDeleteHeir}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelectedHeir(null);
        }}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal({ ...alertModal, visible: false })}
      />
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
  formContainer: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
  },
  activeTab: {
    // Border color set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
