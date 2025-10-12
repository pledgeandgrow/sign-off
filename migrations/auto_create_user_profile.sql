-- =====================================================
-- AUTO-CREATE USER PROFILE TRIGGER
-- =====================================================
-- This trigger automatically creates a public.users record
-- whenever a new user signs up via Supabase Auth
-- =====================================================

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users with data from auth.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    public_key,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending', -- Temporary value, will be updated by app after key generation
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists (for re-running this migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Allow the trigger function to insert into public.users
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a user profile in public.users when a new user signs up via Supabase Auth';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Triggers automatic creation of user profile in public.users table';
