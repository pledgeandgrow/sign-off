# 🚨 FIX URGENT : Suppression des Héritiers

## ❌ Problème
**Quand vous cliquez sur "Supprimer" un héritier, rien ne se passe.**

---

## ✅ Solution Rapide (2 minutes)

### **Étape 1 : Ouvrir Supabase**
1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet **sign-off**
3. Cliquer sur **SQL Editor** dans le menu de gauche

### **Étape 2 : Copier ce code**
```sql
-- Créer la politique de suppression manquante
DROP POLICY IF EXISTS "Users can delete their own heirs" ON heirs;

CREATE POLICY "Users can delete their own heirs"
ON heirs FOR DELETE
USING (auth.uid() = user_id);
```

### **Étape 3 : Exécuter**
1. Coller le code dans l'éditeur
2. Cliquer sur **Run** (ou Ctrl+Enter)
3. Attendre le message "Success"

### **Étape 4 : Tester**
1. Retourner dans votre app
2. Rafraîchir la page (F5)
3. Essayer de supprimer un héritier
4. **Ça devrait fonctionner !** ✅

---

## 🔍 Vérification

Ouvrez la console du navigateur (F12) et regardez les logs :

**✅ Si ça fonctionne :**
```
🗑️ Attempting to delete heir: { id: "...", userId: "..." }
Delete result: { data: [...], error: null }
✅ Heir deleted successfully
```

**❌ Si ça ne fonctionne pas :**
```
❌ Delete error: { code: "42501", message: "..." }
```

→ Voir le guide complet : `docs/TROUBLESHOOTING_HEIRS.md`

---

## 📝 Explication

Le problème vient de **Row Level Security (RLS)** de Supabase.

**RLS** = Système de sécurité qui contrôle qui peut faire quoi dans la base de données.

**Ce qui manquait :** La politique qui autorise les utilisateurs à **supprimer** leurs propres héritiers.

**Ce que fait le script :** Ajoute cette politique manquante.

---

## 🆘 Si ça ne marche toujours pas

### **Script complet (dernière chance)**

```sql
-- Réinitialiser complètement les politiques
ALTER TABLE heirs DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can insert their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can update their own heirs" ON heirs;
DROP POLICY IF EXISTS "Users can delete their own heirs" ON heirs;

ALTER TABLE heirs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own heirs"
ON heirs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own heirs"
ON heirs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own heirs"
ON heirs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own heirs"
ON heirs FOR DELETE
USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON heirs TO authenticated;
```

---

## ✅ Checklist

- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans SQL Editor
- [ ] Copier-coller le script
- [ ] Exécuter (Run)
- [ ] Rafraîchir l'app
- [ ] Tester la suppression
- [ ] Vérifier les logs

---

**Temps estimé : 2 minutes** ⏱️

**Difficulté : Facile** 🟢

**Impact : Critique** 🔴
