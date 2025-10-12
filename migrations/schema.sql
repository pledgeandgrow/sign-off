-- =====================================================
-- SIGN-OFF: DIGITAL LEGACY & PASSWORD MANAGER
-- =====================================================
-- Simplified schema aligned with React Native mobile app
-- Supports: Vaults, Items (stored as JSON), Heirs, Inheritance Plans
-- End-to-end encryption with client-side key management
-- Production-ready with RLS and proper indexing
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CUSTOM ENUM TYPES
-- =====================================================

DO $$ BEGIN
  CREATE TYPE vault_category_type AS ENUM ('delete_after_death', 'share_after_death', 'handle_after_death', 'sign_off_after_death');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vault_item_type AS ENUM ('password', 'document', 'video', 'image', 'note', 'crypto', 'bank', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE access_level_type AS ENUM ('full', 'partial', 'view');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trigger_status_type AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE inheritance_plan_type AS ENUM ('full_access', 'partial_access', 'view_only', 'destroy');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE activation_method_type AS ENUM ('inactivity', 'death_certificate', 'manual_trigger', 'scheduled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trigger_reason_type AS ENUM ('inactivity', 'manual', 'scheduled', 'death_certificate', 'emergency_contact');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('failed_login', 'suspicious_activity', 'data_breach', 'weak_password', 'compromised_password', 'unauthorized_access', 'new_device', 'location_change');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE severity_type AS ENUM ('info', 'warning', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE two_fa_method_type AS ENUM ('totp', 'sms', 'email', 'hardware_key');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 1. USERS TABLE (Extended Profile)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Public key for encryption (stored in plain text)
  public_key TEXT NOT NULL,
  
  -- Emergency contact settings
  emergency_contact_email TEXT,
  emergency_contact_phone TEXT,
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  account_locked BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- 2. PRIVATE KEY RECOVERY TABLE
-- =====================================================
-- Optional: Encrypted backup of private keys
CREATE TABLE IF NOT EXISTS public.private_key_recovery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Encrypted private key (encrypted with recovery passphrase)
  encrypted_private_key TEXT NOT NULL,
  
  -- Recovery method
  recovery_method TEXT NOT NULL CHECK (recovery_method IN ('passphrase', 'security_questions', 'backup_codes')),
  recovery_hint TEXT,
  
  -- Security
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_accessed TIMESTAMPTZ,
  
  CONSTRAINT unique_user_recovery UNIQUE (user_id, recovery_method)
);

-- =====================================================
-- 3. VAULTS TABLE
-- =====================================================
-- Main container for organizing items
CREATE TABLE IF NOT EXISTS public.vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Vault details
  name TEXT NOT NULL,
  description TEXT,
  category vault_category_type NOT NULL,
  icon TEXT,
  color TEXT,
  
  -- Vault settings (JSONB for flexibility with React Native app)
  settings JSONB DEFAULT '{
    "autoLock": true,
    "autoLockTimeout": 15,
    "maxFailedAttempts": 5,
    "twoFactorEnabled": false
  }'::jsonb,
  
  -- Access control
  access_control JSONB DEFAULT '{
    "allowedUsers": [],
    "allowedHeirs": [],
    "requireApproval": true
  }'::jsonb,
  
  -- Death/inactivity settings
  death_settings JSONB DEFAULT '{
    "triggerAfterDays": 30,
    "notifyContacts": true,
    "notifyEmail": [],
    "notifySMS": [],
    "instructions": ""
  }'::jsonb,
  
  -- Metadata
  is_encrypted BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[],
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  
  CONSTRAINT vaults_sort_order_check CHECK (sort_order >= 0)
);

-- =====================================================
-- 4. VAULT ITEMS TABLE (References to Supabase Storage)
-- =====================================================
-- Metadata for encrypted files stored in Supabase Storage buckets
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Item type
  item_type vault_item_type NOT NULL,
  
  -- Storage reference
  storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket (e.g., 'user_id/vault_id/item_id.enc')
  storage_bucket TEXT NOT NULL DEFAULT 'vault-items', -- Bucket name
  file_size BIGINT, -- File size in bytes
  
  -- Encrypted metadata (stored in DB for quick access)
  title_encrypted TEXT NOT NULL,
  
  -- Metadata (not encrypted)
  tags TEXT[], -- Array of tags for organization
  is_favorite BOOLEAN DEFAULT false,
  
  -- Security
  password_strength INTEGER,
  password_last_changed TIMESTAMPTZ,
  requires_password_change BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT vault_items_password_strength_check 
    CHECK (password_strength IS NULL OR (password_strength >= 0 AND password_strength <= 100)),
  
  CONSTRAINT vault_items_storage_path_unique 
    UNIQUE (storage_path)
);

-- =====================================================
-- 5. INHERITANCE PLANS TABLE
-- =====================================================
-- Define what happens to user's data after death
CREATE TABLE IF NOT EXISTS public.inheritance_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Plan details
  plan_name TEXT NOT NULL,
  plan_type inheritance_plan_type NOT NULL,
  
  -- Activation conditions
  activation_method activation_method_type NOT NULL,
  scheduled_date TIMESTAMPTZ, -- For scheduled activation
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ,
  
  -- Encrypted instructions
  instructions_encrypted TEXT, -- Instructions for heirs
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT inheritance_plans_scheduled_check CHECK (
    (activation_method = 'scheduled' AND scheduled_date IS NOT NULL) OR
    (activation_method != 'scheduled')
  )
);

-- =====================================================
-- 6. HEIRS TABLE
-- =====================================================
-- People who will receive access to vaults/items upon inheritance activation
CREATE TABLE IF NOT EXISTS public.heirs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  inheritance_plan_id UUID REFERENCES public.inheritance_plans(id) ON DELETE CASCADE,
  
  -- Heir details (encrypted)
  full_name_encrypted TEXT NOT NULL,
  email_encrypted TEXT NOT NULL,
  phone_encrypted TEXT,
  relationship_encrypted TEXT, -- e.g., "spouse", "child", "friend"
  
  -- Access level
  access_level access_level_type NOT NULL,
  
  -- Heir's public key (if they are also a user)
  heir_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  heir_public_key TEXT, -- For non-users, they'll need to provide this
  
  -- Notification settings
  notify_on_activation BOOLEAN DEFAULT true,
  notification_delay_days INTEGER DEFAULT 0, -- Delay before notifying
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  has_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT heirs_notification_delay_check CHECK (notification_delay_days >= 0)
);

-- =====================================================
-- 7. HEIR VAULT ACCESS TABLE
-- =====================================================
-- Maps which vaults/items heirs can access
CREATE TABLE IF NOT EXISTS public.heir_vault_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  heir_id UUID NOT NULL REFERENCES public.heirs(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE,
  vault_item_id UUID REFERENCES public.vault_items(id) ON DELETE CASCADE,
  
  -- Access permissions
  can_view BOOLEAN DEFAULT true,
  can_export BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  
  -- Encrypted re-encryption key
  -- When plan activates, items are re-encrypted with heir's public key
  reencrypted_key TEXT, -- Encrypted symmetric key for this vault/item
  
  -- Timestamps
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_at TIMESTAMPTZ,
  
  CONSTRAINT heir_vault_access_check CHECK (
    (vault_id IS NOT NULL AND vault_item_id IS NULL) OR
    (vault_id IS NULL AND vault_item_id IS NOT NULL)
  )
);


-- =====================================================
-- 8. INHERITANCE TRIGGERS TABLE
-- =====================================================
-- Log when inheritance plans are triggered
CREATE TABLE IF NOT EXISTS public.inheritance_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inheritance_plan_id UUID NOT NULL REFERENCES public.inheritance_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Trigger details
  trigger_reason trigger_reason_type NOT NULL,
  trigger_metadata JSONB, -- Additional context
  
  -- Status
  status trigger_status_type NOT NULL DEFAULT 'pending',
  
  -- Verification
  requires_verification BOOLEAN DEFAULT true,
  verification_code TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  
  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- =====================================================
-- 9. SHARED VAULTS TABLE
-- =====================================================
-- For sharing vaults with other users while alive
CREATE TABLE IF NOT EXISTS public.shared_vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Permissions
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_share BOOLEAN DEFAULT false,
  
  -- Encrypted shared key
  shared_key_encrypted TEXT NOT NULL, -- Vault key encrypted with recipient's public key
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration
  
  CONSTRAINT shared_vaults_unique UNIQUE (vault_id, shared_with_user_id)
);

-- =====================================================
-- 10. AUDIT LOGS TABLE
-- =====================================================
-- Comprehensive audit trail for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('vault', 'vault_item', 'inheritance_plan', 'heir', 'user', 'shared_vault')),
  resource_id UUID,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Changes (for update actions)
  old_values JSONB,
  new_values JSONB,
  
  -- Security
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 11. SECURITY ALERTS TABLE
-- =====================================================
-- Track security events and breaches
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type alert_type NOT NULL,
  severity severity_type NOT NULL,
  
  -- Description
  title TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. PASSWORD BREACH CHECKS TABLE
-- =====================================================
-- Track passwords that have been checked against breach databases
CREATE TABLE IF NOT EXISTS public.password_breach_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_item_id UUID NOT NULL REFERENCES public.vault_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Check results
  is_breached BOOLEAN NOT NULL,
  breach_count INTEGER DEFAULT 0, -- How many times found in breaches
  
  -- Timestamps
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ
);

-- =====================================================
-- 13. TWO-FACTOR AUTHENTICATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 2FA method
  method two_fa_method_type NOT NULL,
  
  -- Encrypted secret (for TOTP)
  secret_encrypted TEXT,
  
  -- Backup codes (encrypted)
  backup_codes_encrypted TEXT[],
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  CONSTRAINT two_factor_auth_unique UNIQUE (user_id, method)
);

-- =====================================================
-- 14. SESSIONS TABLE
-- =====================================================
-- Track active user sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Location (optional)
  location_city TEXT,
  location_country TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_last_login ON public.users(last_login);

-- Private Key Recovery
CREATE INDEX idx_private_key_recovery_user_id ON public.private_key_recovery(user_id);
CREATE INDEX idx_private_key_recovery_expires_at ON public.private_key_recovery(expires_at);

-- Vaults
CREATE INDEX idx_vaults_user_id ON public.vaults(user_id);
CREATE INDEX idx_vaults_is_shared ON public.vaults(is_shared);
CREATE INDEX idx_vaults_is_favorite ON public.vaults(is_favorite);

-- Vault Items
CREATE INDEX idx_vault_items_vault_id ON public.vault_items(vault_id);
CREATE INDEX idx_vault_items_user_id ON public.vault_items(user_id);
CREATE INDEX idx_vault_items_item_type ON public.vault_items(item_type);
CREATE INDEX idx_vault_items_tags ON public.vault_items USING GIN(tags);
CREATE INDEX idx_vault_items_is_favorite ON public.vault_items(is_favorite);
CREATE INDEX idx_vault_items_last_accessed ON public.vault_items(last_accessed);
CREATE INDEX idx_vault_items_storage_path ON public.vault_items(storage_path);
CREATE INDEX idx_vault_items_storage_bucket ON public.vault_items(storage_bucket);

-- Inheritance Plans
CREATE INDEX idx_inheritance_plans_user_id ON public.inheritance_plans(user_id);
CREATE INDEX idx_inheritance_plans_is_active ON public.inheritance_plans(is_active);
CREATE INDEX idx_inheritance_plans_is_triggered ON public.inheritance_plans(is_triggered);
CREATE INDEX idx_inheritance_plans_activation_method ON public.inheritance_plans(activation_method);

-- Heirs
CREATE INDEX idx_heirs_user_id ON public.heirs(user_id);
CREATE INDEX idx_heirs_inheritance_plan_id ON public.heirs(inheritance_plan_id);
CREATE INDEX idx_heirs_heir_user_id ON public.heirs(heir_user_id);
CREATE INDEX idx_heirs_is_active ON public.heirs(is_active);

-- Heir Vault Access
CREATE INDEX idx_heir_vault_access_heir_id ON public.heir_vault_access(heir_id);
CREATE INDEX idx_heir_vault_access_vault_id ON public.heir_vault_access(vault_id);
CREATE INDEX idx_heir_vault_access_vault_item_id ON public.heir_vault_access(vault_item_id);

-- Inheritance Triggers
CREATE INDEX idx_inheritance_triggers_inheritance_plan_id ON public.inheritance_triggers(inheritance_plan_id);
CREATE INDEX idx_inheritance_triggers_user_id ON public.inheritance_triggers(user_id);
CREATE INDEX idx_inheritance_triggers_status ON public.inheritance_triggers(status);
CREATE INDEX idx_inheritance_triggers_triggered_at ON public.inheritance_triggers(triggered_at);

-- Shared Vaults
CREATE INDEX idx_shared_vaults_vault_id ON public.shared_vaults(vault_id);
CREATE INDEX idx_shared_vaults_owner_id ON public.shared_vaults(owner_id);
CREATE INDEX idx_shared_vaults_shared_with_user_id ON public.shared_vaults(shared_with_user_id);
CREATE INDEX idx_shared_vaults_is_active ON public.shared_vaults(is_active);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Security Alerts
CREATE INDEX idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX idx_security_alerts_alert_type ON public.security_alerts(alert_type);
CREATE INDEX idx_security_alerts_is_resolved ON public.security_alerts(is_resolved);
CREATE INDEX idx_security_alerts_created_at ON public.security_alerts(created_at);

-- Password Breach Checks
CREATE INDEX idx_password_breach_checks_vault_item_id ON public.password_breach_checks(vault_item_id);
CREATE INDEX idx_password_breach_checks_user_id ON public.password_breach_checks(user_id);
CREATE INDEX idx_password_breach_checks_is_breached ON public.password_breach_checks(is_breached);

-- Two-Factor Auth
CREATE INDEX idx_two_factor_auth_user_id ON public.two_factor_auth(user_id);
CREATE INDEX idx_two_factor_auth_is_enabled ON public.two_factor_auth(is_enabled);

-- User Sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_key_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inheritance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heir_vault_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inheritance_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_breach_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Private Key Recovery policies
CREATE POLICY "Users can view their own recovery keys"
  ON public.private_key_recovery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery keys"
  ON public.private_key_recovery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery keys"
  ON public.private_key_recovery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recovery keys"
  ON public.private_key_recovery FOR DELETE
  USING (auth.uid() = user_id);

-- Vaults policies
CREATE POLICY "Users can view their own vaults"
  ON public.vaults FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared vaults"
  ON public.vaults FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_vaults
      WHERE shared_vaults.vault_id = vaults.id
      AND shared_vaults.shared_with_user_id = auth.uid()
      AND shared_vaults.is_active = true
      AND shared_vaults.accepted = true
    )
  );

CREATE POLICY "Users can insert their own vaults"
  ON public.vaults FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vaults"
  ON public.vaults FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vaults"
  ON public.vaults FOR DELETE
  USING (auth.uid() = user_id);

-- Vault Items policies
CREATE POLICY "Users can view their own vault items"
  ON public.vault_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared vault items"
  ON public.vault_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_vaults sv
      JOIN public.vaults v ON sv.vault_id = v.id
      WHERE v.id = vault_items.vault_id
      AND sv.shared_with_user_id = auth.uid()
      AND sv.is_active = true
      AND sv.accepted = true
      AND sv.can_view = true
    )
  );

CREATE POLICY "Users can insert their own vault items"
  ON public.vault_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault items"
  ON public.vault_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault items"
  ON public.vault_items FOR DELETE
  USING (auth.uid() = user_id);

-- Inheritance Plans policies
CREATE POLICY "Users can view their own inheritance plans"
  ON public.inheritance_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inheritance plans"
  ON public.inheritance_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inheritance plans"
  ON public.inheritance_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inheritance plans"
  ON public.inheritance_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Heirs policies
CREATE POLICY "Users can view their own heirs"
  ON public.heirs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Heirs can view their own records"
  ON public.heirs FOR SELECT
  USING (auth.uid() = heir_user_id);

CREATE POLICY "Users can insert their own heirs"
  ON public.heirs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own heirs"
  ON public.heirs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own heirs"
  ON public.heirs FOR DELETE
  USING (auth.uid() = user_id);

-- Heir Vault Access policies
CREATE POLICY "Heirs can view their granted access"
  ON public.heir_vault_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.heirs
      WHERE heirs.id = heir_vault_access.heir_id
      AND heirs.heir_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage heir vault access"
  ON public.heir_vault_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.heirs
      WHERE heirs.id = heir_vault_access.heir_id
      AND heirs.user_id = auth.uid()
    )
  );

-- Inheritance Triggers policies
CREATE POLICY "Users can view their own inheritance triggers"
  ON public.inheritance_triggers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Heirs can view relevant triggers"
  ON public.inheritance_triggers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.heirs h
      JOIN public.inheritance_plans ip ON h.inheritance_plan_id = ip.id
      WHERE ip.id = inheritance_triggers.inheritance_plan_id
      AND h.heir_user_id = auth.uid()
    )
  );

-- Shared Vaults policies
CREATE POLICY "Users can view vaults they own or are shared with"
  ON public.shared_vaults FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = shared_with_user_id);

CREATE POLICY "Vault owners can share their vaults"
  ON public.shared_vaults FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Vault owners can update shared vault settings"
  ON public.shared_vaults FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Vault owners can revoke shared access"
  ON public.shared_vaults FOR DELETE
  USING (auth.uid() = owner_id);

-- Audit Logs policies
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Security Alerts policies
CREATE POLICY "Users can view their own security alerts"
  ON public.security_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security alerts"
  ON public.security_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Password Breach Checks policies
CREATE POLICY "Users can view their own breach checks"
  ON public.password_breach_checks FOR SELECT
  USING (auth.uid() = user_id);

-- Two-Factor Auth policies
CREATE POLICY "Users can view their own 2FA settings"
  ON public.two_factor_auth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own 2FA settings"
  ON public.two_factor_auth FOR ALL
  USING (auth.uid() = user_id);

-- User Sessions policies
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp trigger function (reuse existing)
-- Already created in previous migration

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaults_updated_at
  BEFORE UPDATE ON public.vaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_items_updated_at
  BEFORE UPDATE ON public.vault_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inheritance_plans_updated_at
  BEFORE UPDATE ON public.inheritance_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_heirs_updated_at
  BEFORE UPDATE ON public.heirs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to manually trigger inheritance plan
CREATE OR REPLACE FUNCTION trigger_inheritance_plan(
  p_plan_id UUID,
  p_trigger_reason trigger_reason_type,
  p_trigger_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  trigger_id UUID;
  plan_user_id UUID;
BEGIN
  -- Get plan user_id
  SELECT user_id INTO plan_user_id
  FROM public.inheritance_plans
  WHERE id = p_plan_id;
  
  -- Create inheritance trigger
  INSERT INTO public.inheritance_triggers (
    inheritance_plan_id,
    user_id,
    trigger_reason,
    trigger_metadata,
    status,
    requires_verification
  ) VALUES (
    p_plan_id,
    plan_user_id,
    p_trigger_reason,
    p_trigger_metadata,
    'pending',
    true
  ) RETURNING id INTO trigger_id;
  
  -- Mark plan as triggered
  UPDATE public.inheritance_plans
  SET is_triggered = true, triggered_at = NOW()
  WHERE id = p_plan_id;
  
  RETURN trigger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    risk_level
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent,
    p_risk_level
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user inactivity and trigger inheritance plans
CREATE OR REPLACE FUNCTION check_user_inactivity()
RETURNS void AS $$
DECLARE
  plan_record RECORD;
  inactive_days INTEGER;
BEGIN
  -- Loop through all active inheritance plans with inactivity activation
  FOR plan_record IN
    SELECT 
      ip.id as plan_id,
      ip.user_id,
      u.last_activity,
      EXTRACT(DAY FROM (NOW() - u.last_activity)) as days_inactive
    FROM public.inheritance_plans ip
    JOIN public.users u ON u.id = ip.user_id
    WHERE ip.is_active = true
      AND ip.is_triggered = false
      AND ip.activation_method = 'inactivity'
      AND u.last_activity IS NOT NULL
  LOOP
    -- Check if user has been inactive long enough
    -- Get trigger days from vault death_settings (default 30 days)
    SELECT COALESCE(
      (SELECT (death_settings->>'triggerAfterDays')::INTEGER 
       FROM public.vaults 
       WHERE user_id = plan_record.user_id 
       LIMIT 1),
      30
    ) INTO inactive_days;
    
    IF plan_record.days_inactive >= inactive_days THEN
      -- Trigger the inheritance plan
      PERFORM trigger_inheritance_plan(
        plan_record.plan_id,
        'inactivity'::trigger_reason_type,
        jsonb_build_object(
          'days_inactive', plan_record.days_inactive,
          'last_activity', plan_record.last_activity
        )
      );
      
      -- Log the event
      PERFORM create_audit_log(
        plan_record.user_id,
        'inheritance_plan_triggered',
        'inheritance_plan',
        plan_record.plan_id,
        NULL,
        jsonb_build_object('reason', 'inactivity', 'days', plan_record.days_inactive),
        NULL,
        NULL,
        'high'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'Extended user profile with public key for encryption';
COMMENT ON TABLE public.private_key_recovery IS 'Encrypted backup storage for private key recovery';
COMMENT ON TABLE public.vaults IS 'Containers for organizing passwords and secrets';
COMMENT ON TABLE public.vault_items IS 'Metadata for encrypted files stored in Supabase Storage buckets';
COMMENT ON TABLE public.inheritance_plans IS 'Plans defining what happens to data after death';
COMMENT ON TABLE public.heirs IS 'People who will receive access to vaults/items upon inheritance activation';
COMMENT ON TABLE public.heir_vault_access IS 'Specific vault/item access grants for heirs';
COMMENT ON TABLE public.inheritance_triggers IS 'Log of triggered inheritance plans';
COMMENT ON TABLE public.shared_vaults IS 'Vault sharing between users while alive';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for security';
COMMENT ON TABLE public.security_alerts IS 'Security events and breach notifications';
COMMENT ON TABLE public.password_breach_checks IS 'Password breach monitoring results';
COMMENT ON TABLE public.two_factor_auth IS 'Two-factor authentication settings';
COMMENT ON TABLE public.user_sessions IS 'Active user session tracking';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
