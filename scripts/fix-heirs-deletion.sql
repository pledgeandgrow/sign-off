-- Script rapide pour corriger la suppression des héritiers
-- Exécutez ce script dans le SQL Editor de Supabase

-- 1. Vérifier les politiques actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'heirs';

-- 2. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can insert their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can update their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can delete their own heirs" ON heirs;

-- 3. Activer RLS
ALTER TABLE heirs ENABLE ROW LEVEL SECURITY;

-- 4. Créer les nouvelles politiques

-- SELECT
CREATE POLICY "Users can view their own heirs"
ON heirs FOR SELECT
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own heirs"
ON heirs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own heirs"
ON heirs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE (IMPORTANT!)
CREATE POLICY "Users can delete their own heirs"
ON heirs FOR DELETE
USING (auth.uid() = user_id);

-- 5. Vérifier les permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON heirs TO authenticated;

-- 6. Vérifier que tout fonctionne
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Lecture'
    WHEN cmd = 'INSERT' THEN 'Création'
    WHEN cmd = 'UPDATE' THEN 'Modification'
    WHEN cmd = 'DELETE' THEN 'Suppression'
  END as operation
FROM pg_policies
WHERE tablename = 'heirs'
ORDER BY cmd;

-- Si vous voyez 4 lignes (SELECT, INSERT, UPDATE, DELETE), c'est bon ! ✅
