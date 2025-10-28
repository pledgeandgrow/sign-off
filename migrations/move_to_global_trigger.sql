-- =====================================================
-- MOVE TO GLOBAL DEATH DETECTION TRIGGER
-- =====================================================
-- This migration moves activation_method and scheduled_date
-- from per-plan settings to global user settings
-- All inheritance plans will trigger based on the user's
-- global death detection configuration
-- =====================================================

-- =====================================================
-- STEP 1: ADD GLOBAL TRIGGER SETTINGS TO USERS TABLE
-- =====================================================

-- Add global trigger method to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS global_trigger_method TEXT 
DEFAULT 'inactivity' 
CHECK (global_trigger_method IN ('inactivity', 'death_certificate', 'manual_trigger', 'scheduled'));

-- Add global trigger settings (JSON for flexibility)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS global_trigger_settings JSONB 
DEFAULT '{"inactivity_days": 30}'::jsonb;

-- Add scheduled trigger date (for scheduled method)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS global_scheduled_date TIMESTAMPTZ;

-- Add trusted contact for manual trigger
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trusted_contact_email TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trusted_contact_phone TEXT;

-- Add last activity tracking (for inactivity detection)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN public.users.global_trigger_method IS 'Global death detection method that applies to all inheritance plans';
COMMENT ON COLUMN public.users.global_trigger_settings IS 'JSON settings for trigger method (e.g., {"inactivity_days": 30})';
COMMENT ON COLUMN public.users.global_scheduled_date IS 'Scheduled date for global trigger (if method is scheduled)';
COMMENT ON COLUMN public.users.last_activity IS 'Last user activity timestamp for inactivity detection';

-- =====================================================
-- STEP 2: MIGRATE EXISTING DATA
-- =====================================================

-- Migrate activation_method from inheritance_plans to users
-- Use the most common activation_method per user
UPDATE public.users u
SET global_trigger_method = (
  SELECT activation_method::text
  FROM public.inheritance_plans ip
  WHERE ip.user_id = u.id
  AND ip.is_active = true
  GROUP BY activation_method
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM public.inheritance_plans ip
  WHERE ip.user_id = u.id
);

-- Migrate scheduled_date if any plan has it
UPDATE public.users u
SET global_scheduled_date = (
  SELECT MIN(scheduled_date)
  FROM public.inheritance_plans ip
  WHERE ip.user_id = u.id
  AND scheduled_date IS NOT NULL
)
WHERE EXISTS (
  SELECT 1 FROM public.inheritance_plans ip
  WHERE ip.user_id = u.id
  AND scheduled_date IS NOT NULL
);

-- =====================================================
-- STEP 3: REMOVE OLD COLUMNS FROM INHERITANCE_PLANS
-- =====================================================

-- Drop the constraint first
ALTER TABLE public.inheritance_plans 
DROP CONSTRAINT IF EXISTS inheritance_plans_scheduled_check;

-- Remove activation_method column
ALTER TABLE public.inheritance_plans 
DROP COLUMN IF EXISTS activation_method;

-- Remove scheduled_date column
ALTER TABLE public.inheritance_plans 
DROP COLUMN IF EXISTS scheduled_date;

-- =====================================================
-- STEP 4: DROP OLD INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_inheritance_plans_activation_method;

-- =====================================================
-- STEP 5: CREATE NEW INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_global_trigger_method 
ON public.users(global_trigger_method);

CREATE INDEX IF NOT EXISTS idx_users_last_activity 
ON public.users(last_activity) 
WHERE global_trigger_method = 'inactivity';

CREATE INDEX IF NOT EXISTS idx_users_global_scheduled_date 
ON public.users(global_scheduled_date) 
WHERE global_trigger_method = 'scheduled';

-- =====================================================
-- STEP 6: UPDATE TRIGGER FUNCTION
-- =====================================================

-- Drop old function
DROP FUNCTION IF EXISTS check_inactivity_triggers();

-- Create new function that uses global settings
CREATE OR REPLACE FUNCTION check_inactivity_triggers()
RETURNS void AS $$
DECLARE
  inactive_user RECORD;
  user_plan RECORD;
BEGIN
  -- Find users who are inactive based on their global settings
  FOR inactive_user IN
    SELECT 
      u.id as user_id,
      u.email,
      u.last_activity,
      u.global_trigger_settings->>'inactivity_days' as inactivity_days,
      EXTRACT(DAY FROM (NOW() - u.last_activity)) as days_inactive
    FROM public.users u
    WHERE u.global_trigger_method = 'inactivity'
      AND u.is_active = true
      AND u.last_activity IS NOT NULL
      AND EXTRACT(DAY FROM (NOW() - u.last_activity)) >= 
          COALESCE((u.global_trigger_settings->>'inactivity_days')::integer, 30)
      AND EXISTS (
        SELECT 1 FROM public.inheritance_plans ip
        WHERE ip.user_id = u.id
        AND ip.is_active = true
        AND ip.is_triggered = false
      )
  LOOP
    -- Trigger all active plans for this user
    FOR user_plan IN
      SELECT id
      FROM public.inheritance_plans
      WHERE user_id = inactive_user.user_id
      AND is_active = true
      AND is_triggered = false
    LOOP
      -- Call the trigger function for each plan
      PERFORM trigger_inheritance_plan(user_plan.id, 'inactivity');
      
      RAISE NOTICE 'Triggered plan % for user % due to % days inactivity',
        user_plan.id, inactive_user.user_id, inactive_user.days_inactive;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_inactivity_triggers() IS 'Check for users who meet global inactivity threshold and trigger all their plans';

-- =====================================================
-- STEP 7: CREATE SCHEDULED TRIGGER CHECK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_scheduled_triggers()
RETURNS void AS $$
DECLARE
  scheduled_user RECORD;
  user_plan RECORD;
BEGIN
  -- Find users whose scheduled date has passed
  FOR scheduled_user IN
    SELECT 
      u.id as user_id,
      u.email,
      u.global_scheduled_date
    FROM public.users u
    WHERE u.global_trigger_method = 'scheduled'
      AND u.global_scheduled_date IS NOT NULL
      AND u.global_scheduled_date <= NOW()
      AND u.is_active = true
      AND EXISTS (
        SELECT 1 FROM public.inheritance_plans ip
        WHERE ip.user_id = u.id
        AND ip.is_active = true
        AND ip.is_triggered = false
      )
  LOOP
    -- Trigger all active plans for this user
    FOR user_plan IN
      SELECT id
      FROM public.inheritance_plans
      WHERE user_id = scheduled_user.user_id
      AND is_active = true
      AND is_triggered = false
    LOOP
      -- Call the trigger function for each plan
      PERFORM trigger_inheritance_plan(user_plan.id, 'scheduled');
      
      RAISE NOTICE 'Triggered plan % for user % due to scheduled date %',
        user_plan.id, scheduled_user.user_id, scheduled_user.global_scheduled_date;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_scheduled_triggers() IS 'Check for users whose scheduled trigger date has passed and trigger all their plans';

-- =====================================================
-- STEP 8: UPDATE ACTIVITY TRACKING FUNCTION
-- =====================================================

-- Function to update last_activity on user actions
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_activity = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update last_activity
-- (Add more tables as needed based on what constitutes "activity")

CREATE TRIGGER update_activity_on_vault_access
  AFTER INSERT OR UPDATE ON public.vaults
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activity();

CREATE TRIGGER update_activity_on_vault_item_access
  AFTER INSERT OR UPDATE ON public.vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activity();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if global trigger columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('global_trigger_method', 'global_trigger_settings', 'global_scheduled_date', 'last_activity', 'trusted_contact_email');

-- Check if old columns were removed
SELECT column_name
FROM information_schema.columns 
WHERE table_name = 'inheritance_plans' 
  AND column_name IN ('activation_method', 'scheduled_date');
-- Should return 0 rows

-- Check users with global trigger settings
SELECT 
  id,
  email,
  global_trigger_method,
  global_trigger_settings,
  global_scheduled_date,
  last_activity
FROM public.users
LIMIT 5;

-- Check inheritance plans (should not have activation_method or scheduled_date)
SELECT 
  id,
  user_id,
  plan_name,
  plan_type,
  is_active,
  is_triggered
FROM public.inheritance_plans
LIMIT 5;

-- =====================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- =====================================================

/*
-- To rollback this migration:

-- 1. Add columns back to inheritance_plans
ALTER TABLE public.inheritance_plans 
ADD COLUMN activation_method activation_method_type DEFAULT 'inactivity';

ALTER TABLE public.inheritance_plans 
ADD COLUMN scheduled_date TIMESTAMPTZ;

-- 2. Migrate data back
UPDATE public.inheritance_plans ip
SET activation_method = u.global_trigger_method::activation_method_type
FROM public.users u
WHERE ip.user_id = u.id;

-- 3. Remove columns from users
ALTER TABLE public.users DROP COLUMN IF EXISTS global_trigger_method;
ALTER TABLE public.users DROP COLUMN IF EXISTS global_trigger_settings;
ALTER TABLE public.users DROP COLUMN IF EXISTS global_scheduled_date;
ALTER TABLE public.users DROP COLUMN IF EXISTS trusted_contact_email;
ALTER TABLE public.users DROP COLUMN IF EXISTS trusted_contact_phone;
ALTER TABLE public.users DROP COLUMN IF EXISTS last_activity;

-- 4. Recreate old indexes
CREATE INDEX idx_inheritance_plans_activation_method 
ON public.inheritance_plans(activation_method);
*/
