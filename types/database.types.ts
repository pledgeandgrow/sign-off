/**
 * Database Types for Sign-Off Password Manager
 * Updated to match migrations/schema.sql
 * 
 * Supports: Vaults with JSONB settings, Supabase Storage items, Heirs, Inheritance Plans
 */

// =====================================================
// ENUM TYPES (matching schema.sql)
// =====================================================

export type VaultCategoryType = 'delete_after_death' | 'share_after_death' | 'handle_after_death' | 'sign_off_after_death';

export type VaultItemType = 'password' | 'document' | 'video' | 'image' | 'note' | 'crypto' | 'bank' | 'other';

export type AccessLevelType = 'full' | 'partial' | 'view';

export type InheritancePlanType = 'full_access' | 'partial_access' | 'view_only' | 'destroy';

export type ActivationMethodType = 'inactivity' | 'death_certificate' | 'manual_trigger' | 'scheduled';

export type TriggerReasonType = 'inactivity' | 'manual' | 'scheduled' | 'death_certificate' | 'emergency_contact';

export type TriggerStatusType = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';

export type AlertType = 'failed_login' | 'suspicious_activity' | 'data_breach' | 'weak_password' | 'compromised_password' | 'unauthorized_access' | 'new_device' | 'location_change';

export type SeverityType = 'info' | 'warning' | 'critical';

export type TwoFAMethodType = 'totp' | 'sms' | 'email' | 'hardware_key';

export type RecoveryMethodType = 'passphrase' | 'security_questions' | 'backup_codes';

export type ResourceType = 'vault' | 'vault_item' | 'inheritance_plan' | 'heir' | 'user' | 'shared_vault';

export type RiskLevelType = 'low' | 'medium' | 'high' | 'critical';

// =====================================================
// TABLE TYPES
// =====================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  public_key: string | null;
  emergency_contact_email: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
  last_activity: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface PrivateKeyRecovery {
  id: string;
  user_id: string;
  encrypted_private_key: string;
  recovery_method: RecoveryMethodType;
  recovery_hint: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  expires_at: string | null;
  last_accessed: string | null;
}

// Vault settings structure (stored as JSONB)
export interface VaultSettings {
  autoLock: boolean;
  autoLockTimeout: number;
  maxFailedAttempts: number;
  twoFactorEnabled: boolean;
}

export interface VaultAccessControl {
  allowedUsers: string[];
  allowedHeirs: string[];
  requireApproval: boolean;
}

export interface VaultDeathSettings {
  triggerAfterDays: number;
  notifyContacts: boolean;
  notifyEmail: string[];
  notifySMS: string[];
  instructions: string;
}

export interface Vault {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: VaultCategoryType;
  icon: string | null;
  color: string | null;
  settings: VaultSettings;
  access_control: VaultAccessControl;
  death_settings: VaultDeathSettings;
  is_encrypted: boolean;
  is_locked: boolean;
  is_shared: boolean;
  is_favorite: boolean;
  tags: string[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  last_accessed: string | null;
}

export interface VaultItem {
  id: string;
  vault_id: string;
  user_id: string;
  item_type: VaultItemType;
  storage_path: string;
  storage_bucket: string;
  file_size: number | null;
  title_encrypted: string;
  tags: string[] | null;
  is_favorite: boolean;
  password_strength: number | null;
  password_last_changed: string | null;
  requires_password_change: boolean;
  created_at: string;
  updated_at: string;
  last_accessed: string | null;
}

export interface InheritancePlan {
  id: string;
  user_id: string;
  plan_name: string;
  plan_type: InheritancePlanType;
  activation_method: ActivationMethodType;
  scheduled_date: string | null;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at: string | null;
  instructions_encrypted: string | null;
  created_at: string;
  updated_at: string;
}

export interface Heir {
  id: string;
  user_id: string;
  inheritance_plan_id: string | null;
  full_name_encrypted: string;
  email_encrypted: string;
  phone_encrypted: string | null;
  relationship_encrypted: string | null;
  access_level: AccessLevelType;
  heir_user_id: string | null;
  heir_public_key: string | null;
  notify_on_activation: boolean;
  notification_delay_days: number;
  is_active: boolean;
  has_accepted: boolean;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeirVaultAccess {
  id: string;
  heir_id: string;
  vault_id: string | null;
  vault_item_id: string | null;
  can_view: boolean;
  can_export: boolean;
  can_edit: boolean;
  reencrypted_key: string | null;
  granted_at: string;
  accessed_at: string | null;
}

// Removed UserActivity table - using last_activity in users table instead

export interface InheritanceTrigger {
  id: string;
  inheritance_plan_id: string;
  user_id: string;
  trigger_reason: TriggerReasonType;
  trigger_metadata: Record<string, any> | null;
  status: TriggerStatusType;
  requires_verification: boolean;
  verification_code: string | null;
  verified_at: string | null;
  verified_by: string | null;
  triggered_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface SharedVault {
  id: string;
  vault_id: string;
  owner_id: string;
  shared_with_user_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  shared_key_encrypted: string;
  is_active: boolean;
  accepted: boolean;
  accepted_at: string | null;
  shared_at: string;
  expires_at: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: ResourceType;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  risk_level: RiskLevelType | null;
  created_at: string;
}

export interface SecurityAlert {
  id: string;
  user_id: string | null;
  alert_type: AlertType;
  severity: SeverityType;
  title: string;
  description: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface PasswordBreachCheck {
  id: string;
  vault_item_id: string;
  user_id: string;
  is_breached: boolean;
  breach_count: number;
  checked_at: string;
  last_notified_at: string | null;
}

export interface TwoFactorAuth {
  id: string;
  user_id: string;
  method: TwoFAMethodType;
  secret_encrypted: string | null;
  backup_codes_encrypted: string[] | null;
  is_enabled: boolean;
  is_verified: boolean;
  created_at: string;
  verified_at: string | null;
  last_used_at: string | null;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_name: string | null;
  device_type: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location_city: string | null;
  location_country: string | null;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
}

// =====================================================
// DATABASE INTERFACE
// =====================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      private_key_recovery: {
        Row: PrivateKeyRecovery;
        Insert: Omit<PrivateKeyRecovery, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PrivateKeyRecovery, 'id' | 'user_id' | 'created_at'>>;
      };
      vaults: {
        Row: Vault;
        Insert: Omit<Vault, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Vault, 'id' | 'user_id' | 'created_at'>>;
      };
      vault_items: {
        Row: VaultItem;
        Insert: Omit<VaultItem, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<VaultItem, 'id' | 'vault_id' | 'user_id' | 'created_at'>>;
      };
      inheritance_plans: {
        Row: InheritancePlan;
        Insert: Omit<InheritancePlan, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<InheritancePlan, 'id' | 'user_id' | 'created_at'>>;
      };
      heirs: {
        Row: Heir;
        Insert: Omit<Heir, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Heir, 'id' | 'user_id' | 'created_at'>>;
      };
      heir_vault_access: {
        Row: HeirVaultAccess;
        Insert: Omit<HeirVaultAccess, 'id' | 'granted_at'> & {
          id?: string;
          granted_at?: string;
        };
        Update: Partial<Omit<HeirVaultAccess, 'id' | 'heir_id' | 'granted_at'>>;
      };
      inheritance_triggers: {
        Row: InheritanceTrigger;
        Insert: Omit<InheritanceTrigger, 'id' | 'triggered_at'> & {
          id?: string;
          triggered_at?: string;
        };
        Update: Partial<Omit<InheritanceTrigger, 'id' | 'inheritance_plan_id' | 'user_id' | 'triggered_at'>>;
      };
      shared_vaults: {
        Row: SharedVault;
        Insert: Omit<SharedVault, 'id' | 'shared_at'> & {
          id?: string;
          shared_at?: string;
        };
        Update: Partial<Omit<SharedVault, 'id' | 'vault_id' | 'owner_id' | 'shared_with_user_id' | 'shared_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never; // Audit logs are immutable
      };
      security_alerts: {
        Row: SecurityAlert;
        Insert: Omit<SecurityAlert, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SecurityAlert, 'id' | 'user_id' | 'created_at'>>;
      };
      password_breach_checks: {
        Row: PasswordBreachCheck;
        Insert: Omit<PasswordBreachCheck, 'id' | 'checked_at'> & {
          id?: string;
          checked_at?: string;
        };
        Update: Partial<Omit<PasswordBreachCheck, 'id' | 'vault_item_id' | 'user_id' | 'checked_at'>>;
      };
      two_factor_auth: {
        Row: TwoFactorAuth;
        Insert: Omit<TwoFactorAuth, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<TwoFactorAuth, 'id' | 'user_id' | 'created_at'>>;
      };
      user_sessions: {
        Row: UserSession;
        Insert: Omit<UserSession, 'id' | 'created_at' | 'last_activity'> & {
          id?: string;
          created_at?: string;
          last_activity?: string;
        };
        Update: Partial<Omit<UserSession, 'id' | 'user_id' | 'session_token' | 'created_at'>>;
      };
    };
    Functions: {
      check_user_inactivity: {
        Args: Record<string, never>;
        Returns: void;
      };
      create_audit_log: {
        Args: {
          p_user_id: string;
          p_action: string;
          p_resource_type: ResourceType;
          p_resource_id?: string;
          p_old_values?: Record<string, any>;
          p_new_values?: Record<string, any>;
          p_ip_address?: string;
          p_user_agent?: string;
          p_risk_level?: RiskLevelType;
        };
        Returns: string;
      };
    };
  };
}

// =====================================================
// HELPER TYPES
// =====================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// =====================================================
// DECRYPTED TYPES (for client-side use after decryption)
// =====================================================

// Vault is already decrypted in the new schema (name/description are plain text)
// Items are encrypted and stored in Supabase Storage

// Decrypted item data (from Supabase Storage file)
export interface DecryptedVaultItemData {
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  [key: string]: any; // Allow additional fields
}

export interface DecryptedVaultItem extends VaultItem {
  decrypted_data?: DecryptedVaultItemData;
}

export interface DecryptedHeir extends Omit<Heir, 'full_name_encrypted' | 'email_encrypted' | 'phone_encrypted' | 'relationship_encrypted'> {
  full_name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
}

export interface DecryptedInheritancePlan extends Omit<InheritancePlan, 'instructions_encrypted'> {
  instructions: string | null;
}

// =====================================================
// QUERY RESULT TYPES (with joins)
// =====================================================

export interface VaultWithItems extends Vault {
  items: DecryptedVaultItem[];
  item_count: number;
}

export interface InheritancePlanWithHeirs extends DecryptedInheritancePlan {
  heirs: DecryptedHeir[];
  heir_count: number;
}

export interface HeirWithAccess extends DecryptedHeir {
  vault_access: HeirVaultAccess[];
}

export interface SharedVaultWithDetails extends SharedVault {
  vault: Vault;
  owner: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url'>;
}

export interface SecurityAlertWithUser extends SecurityAlert {
  user: Pick<User, 'id' | 'email' | 'full_name'> | null;
}
