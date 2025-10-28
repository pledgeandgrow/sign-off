-- Row Level Security (RLS) Policies - Part 1: Core Tables
-- Run these SQL commands in your Supabase SQL Editor

-- ============================================
-- ENABLE RLS ON CORE TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inheritance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE heirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE heir_vault_access ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- VAULTS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own vaults"
  ON vaults FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vaults"
  ON vaults FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vaults"
  ON vaults FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vaults"
  ON vaults FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VAULT_ITEMS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own vault items"
  ON vault_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vault items"
  ON vault_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault items"
  ON vault_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items"
  ON vault_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- INHERITANCE_PLANS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own inheritance plans"
  ON inheritance_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own inheritance plans"
  ON inheritance_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inheritance plans"
  ON inheritance_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inheritance plans"
  ON inheritance_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HEIRS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own heirs"
  ON heirs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own heirs"
  ON heirs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own heirs"
  ON heirs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own heirs"
  ON heirs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- HEIR_VAULT_ACCESS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own heir vault access"
  ON heir_vault_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM heirs
      WHERE heirs.id = heir_vault_access.heir_id
        AND heirs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own heir vault access"
  ON heir_vault_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM heirs
      WHERE heirs.id = heir_vault_access.heir_id
        AND heirs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own heir vault access"
  ON heir_vault_access FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM heirs
      WHERE heirs.id = heir_vault_access.heir_id
        AND heirs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own heir vault access"
  ON heir_vault_access FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM heirs
      WHERE heirs.id = heir_vault_access.heir_id
        AND heirs.user_id = auth.uid()
    )
  );
