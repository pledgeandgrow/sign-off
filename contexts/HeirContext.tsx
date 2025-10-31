import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { HeirDecrypted, CreateHeirInvitationData } from '../types/heir';
import { 
  createHeirInvitation,
  acceptHeirInvitation,
  rejectHeirInvitation,
  getPendingInvitations,
  cancelHeirInvitation,
} from '@/lib/services/heirInvitationService';

interface HeirContextType {
  heirs: HeirDecrypted[];
  pendingInvitations: HeirDecrypted[];
  loading: boolean;
  createInvitation: (data: CreateHeirInvitationData) => Promise<{ heir: HeirDecrypted; invitationCode: string }>;
  acceptInvitation: (invitationCode: string) => Promise<HeirDecrypted>;
  rejectInvitation: (invitationCode: string) => Promise<void>;
  cancelInvitation: (heirId: string) => Promise<void>;
  deleteHeir: (id: string) => Promise<void>;
  refreshHeirs: () => Promise<void>;
}

const HeirContext = createContext<HeirContextType | undefined>(undefined);

export function HeirProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [heirs, setHeirs] = useState<HeirDecrypted[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<HeirDecrypted[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch heirs when user logs in
  useEffect(() => {
    if (user) {
      refreshHeirs();
    } else {
      setHeirs([]);
      setPendingInvitations([]);
    }
  }, [user]);

  const refreshHeirs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Récupérer les héritiers avec les informations utilisateur
      const { data, error } = await supabase
        .from('heirs_with_user_info')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const decryptedHeirs: HeirDecrypted[] = (data || []).map((heir: any) => ({
        id: heir.id,
        user_id: heir.user_id,
        inheritance_plan_id: heir.inheritance_plan_id,
        relationship: heir.relationship,
        access_level: heir.access_level,
        heir_user_id: heir.heir_user_id,
        heir_public_key: heir.heir_public_key,
        notify_on_activation: heir.notify_on_activation,
        notification_delay_days: heir.notification_delay_days,
        is_active: heir.is_active,
        has_accepted: heir.has_accepted,
        accepted_at: heir.accepted_at,
        invitation_code: heir.invitation_code,
        invitation_status: heir.invitation_status,
        invitation_expires_at: heir.invitation_expires_at,
        invited_at: heir.invited_at,
        rejected_at: heir.rejected_at,
        created_at: heir.created_at,
        updated_at: heir.updated_at,
        heir_email: heir.heir_email,
        heir_full_name: heir.heir_full_name,
        heir_avatar_url: heir.heir_avatar_url,
      }));

      setHeirs(decryptedHeirs);

      // Récupérer les invitations en attente pour cet utilisateur (où il est héritier)
      const pendingInvs = await getPendingInvitations(user.id);
      setPendingInvitations(pendingInvs);
    } catch (error) {
      console.error('Error fetching heirs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (
    data: CreateHeirInvitationData
  ): Promise<{ heir: HeirDecrypted; invitationCode: string }> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const result = await createHeirInvitation(user.id, data);
      
      // Ajouter le nouvel héritier à la liste
      setHeirs((prev) => [result.heir, ...prev]);
      
      return result;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  };

  const acceptInvitation = async (invitationCode: string): Promise<HeirDecrypted> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const heir = await acceptHeirInvitation(user.id, invitationCode);
      
      // Retirer de la liste des invitations en attente
      setPendingInvitations((prev) => prev.filter((h) => h.invitation_code !== invitationCode));
      
      // Rafraîchir la liste complète
      await refreshHeirs();
      
      return heir;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  };

  const rejectInvitation = async (invitationCode: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await rejectHeirInvitation(user.id, invitationCode);
      
      // Retirer de la liste des invitations en attente
      setPendingInvitations((prev) => prev.filter((h) => h.invitation_code !== invitationCode));
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      throw error;
    }
  };

  const cancelInvitation = async (heirId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      await cancelHeirInvitation(user.id, heirId);
      
      // Retirer de la liste
      setHeirs((prev) => prev.filter((h) => h.id !== heirId));
    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }
  };

  const deleteHeir = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('🗑️ Attempting to delete heir:', { id, userId: user.id });
      
      const { data, error } = await supabase
        .from('heirs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }

      console.log('✅ Heir deleted successfully');
      setHeirs((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error('❌ Error deleting heir:', error);
      throw error;
    }
  };

  const value = {
    heirs,
    pendingInvitations,
    loading,
    createInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    deleteHeir,
    refreshHeirs,
  };

  return <HeirContext.Provider value={value}>{children}</HeirContext.Provider>;
}

export function useHeirs() {
  const context = useContext(HeirContext);
  if (context === undefined) {
    throw new Error('useHeirs must be used within a HeirProvider');
  }
  return context;
}
