/**
 * Inheritance Service
 * Handles all inheritance-related operations including:
 * - Inheritance Plans
 * - Heirs Management
 * - Heir Vault Access
 * - Inheritance Triggers
 */

import { supabase } from '../supabase';
import { 
  Heir, 
  HeirFormData, 
  HeirDecrypted,
  InheritancePlan, 
  InheritancePlanFormData,
  InheritancePlanDecrypted,
  HeirVaultAccess,
  HeirVaultAccessFormData,
  InheritanceTrigger,
  InheritanceTriggerFormData,
  HeirWithPlan,
  InheritancePlanWithHeirs,
  HeirStatistics,
  InheritancePlanStatistics
} from '@/types/heir';
import { encryptData, decryptData } from '../encryption';

// =====================================================
// INHERITANCE PLANS
// =====================================================

/**
 * Get all inheritance plans for the current user
 */
export async function getInheritancePlans(userId: string): Promise<InheritancePlan[]> {
  const { data, error } = await supabase
    .from('inheritance_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single inheritance plan by ID
 */
export async function getInheritancePlan(planId: string): Promise<InheritancePlan | null> {
  const { data, error } = await supabase
    .from('inheritance_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get inheritance plan with decrypted instructions
 */
export async function getInheritancePlanDecrypted(
  planId: string,
  privateKey: string
): Promise<InheritancePlanDecrypted | null> {
  const plan = await getInheritancePlan(planId);
  if (!plan) return null;

  const instructions = plan.instructions_encrypted
    ? await decryptData(plan.instructions_encrypted, privateKey)
    : null;

  return {
    ...plan,
    instructions,
  };
}

/**
 * Create a new inheritance plan
 */
export async function createInheritancePlan(
  userId: string,
  formData: InheritancePlanFormData,
  publicKey: string
): Promise<InheritancePlan> {
  // Encrypt instructions if provided
  const instructions_encrypted = formData.instructions_encrypted
    ? await encryptData(formData.instructions_encrypted, publicKey)
    : null;

  const { data, error } = await supabase
    .from('inheritance_plans')
    .insert({
      user_id: userId,
      plan_name: formData.plan_name,
      plan_type: formData.plan_type,
      instructions_encrypted,
      is_active: formData.is_active,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Link heirs to an inheritance plan
 */
export async function linkHeirsToPlan(
  planId: string,
  heirIds: string[]
): Promise<void> {
  // Update all selected heirs to link them to this plan
  const { error } = await supabase
    .from('heirs')
    .update({ inheritance_plan_id: planId })
    .in('id', heirIds);

  if (error) throw error;
}

/**
 * Get heir vault access for a plan
 */
export async function getHeirVaultAccessByPlan(planId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('heir_vault_access')
    .select(`
      *,
      heir:heirs!inner(id, full_name_encrypted, inheritance_plan_id),
      vault:vaults(id, name)
    `)
    .eq('heir.inheritance_plan_id', planId);

  if (error) throw error;
  return data || [];
}

/**
 * Create heir vault access records
 */
export async function createHeirVaultAccess(
  heirIds: string[],
  vaultIds: string[],
  permissions: {
    can_view?: boolean;
    can_export?: boolean;
    can_edit?: boolean;
  } = { can_view: true, can_export: false, can_edit: false }
): Promise<void> {
  // Create access records for each heir-vault combination
  const accessRecords = [];
  
  for (const heirId of heirIds) {
    for (const vaultId of vaultIds) {
      accessRecords.push({
        heir_id: heirId,
        vault_id: vaultId,
        vault_item_id: null,
        can_view: permissions.can_view ?? true,
        can_export: permissions.can_export ?? false,
        can_edit: permissions.can_edit ?? false,
      });
    }
  }

  if (accessRecords.length > 0) {
    const { error } = await supabase
      .from('heir_vault_access')
      .insert(accessRecords);

    if (error) throw error;
  }
}

/**
 * Update an inheritance plan
 */
export async function updateInheritancePlan(
  planId: string,
  updates: Partial<InheritancePlanFormData>,
  publicKey?: string
): Promise<InheritancePlan> {
  const updateData: any = { ...updates };

  // Encrypt instructions if being updated
  if (updates.instructions_encrypted && publicKey) {
    updateData.instructions_encrypted = await encryptData(
      updates.instructions_encrypted,
      publicKey
    );
  }

  const { data, error } = await supabase
    .from('inheritance_plans')
    .update(updateData)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an inheritance plan
 */
export async function deleteInheritancePlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('inheritance_plans')
    .delete()
    .eq('id', planId);

  if (error) throw error;
}

/**
 * Activate/Deactivate an inheritance plan
 */
export async function toggleInheritancePlanStatus(
  planId: string,
  isActive: boolean
): Promise<InheritancePlan> {
  return updateInheritancePlan(planId, { is_active: isActive });
}

/**
 * Get inheritance plan with heirs
 */
export async function getInheritancePlanWithHeirs(
  planId: string,
  privateKey: string
): Promise<InheritancePlanWithHeirs | null> {
  const plan = await getInheritancePlanDecrypted(planId, privateKey);
  if (!plan) return null;

  const heirs = await getHeirsByPlan(planId, privateKey);
  const vaultAccessCount = await getVaultAccessCountByPlan(planId);

  return {
    ...plan,
    heirs,
    vault_access_count: vaultAccessCount,
  };
}

/**
 * Get vault access count for a plan
 */
async function getVaultAccessCountByPlan(planId: string): Promise<number> {
  const { data: heirs } = await supabase
    .from('heirs')
    .select('id')
    .eq('inheritance_plan_id', planId);

  if (!heirs || heirs.length === 0) return 0;

  const heirIds = heirs.map(h => h.id);
  
  const { count, error } = await supabase
    .from('heir_vault_access')
    .select('*', { count: 'exact', head: true })
    .in('heir_id', heirIds);

  if (error) throw error;
  return count || 0;
}

/**
 * Get inheritance plan statistics
 */
export async function getInheritancePlanStatistics(userId: string): Promise<InheritancePlanStatistics> {
  const plans = await getInheritancePlans(userId);

  const stats: InheritancePlanStatistics = {
    total_plans: plans.length,
    active_plans: plans.filter(p => p.is_active).length,
    triggered_plans: plans.filter(p => p.is_triggered).length,
    plans_by_type: {
      full_access: plans.filter(p => p.plan_type === 'full_access').length,
      partial_access: plans.filter(p => p.plan_type === 'partial_access').length,
      view_only: plans.filter(p => p.plan_type === 'view_only').length,
      destroy: plans.filter(p => p.plan_type === 'destroy').length,
    },
    // Note: Activation method is now global per user, not per plan
  };

  return stats;
}

// =====================================================
// HEIRS MANAGEMENT
// =====================================================

/**
 * Get all heirs for the current user
 */
export async function getHeirs(userId: string): Promise<Heir[]> {
  const { data, error } = await supabase
    .from('heirs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get heirs by inheritance plan
 */
export async function getHeirsByPlan(
  planId: string,
  privateKey: string
): Promise<HeirDecrypted[]> {
  const { data, error } = await supabase
    .from('heirs')
    .select('*')
    .eq('inheritance_plan_id', planId);

  if (error) throw error;
  if (!data) return [];

  // Decrypt heir data
  const decryptedHeirs = await Promise.all(
    data.map(heir => decryptHeir(heir, privateKey))
  );

  return decryptedHeirs;
}

/**
 * Get a single heir by ID
 */
export async function getHeir(heirId: string): Promise<Heir | null> {
  const { data, error } = await supabase
    .from('heirs')
    .select('*')
    .eq('id', heirId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get heir with decrypted data
 */
export async function getHeirDecrypted(
  heirId: string,
  privateKey: string
): Promise<HeirDecrypted | null> {
  const heir = await getHeir(heirId);
  if (!heir) return null;

  return decryptHeir(heir, privateKey);
}

/**
 * Decrypt heir data
 */
async function decryptHeir(heir: Heir, privateKey: string): Promise<HeirDecrypted> {
  // For now, no encryption - just return the "encrypted" fields as plain text
  // When encryption is added, uncomment the decryptData calls
  const full_name = heir.full_name_encrypted; // await decryptData(heir.full_name_encrypted, privateKey);
  const email = heir.email_encrypted; // await decryptData(heir.email_encrypted, privateKey);
  const phone = heir.phone_encrypted; // heir.phone_encrypted ? await decryptData(heir.phone_encrypted, privateKey) : null;
  const relationship = heir.relationship_encrypted; // heir.relationship_encrypted ? await decryptData(heir.relationship_encrypted, privateKey) : null;

  return {
    ...heir,
    full_name,
    email,
    phone,
    relationship,
  };
}

/**
 * Get all heirs with decrypted data
 */
export async function getHeirsDecrypted(
  userId: string,
  privateKey: string
): Promise<HeirDecrypted[]> {
  const heirs = await getHeirs(userId);
  
  const decryptedHeirs = await Promise.all(
    heirs.map(heir => decryptHeir(heir, privateKey))
  );

  return decryptedHeirs;
}

/**
 * Create a new heir
 */
export async function createHeir(
  userId: string,
  formData: HeirFormData,
  publicKey: string
): Promise<Heir> {
  // Encrypt heir data
  const full_name_encrypted = await encryptData(formData.full_name_encrypted, publicKey);
  const email_encrypted = await encryptData(formData.email_encrypted, publicKey);
  const phone_encrypted = formData.phone_encrypted
    ? await encryptData(formData.phone_encrypted, publicKey)
    : null;
  const relationship_encrypted = formData.relationship_encrypted
    ? await encryptData(formData.relationship_encrypted, publicKey)
    : null;

  const { data, error } = await supabase
    .from('heirs')
    .insert({
      user_id: userId,
      inheritance_plan_id: formData.inheritance_plan_id,
      full_name_encrypted,
      email_encrypted,
      phone_encrypted,
      relationship_encrypted,
      access_level: formData.access_level,
      heir_user_id: formData.heir_user_id,
      heir_public_key: formData.heir_public_key,
      notify_on_activation: formData.notify_on_activation,
      notification_delay_days: formData.notification_delay_days,
      is_active: formData.is_active,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an heir
 */
export async function updateHeir(
  heirId: string,
  updates: Partial<HeirFormData>,
  publicKey?: string
): Promise<Heir> {
  const updateData: any = { ...updates };

  // Encrypt data if being updated
  if (publicKey) {
    if (updates.full_name_encrypted) {
      updateData.full_name_encrypted = await encryptData(updates.full_name_encrypted, publicKey);
    }
    if (updates.email_encrypted) {
      updateData.email_encrypted = await encryptData(updates.email_encrypted, publicKey);
    }
    if (updates.phone_encrypted) {
      updateData.phone_encrypted = await encryptData(updates.phone_encrypted, publicKey);
    }
    if (updates.relationship_encrypted) {
      updateData.relationship_encrypted = await encryptData(updates.relationship_encrypted, publicKey);
    }
  }

  const { data, error } = await supabase
    .from('heirs')
    .update(updateData)
    .eq('id', heirId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an heir
 */
export async function deleteHeir(heirId: string): Promise<void> {
  const { error } = await supabase
    .from('heirs')
    .delete()
    .eq('id', heirId);

  if (error) throw error;
}

/**
 * Accept heir invitation (for heir users)
 */
export async function acceptHeirInvitation(heirId: string): Promise<Heir> {
  const { data, error } = await supabase
    .from('heirs')
    .update({
      has_accepted: true,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', heirId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get heir statistics
 */
export async function getHeirStatistics(userId: string): Promise<HeirStatistics> {
  const heirs = await getHeirs(userId);

  const stats: HeirStatistics = {
    total_heirs: heirs.length,
    active_heirs: heirs.filter(h => h.is_active).length,
    accepted_heirs: heirs.filter(h => h.has_accepted).length,
    pending_heirs: heirs.filter(h => !h.has_accepted).length,
    heirs_by_access_level: {
      full: heirs.filter(h => h.access_level === 'full').length,
      partial: heirs.filter(h => h.access_level === 'partial').length,
      view: heirs.filter(h => h.access_level === 'view').length,
    },
  };

  return stats;
}

// =====================================================
// HEIR VAULT ACCESS
// =====================================================

/**
 * Get vault access for a specific heir
 */
export async function getHeirVaultAccess(heirId: string): Promise<HeirVaultAccess[]> {
  const { data, error } = await supabase
    .from('heir_vault_access')
    .select('*')
    .eq('heir_id', heirId);

  if (error) throw error;
  return data || [];
}

/**
 * Grant vault access to an heir
 */
export async function grantVaultAccess(
  formData: HeirVaultAccessFormData
): Promise<HeirVaultAccess> {
  const { data, error } = await supabase
    .from('heir_vault_access')
    .insert(formData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update heir vault access permissions
 */
export async function updateVaultAccess(
  accessId: string,
  updates: Partial<HeirVaultAccessFormData>
): Promise<HeirVaultAccess> {
  const { data, error } = await supabase
    .from('heir_vault_access')
    .update(updates)
    .eq('id', accessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Revoke vault access from an heir
 */
export async function revokeVaultAccess(accessId: string): Promise<void> {
  const { error } = await supabase
    .from('heir_vault_access')
    .delete()
    .eq('id', accessId);

  if (error) throw error;
}

/**
 * Grant vault access to heir (entire vault)
 */
export async function grantVaultAccessToHeir(
  heirId: string,
  vaultId: string,
  permissions: {
    can_view?: boolean;
    can_export?: boolean;
    can_edit?: boolean;
  }
): Promise<HeirVaultAccess> {
  return grantVaultAccess({
    heir_id: heirId,
    vault_id: vaultId,
    vault_item_id: null,
    can_view: permissions.can_view ?? true,
    can_export: permissions.can_export ?? false,
    can_edit: permissions.can_edit ?? false,
    reencrypted_key: null,
  });
}

/**
 * Grant vault item access to heir (specific item)
 */
export async function grantVaultItemAccessToHeir(
  heirId: string,
  vaultItemId: string,
  permissions: {
    can_view?: boolean;
    can_export?: boolean;
    can_edit?: boolean;
  }
): Promise<HeirVaultAccess> {
  return grantVaultAccess({
    heir_id: heirId,
    vault_id: null,
    vault_item_id: vaultItemId,
    can_view: permissions.can_view ?? true,
    can_export: permissions.can_export ?? false,
    can_edit: permissions.can_edit ?? false,
    reencrypted_key: null,
  });
}

// =====================================================
// INHERITANCE TRIGGERS
// =====================================================

/**
 * Get all inheritance triggers for a user
 */
export async function getInheritanceTriggers(userId: string): Promise<InheritanceTrigger[]> {
  const { data, error } = await supabase
    .from('inheritance_triggers')
    .select('*')
    .eq('user_id', userId)
    .order('triggered_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get triggers for a specific inheritance plan
 */
export async function getInheritanceTriggersByPlan(
  planId: string
): Promise<InheritanceTrigger[]> {
  const { data, error } = await supabase
    .from('inheritance_triggers')
    .select('*')
    .eq('inheritance_plan_id', planId)
    .order('triggered_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create an inheritance trigger
 */
export async function createInheritanceTrigger(
  formData: InheritanceTriggerFormData
): Promise<InheritanceTrigger> {
  const { data, error } = await supabase
    .from('inheritance_triggers')
    .insert({
      inheritance_plan_id: formData.inheritance_plan_id,
      user_id: formData.user_id,
      trigger_reason: formData.trigger_reason,
      trigger_metadata: formData.trigger_metadata,
      requires_verification: formData.requires_verification,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update inheritance trigger status
 */
export async function updateInheritanceTriggerStatus(
  triggerId: string,
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'
): Promise<InheritanceTrigger> {
  const updateData: any = { status };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  } else if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('inheritance_triggers')
    .update(updateData)
    .eq('id', triggerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verify inheritance trigger
 */
export async function verifyInheritanceTrigger(
  triggerId: string,
  verificationCode: string,
  verifiedBy: string
): Promise<InheritanceTrigger> {
  const { data, error } = await supabase
    .from('inheritance_triggers')
    .update({
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      status: 'processing',
    })
    .eq('id', triggerId)
    .eq('verification_code', verificationCode)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cancel inheritance trigger
 */
export async function cancelInheritanceTrigger(triggerId: string): Promise<InheritanceTrigger> {
  return updateInheritanceTriggerStatus(triggerId, 'cancelled');
}

/**
 * Manually trigger an inheritance plan
 */
export async function triggerInheritancePlanManually(
  planId: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<InheritanceTrigger> {
  // Create the trigger
  const trigger = await createInheritanceTrigger({
    inheritance_plan_id: planId,
    user_id: userId,
    trigger_reason: 'manual',
    trigger_metadata: metadata || null,
    requires_verification: true,
  });

  // Mark the plan as triggered
  await updateInheritancePlan(planId, {
    is_triggered: true,
  } as any);

  return trigger;
}
