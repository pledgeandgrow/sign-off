-- Fix RLS policies for heirs table to allow deletion
-- This migration ensures users can delete their own heirs

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can insert their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can update their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can delete their own heirs" ON heirs;

-- Enable RLS
ALTER TABLE heirs ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies

-- SELECT: Users can view their own heirs
CREATE POLICY "Users can view their own heirs"
ON heirs FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Users can create their own heirs
CREATE POLICY "Users can insert their own heirs"
ON heirs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own heirs
CREATE POLICY "Users can update their own heirs"
ON heirs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own heirs
CREATE POLICY "Users can delete their own heirs"
ON heirs FOR DELETE
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON heirs TO authenticated;
GRANT USAGE ON SEQUENCE heirs_id_seq TO authenticated;
