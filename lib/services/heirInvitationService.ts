// @ts-nocheck - Supabase generated types don't match schema perfectly
/**
 * Heir Invitation Service
 * Gestion des invitations d'héritiers par code/QR
 */

import { supabase } from '../supabase';
import type { 
  HeirDecrypted, 
  CreateHeirInvitationData,
  AcceptHeirInvitationData,
  InvitationStatus 
} from '@/types/heir';

/**
 * Créer une invitation d'héritier avec code unique
 */
export async function createHeirInvitation(
  userId: string,
  data: CreateHeirInvitationData
): Promise<{ heir: HeirDecrypted; invitationCode: string }> {
  try {
    // Générer un code d'invitation unique
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_invitation_code');

    if (codeError) throw codeError;
    const invitationCode = codeData as string;

    // Créer l'héritier avec le code d'invitation
    const { data: heir, error } = await supabase
      .from('heirs')
      .insert({
        user_id: userId,
        relationship: data.relationship || null,
        access_level: data.access_level,
        inheritance_plan_id: data.inheritance_plan_id || null,
        notify_on_activation: data.notify_on_activation ?? true,
        notification_delay_days: data.notification_delay_days ?? 0,
        invitation_code: invitationCode,
        invitation_status: 'pending',
        is_active: false,
        has_accepted: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Convertir en HeirDecrypted
    const heirDecrypted: HeirDecrypted = {
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
    };

    return { heir: heirDecrypted, invitationCode };
  } catch (error) {
    console.error('Error creating heir invitation:', error);
    throw error;
  }
}

/**
 * Vérifier si un code d'invitation est valide
 */
export async function validateInvitationCode(
  code: string
): Promise<{ valid: boolean; heir?: HeirDecrypted; error?: string }> {
  try {
    console.log('🔍 Validating invitation code:', code);
    
    // Utiliser maybeSingle pour éviter l'erreur 406
    const { data: heir, error } = await supabase
      .from('heirs')
      .select('*')
      .eq('invitation_code', code)
      .maybeSingle();

    console.log('📊 Query result:', { heir, error });

    if (error) {
      console.error('❌ Supabase error:', error);
      return { valid: false, error: 'Erreur lors de la vérification du code' };
    }

    if (!heir) {
      console.log('⚠️ No heir found for code:', code);
      return { valid: false, error: 'Code d\'invitation invalide ou introuvable' };
    }

    console.log('✅ Heir found:', heir.id);

    // Vérifier le statut
    if (heir.invitation_status !== 'pending') {
      return { 
        valid: false, 
        error: `Cette invitation a déjà été ${heir.invitation_status === 'accepted' ? 'acceptée' : 'rejetée'}` 
      };
    }

    // Vérifier l'expiration
    if (heir.invitation_expires_at && new Date(heir.invitation_expires_at) < new Date()) {
      // Marquer comme expiré
      await supabase
        .from('heirs')
        .update({ invitation_status: 'expired' })
        .eq('id', heir.id);

      return { valid: false, error: 'Cette invitation a expiré' };
    }

    // Convertir en HeirDecrypted
    const heirDecrypted: HeirDecrypted = {
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
    };

    return { valid: true, heir: heirDecrypted };
  } catch (error) {
    console.error('Error validating invitation code:', error);
    throw error;
  }
}

/**
 * Accepter une invitation d'héritier
 */
export async function acceptHeirInvitation(
  userId: string,
  invitationCode: string
): Promise<HeirDecrypted> {
  try {
    // Vérifier d'abord que le code est valide
    const validation = await validateInvitationCode(invitationCode);
    if (!validation.valid || !validation.heir) {
      throw new Error(validation.error || 'Code invalide');
    }

    // Vérifier que l'utilisateur n'est pas le propriétaire
    if (validation.heir.user_id === userId) {
      throw new Error('Vous ne pouvez pas être votre propre héritier');
    }

    // Accepter l'invitation
    const { data: heir, error } = await supabase
      .from('heirs')
      .update({
        heir_user_id: userId,
        has_accepted: true,
        accepted_at: new Date().toISOString(),
        invitation_status: 'accepted',
        is_active: true,
      })
      .eq('invitation_code', invitationCode)
      .eq('invitation_status', 'pending')
      .select()
      .single();

    if (error) throw error;

    // Récupérer les informations complètes avec les données utilisateur
    const { data: heirWithInfo, error: infoError } = await supabase
      .from('heirs_with_user_info')
      .select('*')
      .eq('id', heir.id)
      .single();

    if (infoError) throw infoError;

    // Convertir en HeirDecrypted
    const heirDecrypted: HeirDecrypted = {
      id: heirWithInfo.id,
      user_id: heirWithInfo.user_id,
      inheritance_plan_id: heirWithInfo.inheritance_plan_id,
      relationship: heirWithInfo.relationship,
      access_level: heirWithInfo.access_level,
      heir_user_id: heirWithInfo.heir_user_id,
      heir_public_key: heirWithInfo.heir_public_key,
      notify_on_activation: heirWithInfo.notify_on_activation,
      notification_delay_days: heirWithInfo.notification_delay_days,
      is_active: heirWithInfo.is_active,
      has_accepted: heirWithInfo.has_accepted,
      accepted_at: heirWithInfo.accepted_at,
      invitation_code: heirWithInfo.invitation_code,
      invitation_status: heirWithInfo.invitation_status,
      invitation_expires_at: heirWithInfo.invitation_expires_at,
      invited_at: heirWithInfo.invited_at,
      rejected_at: heirWithInfo.rejected_at,
      created_at: heirWithInfo.created_at,
      updated_at: heirWithInfo.updated_at,
      heir_email: heirWithInfo.heir_email,
      heir_full_name: heirWithInfo.heir_full_name,
      heir_avatar_url: heirWithInfo.heir_avatar_url,
    };

    return heirDecrypted;
  } catch (error) {
    console.error('Error accepting heir invitation:', error);
    throw error;
  }
}

/**
 * Rejeter une invitation d'héritier
 */
export async function rejectHeirInvitation(
  userId: string,
  invitationCode: string
): Promise<void> {
  try {
    // Vérifier que le code est valide
    const validation = await validateInvitationCode(invitationCode);
    if (!validation.valid || !validation.heir) {
      throw new Error(validation.error || 'Code invalide');
    }

    // Rejeter l'invitation
    const { error } = await supabase
      .from('heirs')
      .update({
        invitation_status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('invitation_code', invitationCode)
      .eq('invitation_status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting heir invitation:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les invitations en attente pour un utilisateur
 */
export async function getPendingInvitations(userId: string): Promise<HeirDecrypted[]> {
  try {
    const { data: heirs, error } = await supabase
      .from('heirs_with_user_info')
      .select('*')
      .eq('heir_user_id', userId)
      .eq('invitation_status', 'pending');

    if (error) throw error;

    return (heirs || []).map((heir: any) => ({
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
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    throw error;
  }
}

/**
 * Annuler une invitation (par le propriétaire)
 */
export async function cancelHeirInvitation(
  userId: string,
  heirId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('heirs')
      .delete()
      .eq('id', heirId)
      .eq('user_id', userId)
      .eq('invitation_status', 'pending');

    if (error) throw error;
  } catch (error) {
    console.error('Error canceling heir invitation:', error);
    throw error;
  }
}

/**
 * Nettoyer les invitations expirées (à appeler périodiquement)
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_invitations');

    if (error) throw error;
    return data as number;
  } catch (error) {
    console.error('Error cleaning up expired invitations:', error);
    throw error;
  }
}
