# 🎫 Système d'Invitation des Héritiers

## 📋 Vue d'ensemble

Le système d'invitation permet de désigner uniquement des **utilisateurs inscrits** comme héritiers via un **code d'invitation** ou un **QR code**.

---

## 🎯 Objectifs

1. ✅ Seuls les utilisateurs inscrits peuvent être héritiers
2. ✅ Invitation par code unique (format: `SIGN-XXXXXX`)
3. ✅ Invitation par QR code
4. ✅ Validation sécurisée côté serveur
5. ✅ Expiration automatique après 7 jours
6. ✅ Acceptation/Rejet par l'héritier

---

## 🔄 Flux Complet

### **1. Propriétaire crée une invitation**

```
Héritiers → Inviter → Générer code
                ↓
        Code: SIGN-AB12CD
        QR Code généré
                ↓
        Partager (SMS, Email, etc.)
```

### **2. Héritier accepte l'invitation**

```
Rejoindre comme héritier → Scanner QR / Saisir code
                ↓
        Validation du code
                ↓
        Confirmation
                ↓
        Héritier lié au propriétaire
```

---

## 📊 Modèle de Données

### **Table `heirs` (modifiée)**

```sql
CREATE TABLE heirs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),  -- Propriétaire
  heir_user_id UUID REFERENCES users(id),      -- Héritier (NULL jusqu'à acceptation)
  
  -- Invitation
  invitation_code TEXT UNIQUE,                 -- Code unique (SIGN-XXXXXX)
  invitation_status TEXT DEFAULT 'pending',    -- pending, accepted, rejected, expired
  invitation_expires_at TIMESTAMP,             -- Expiration (7 jours)
  invited_at TIMESTAMP DEFAULT NOW(),
  rejected_at TIMESTAMP,
  
  -- Données
  relationship TEXT,                           -- Relation (non chiffrée)
  access_level TEXT NOT NULL,                  -- full, partial, view_only
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT FALSE,
  has_accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP,
  notify_on_activation BOOLEAN DEFAULT TRUE,
  notification_delay_days INTEGER DEFAULT 0,
  heir_public_key TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Vue `heirs_with_user_info`**

```sql
CREATE VIEW heirs_with_user_info AS
SELECT 
  h.*,
  u.email as heir_email,
  u.full_name as heir_full_name,
  u.avatar_url as heir_avatar_url,
  owner.email as owner_email,
  owner.full_name as owner_full_name
FROM heirs h
LEFT JOIN users u ON h.heir_user_id = u.id
LEFT JOIN users owner ON h.user_id = owner.id;
```

---

## 🔧 Fonctions SQL

### **Générer un code unique**

```sql
CREATE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'SIGN-' || upper(substring(md5(random()::text) from 1 for 6));
    SELECT EXISTS(SELECT 1 FROM heirs WHERE invitation_code = code) INTO exists;
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### **Nettoyer les invitations expirées**

```sql
CREATE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE heirs
  SET invitation_status = 'expired'
  WHERE invitation_status = 'pending'
    AND invitation_expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 💻 API TypeScript

### **Service d'invitation**

```typescript
// Créer une invitation
const { heir, invitationCode } = await createHeirInvitation(userId, {
  relationship: 'Fils',
  access_level: 'full',
  notify_on_activation: true,
});

// Valider un code
const validation = await validateInvitationCode('SIGN-AB12CD');
if (validation.valid) {
  // Code valide
}

// Accepter une invitation
const heir = await acceptHeirInvitation(userId, 'SIGN-AB12CD');

// Rejeter une invitation
await rejectHeirInvitation(userId, 'SIGN-AB12CD');

// Annuler une invitation (propriétaire)
await cancelHeirInvitation(userId, heirId);
```

### **Context React**

```typescript
const { 
  heirs,                    // Liste des héritiers
  pendingInvitations,       // Invitations en attente
  createInvitation,         // Créer une invitation
  acceptInvitation,         // Accepter
  rejectInvitation,         // Rejeter
  cancelInvitation,         // Annuler
  deleteHeir,               // Supprimer
} = useHeirs();
```

---

## 🎨 Composants UI

### **1. InvitationCodeDisplay**

Affiche le code et le QR code après création.

```tsx
<InvitationCodeDisplay
  invitationCode="SIGN-AB12CD"
  expiresAt="2025-02-07T12:00:00Z"
  onClose={() => {}}
/>
```

**Fonctionnalités :**
- ✅ Affichage du QR code
- ✅ Copie du code
- ✅ Partage via Share API
- ✅ Instructions d'utilisation
- ✅ Compte à rebours d'expiration

### **2. JoinAsHeirForm**

Formulaire pour saisir/scanner un code.

```tsx
<JoinAsHeirForm
  onSubmit={async (code) => {
    await acceptInvitation(code);
  }}
  onCancel={() => {}}
  onScanQR={() => {
    // Scanner QR
  }}
/>
```

**Fonctionnalités :**
- ✅ Saisie manuelle du code
- ✅ Formatage automatique (SIGN-XXXXXX)
- ✅ Bouton scan QR
- ✅ Validation du format
- ✅ Instructions

---

## 🔐 Sécurité

### **Row Level Security (RLS)**

```sql
-- SELECT: Voir ses héritiers ET les invitations où on est héritier
CREATE POLICY "Users can view their heirs and invitations"
ON heirs FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = heir_user_id);

-- INSERT: Créer des invitations
CREATE POLICY "Users can create heir invitations"
ON heirs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Propriétaire modifie, héritier accepte/rejette
CREATE POLICY "Users can update their heirs and accept invitations"
ON heirs FOR UPDATE
USING (
  auth.uid() = user_id OR 
  (auth.uid() = heir_user_id AND invitation_status = 'pending')
);

-- DELETE: Seul le propriétaire
CREATE POLICY "Users can delete their own heirs"
ON heirs FOR DELETE
USING (auth.uid() = user_id);
```

### **Validations**

1. ✅ Code unique et aléatoire
2. ✅ Format validé (SIGN-XXXXXX)
3. ✅ Expiration après 7 jours
4. ✅ Vérification du statut
5. ✅ Empêche d'être son propre héritier
6. ✅ Un code = une invitation

---

## 📱 Utilisation

### **Côté Propriétaire**

```typescript
// 1. Créer une invitation
const { heir, invitationCode } = await createInvitation({
  relationship: 'Fils',
  access_level: 'full',
  notify_on_activation: true,
  notification_delay_days: 7,
});

// 2. Afficher le code et QR
<InvitationCodeDisplay
  invitationCode={invitationCode}
  expiresAt={heir.invitation_expires_at}
  onClose={() => setShowCode(false)}
/>

// 3. Partager le code
// Via SMS, Email, WhatsApp, etc.
```

### **Côté Héritier**

```typescript
// 1. Ouvrir la page d'invitation
router.push('/heir/join');

// 2. Saisir ou scanner le code
<JoinAsHeirForm
  onSubmit={async (code) => {
    const heir = await acceptInvitation(code);
    Alert.alert('Succès', 'Vous êtes maintenant héritier');
  }}
/>

// 3. Voir ses invitations en attente
const { pendingInvitations } = useHeirs();
```

---

## 🧪 Tests

### **Test 1 : Créer une invitation**

```typescript
test('should create heir invitation with code', async () => {
  const { heir, invitationCode } = await createHeirInvitation(userId, {
    relationship: 'Fils',
    access_level: 'full',
  });

  expect(invitationCode).toMatch(/^SIGN-[A-Z0-9]{6}$/);
  expect(heir.invitation_status).toBe('pending');
  expect(heir.heir_user_id).toBeNull();
});
```

### **Test 2 : Valider un code**

```typescript
test('should validate invitation code', async () => {
  const validation = await validateInvitationCode('SIGN-AB12CD');
  
  expect(validation.valid).toBe(true);
  expect(validation.heir).toBeDefined();
});
```

### **Test 3 : Accepter une invitation**

```typescript
test('should accept invitation', async () => {
  const heir = await acceptHeirInvitation(heirUserId, 'SIGN-AB12CD');
  
  expect(heir.has_accepted).toBe(true);
  expect(heir.heir_user_id).toBe(heirUserId);
  expect(heir.invitation_status).toBe('accepted');
  expect(heir.is_active).toBe(true);
});
```

### **Test 4 : Code expiré**

```typescript
test('should reject expired code', async () => {
  // Code créé il y a 8 jours
  const validation = await validateInvitationCode('SIGN-EXPIRED');
  
  expect(validation.valid).toBe(false);
  expect(validation.error).toContain('expiré');
});
```

---

## 🔄 Migration depuis l'ancien système

### **Étape 1 : Appliquer la migration SQL**

```bash
supabase db push
```

Ou manuellement :
```sql
-- Exécuter le fichier
-- supabase/migrations/20250131_heirs_invitation_system.sql
```

### **Étape 2 : Mettre à jour le code**

```bash
# Installer les dépendances
npm install react-native-qrcode-svg react-native-svg --legacy-peer-deps
```

### **Étape 3 : Tester**

1. Créer une invitation
2. Vérifier le code généré
3. Scanner/saisir le code
4. Accepter l'invitation
5. Vérifier que l'héritier apparaît

---

## 📊 Statistiques

```sql
-- Invitations par statut
SELECT 
  invitation_status,
  COUNT(*) as count
FROM heirs
GROUP BY invitation_status;

-- Invitations expirées
SELECT COUNT(*) 
FROM heirs 
WHERE invitation_status = 'pending' 
  AND invitation_expires_at < NOW();

-- Taux d'acceptation
SELECT 
  COUNT(CASE WHEN invitation_status = 'accepted' THEN 1 END) * 100.0 / COUNT(*) as acceptance_rate
FROM heirs
WHERE invitation_status IN ('accepted', 'rejected');
```

---

## 🐛 Dépannage

### **Problème : Code invalide**

**Cause** : Code expiré ou déjà utilisé

**Solution** :
```typescript
const validation = await validateInvitationCode(code);
console.log(validation.error); // Voir le message d'erreur
```

### **Problème : Impossible d'accepter**

**Cause** : Utilisateur non connecté ou code invalide

**Solution** :
1. Vérifier que l'utilisateur est connecté
2. Vérifier le format du code
3. Vérifier l'expiration

### **Problème : QR code ne se génère pas**

**Cause** : Package `react-native-qrcode-svg` manquant

**Solution** :
```bash
npm install react-native-qrcode-svg react-native-svg --legacy-peer-deps
```

---

## 📚 Ressources

- **Migration SQL** : `supabase/migrations/20250131_heirs_invitation_system.sql`
- **Service** : `lib/services/heirInvitationService.ts`
- **Context** : `contexts/HeirContext.tsx`
- **Composants** : `components/heirs/InvitationCodeDisplay.tsx`, `JoinAsHeirForm.tsx`
- **Page** : `app/heir/join.tsx`

---

## ✅ Checklist d'implémentation

- [x] Migration SQL créée
- [x] Types TypeScript mis à jour
- [x] Service d'invitation créé
- [x] Context mis à jour
- [x] Composant d'affichage du code créé
- [x] Composant de saisie créé
- [x] Page `/heir/join` créée
- [ ] Installer `react-native-qrcode-svg`
- [ ] Appliquer la migration SQL
- [ ] Tester le flux complet
- [ ] Implémenter le scanner QR (optionnel)
- [ ] Ajouter les notifications
- [ ] Créer un CRON pour nettoyer les codes expirés

---

**Le système d'invitation est prêt ! Suivez la checklist pour finaliser l'implémentation.** 🎉
