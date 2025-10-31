# 🔧 Dépannage : Suppression des Héritiers

## ❌ Problème : Impossible de supprimer un héritier

### **Symptômes**
- Cliquer sur le bouton "Supprimer" ne fait rien
- Pas de message d'erreur visible
- L'héritier reste dans la liste

---

## ✅ Solution

Le problème vient des **politiques RLS (Row Level Security)** de Supabase qui bloquent la suppression.

### **Méthode 1 : Via le SQL Editor de Supabase (Recommandé)**

1. **Ouvrir Supabase Dashboard**
   - Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sélectionner votre projet

2. **Ouvrir le SQL Editor**
   - Menu de gauche → **SQL Editor**
   - Cliquer sur **New query**

3. **Copier-coller ce script**
   ```sql
   -- Supprimer les anciennes politiques
   DROP POLICY IF EXISTS "Users can delete their own heirs" ON heirs;

   -- Créer la politique de suppression
   CREATE POLICY "Users can delete their own heirs"
   ON heirs FOR DELETE
   USING (auth.uid() = user_id);

   -- Vérifier
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'heirs';
   ```

4. **Exécuter** (bouton "Run" ou Ctrl+Enter)

5. **Vérifier le résultat**
   - Vous devriez voir 4 politiques : SELECT, INSERT, UPDATE, DELETE
   - Si DELETE est présent → ✅ C'est bon !

---

### **Méthode 2 : Via Supabase CLI**

```bash
# Appliquer la migration
supabase db push

# OU exécuter le script directement
supabase db execute --file scripts/fix-heirs-deletion.sql
```

---

### **Méthode 3 : Script complet (si rien ne fonctionne)**

Copiez ce script dans le SQL Editor :

```sql
-- 1. Désactiver temporairement RLS
ALTER TABLE heirs DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer TOUTES les politiques
DROP POLICY IF EXISTS "Users can view their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can insert their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can update their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can delete their own heirs" ON heirs;

-- 3. Réactiver RLS
ALTER TABLE heirs ENABLE ROW LEVEL SECURITY;

-- 4. Recréer TOUTES les politiques

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

-- DELETE
CREATE POLICY "Users can delete their own heirs"
ON heirs FOR DELETE
USING (auth.uid() = user_id);

-- 5. Vérifier les permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON heirs TO authenticated;

-- 6. Vérifier le résultat
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'heirs'
ORDER BY cmd;
```

---

## 🔍 Vérification

### **1. Vérifier les politiques RLS**

Dans le SQL Editor :
```sql
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Lecture'
    WHEN cmd = 'INSERT' THEN '✅ Création'
    WHEN cmd = 'UPDATE' THEN '✅ Modification'
    WHEN cmd = 'DELETE' THEN '✅ Suppression'
  END as status
FROM pg_policies
WHERE tablename = 'heirs'
ORDER BY cmd;
```

**Résultat attendu :**
```
policyname                          | operation | status
------------------------------------|-----------|------------------
Users can delete their own heirs    | DELETE    | ✅ Suppression
Users can insert their own heirs    | INSERT    | ✅ Création
Users can view their own heirs      | SELECT    | ✅ Lecture
Users can update their own heirs    | UPDATE    | ✅ Modification
```

### **2. Tester dans l'application**

1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Héritiers"
3. Cliquer sur "Supprimer" pour un héritier
4. Confirmer la suppression
5. **Regarder les logs dans la console** :

**Logs attendus (succès) :**
```
🗑️ Attempting to delete heir: { id: "xxx", userId: "yyy" }
Delete result: { data: [...], error: null }
✅ Heir deleted successfully
```

**Logs d'erreur (si ça ne fonctionne pas) :**
```
🗑️ Attempting to delete heir: { id: "xxx", userId: "yyy" }
Delete result: { data: null, error: { code: "42501", message: "new row violates row-level security policy" } }
❌ Delete error: { code: "42501", ... }
```

---

## 🐛 Autres problèmes possibles

### **Problème : L'alerte de confirmation ne s'affiche pas**

**Cause :** Problème dans le composant `HeirCard` ou `HeirList`

**Solution :**
Vérifier que `onDelete` est bien passé au composant :
```typescript
<HeirList
  heirs={heirs}
  onDeleteHeir={handleDeleteHeir}  // ← Vérifier que c'est bien là
  // ...
/>
```

### **Problème : L'héritier disparaît puis réapparaît**

**Cause :** La suppression échoue en silence

**Solution :**
1. Vérifier les logs dans la console
2. Appliquer le script SQL ci-dessus
3. Vérifier que `user_id` correspond bien

### **Problème : Erreur "User not authenticated"**

**Cause :** L'utilisateur n'est pas connecté

**Solution :**
1. Se déconnecter et se reconnecter
2. Vérifier que le token est valide
3. Vider le cache du navigateur

---

## 📊 Diagnostic complet

Exécutez ce script pour un diagnostic complet :

```sql
-- 1. Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'heirs'
ORDER BY ordinal_position;

-- 2. Vérifier RLS
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Activé' ELSE '❌ Désactivé' END as rls_status
FROM pg_tables
WHERE tablename = 'heirs';

-- 3. Vérifier les politiques
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'heirs';

-- 4. Vérifier les permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'heirs'
AND grantee = 'authenticated';

-- 5. Compter les héritiers
SELECT 
  user_id,
  COUNT(*) as total_heirs
FROM heirs
GROUP BY user_id;
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. **Copier les logs de la console**
2. **Copier le résultat du diagnostic SQL**
3. **Vérifier la version de Supabase**
4. **Créer un issue sur GitHub**

---

## ✅ Checklist de résolution

- [ ] Vérifier que RLS est activé
- [ ] Vérifier que la politique DELETE existe
- [ ] Exécuter le script SQL de correction
- [ ] Vérifier les logs dans la console
- [ ] Tester la suppression dans l'app
- [ ] Vérifier que l'héritier a bien disparu
- [ ] Rafraîchir la page pour confirmer

---

**Une fois le script SQL exécuté, la suppression devrait fonctionner immédiatement !** ✅
