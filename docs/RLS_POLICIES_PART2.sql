-- Row Level Security (RLS) Policies - Part 2: Security & Activity Tables
-- Run these SQL commands in your Supabase SQL Editor

-- ============================================
-- ENABLE RLS ON SECURITY TABLES
-- ============================================

ALTER TABLE inheritance_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_key_recovery ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INHERITANCE_TRIGGERS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own inheritance triggers"
  ON inheritance_triggers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create inheritance triggers"
  ON inheritance_triggers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own inheritance triggers"
  ON inheritance_triggers FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- USER_ACTIVITY TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own activity"
  ON user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON user_activity FOR INSERT
  WITH CHECK (true);

-- ============================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TWO_FACTOR_AUTH TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own 2FA settings"
  ON two_factor_auth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own 2FA settings"
  ON two_factor_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
  ON two_factor_auth FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2FA settings"
  ON two_factor_auth FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- USER_SESSIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SECURITY_ALERTS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own security alerts"
  ON security_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create security alerts"
  ON security_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own security alerts"
  ON security_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- PRIVATE_KEY_RECOVERY TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own recovery settings"
  ON private_key_recovery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recovery settings"
  ON private_key_recovery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recovery settings"
  ON private_key_recovery FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recovery settings"
  ON private_key_recovery FOR DELETE
  USING (auth.uid() = user_id);
