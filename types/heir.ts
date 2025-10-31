import { AccessLevelType, InheritancePlanType, ActivationMethodType, TriggerReasonType, TriggerStatusType } from './database.types';

// =====================================================
// HEIR TYPES - Invitation System
// =====================================================

// Re-export for convenience
export type { AccessLevelType };

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface HeirBase {
  relationship: string | null;
  access_level: AccessLevelType;
  notify_on_activation: boolean;
  notification_delay_days: number;
}

export interface Heir extends HeirBase {
  id: string;
  user_id: string;
  inheritance_plan_id: string | null;
  heir_user_id: string | null;
  heir_public_key: string | null;
  is_active: boolean;
  has_accepted: boolean;
  accepted_at: string | null;
  invitation_code: string | null;
  invitation_status: InvitationStatus;
  invitation_expires_at: string | null;
  invited_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export type HeirFormData = Omit<Heir, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'has_accepted' | 'accepted_at' | 'invitation_code' | 'invitation_status' | 'invitation_expires_at' | 'invited_at' | 'rejected_at'>;

// Heir with user information (from view)
export interface HeirWithUserInfo extends Heir {
  heir_email: string | null;
  heir_full_name: string | null;
  heir_avatar_url: string | null;
  owner_email: string;
  owner_full_name: string | null;
}

// For display purposes
export interface HeirDecrypted {
  id: string;
  user_id: string;
  inheritance_plan_id: string | null;
  relationship: string | null;
  access_level: AccessLevelType;
  heir_user_id: string | null;
  heir_public_key: string | null;
  notify_on_activation: boolean;
  notification_delay_days: number;
  is_active: boolean;
  has_accepted: boolean;
  accepted_at: string | null;
  invitation_code: string | null;
  invitation_status: InvitationStatus;
  invitation_expires_at: string | null;
  invited_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  // User info (if accepted)
  heir_email?: string | null;
  heir_full_name?: string | null;
  heir_avatar_url?: string | null;
}

// Invitation creation data
export interface CreateHeirInvitationData {
  relationship?: string;
  access_level: AccessLevelType;
  inheritance_plan_id?: string | null;
  notify_on_activation?: boolean;
  notification_delay_days?: number;
}

// Invitation acceptance data
export interface AcceptHeirInvitationData {
  invitation_code: string;
}

// =====================================================
// INHERITANCE PLAN TYPES
// =====================================================

export interface InheritancePlanBase {
  plan_name: string;
  plan_type: InheritancePlanType;
  instructions_encrypted: string | null;
}

export interface InheritancePlan extends InheritancePlanBase {
  id: string;
  user_id: string;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InheritancePlanFormData = Omit<InheritancePlan, 'id' | 'user_id' | 'is_triggered' | 'triggered_at' | 'created_at' | 'updated_at'>;

// Decrypted plan data
export interface InheritancePlanDecrypted extends Omit<InheritancePlan, 'instructions_encrypted'> {
  instructions: string | null;
}

// =====================================================
// HEIR VAULT ACCESS TYPES
// =====================================================

export interface HeirVaultAccessBase {
  heir_id: string;
  vault_id: string | null;
  vault_item_id: string | null;
  can_view: boolean;
  can_export: boolean;
  can_edit: boolean;
  reencrypted_key: string | null;
}

export interface HeirVaultAccess extends HeirVaultAccessBase {
  id: string;
  granted_at: string;
  accessed_at: string | null;
}

export type HeirVaultAccessFormData = Omit<HeirVaultAccess, 'id' | 'granted_at' | 'accessed_at'>;

// =====================================================
// INHERITANCE TRIGGER TYPES
// =====================================================

export interface InheritanceTriggerBase {
  inheritance_plan_id: string;
  user_id: string;
  trigger_reason: TriggerReasonType;
  trigger_metadata: Record<string, any> | null;
  requires_verification: boolean;
}

export interface InheritanceTrigger extends InheritanceTriggerBase {
  id: string;
  status: TriggerStatusType;
  verification_code: string | null;
  verified_at: string | null;
  verified_by: string | null;
  triggered_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export type InheritanceTriggerFormData = Omit<InheritanceTrigger, 'id' | 'status' | 'verification_code' | 'verified_at' | 'verified_by' | 'triggered_at' | 'completed_at' | 'cancelled_at'>;

// =====================================================
// COMBINED TYPES FOR UI
// =====================================================

export interface HeirWithPlan extends HeirDecrypted {
  plan?: InheritancePlanDecrypted;
}

export interface InheritancePlanWithHeirs extends InheritancePlanDecrypted {
  heirs: HeirDecrypted[];
  vault_access_count: number;
}

export interface HeirWithAccess extends HeirDecrypted {
  vault_access: HeirVaultAccess[];
}

// =====================================================
// STATISTICS TYPES
// =====================================================

export interface HeirStatistics {
  total_heirs: number;
  active_heirs: number;
  accepted_heirs: number;
  pending_heirs: number;
  heirs_by_access_level: {
    full: number;
    partial: number;
    view: number;
  };
}

export interface InheritancePlanStatistics {
  total_plans: number;
  active_plans: number;
  triggered_plans: number;
  plans_by_type: {
    full_access: number;
    partial_access: number;
    view_only: number;
    destroy: number;
  };
  // Note: Activation method is now global per user, not per plan
}
