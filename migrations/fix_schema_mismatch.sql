-- =====================================================
-- FIX SCHEMA MISMATCH FOR MVP LAUNCH
-- =====================================================
-- This migration ensures the database schema matches the code
-- Run this in Supabase SQL Editor before deployment

-- 1. Make public_key nullable for users who registered before key generation
ALTER TABLE public.users ALTER COLUMN public_key DROP NOT NULL;

-- 2. Add email_verified column if it doesn't exist (used in AuthContext)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 3. Add subscription fields to users table (for Square payments)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- 4. Ensure vault_items.title_encrypted can be plain text for MVP (no encryption)
-- Already correct in schema - title_encrypted is TEXT NOT NULL

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- 6. Update existing users to have default values
UPDATE public.users 
SET 
  email_verified = COALESCE(email_verified, false),
  subscription_tier = COALESCE(subscription_tier, 'free'),
  subscription_status = COALESCE(subscription_status, 'inactive')
WHERE email_verified IS NULL 
   OR subscription_tier IS NULL 
   OR subscription_status IS NULL;

-- Verification queries (run these to check)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'vaults' ORDER BY ordinal_position;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'vault_items' ORDER BY ordinal_position;
