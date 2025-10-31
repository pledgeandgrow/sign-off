# 🧪 Guide de Test - Système d'Invitation des Héritiers

## ✅ Implémentation Complète

L'UI du système d'invitation est maintenant **100% opérationnelle** ! Voici comment tester.

---

## 📋 Prérequis

### 1. Appliquer la Migration SQL

```bash
# Via Supabase CLI
cd c:\Users\Antimbe\Documents\GitHub\sign-off
supabase db push

# OU via Supabase Dashboard
# 1. Ouvrir https://supabase.com/dashboard
# 2. SQL Editor → New Query
# 3. Copier le contenu de: supabase/migrations/20250131_heirs_invitation_system.sql
# 4. Run
```

### 2. Créer 2 Comptes Utilisateurs

- **Utilisateur A** (Propriétaire) - Celui qui invite
- **Utilisateur B** (Héritier) - Celui qui accepte

---

## 🎯 Flux de Test Complet

### **Étape 1 : Créer une Invitation (Utilisateur A)**

1. **Lancer l'app** et se connecter avec **Utilisateur A**
2. **Naviguer** vers l'onglet **"Héritiers"** (icône personnes)
3. **Cliquer** sur le bouton **"+"** (en haut à droite)
4. **Remplir le formulaire** :
   - **Relation** : Sélectionner "Fils" (optionnel)
   - **Niveau d'accès** : Choisir "Accès Complet"
   - **Notification** : Activer (7 jours par défaut)
5. **Cliquer** sur **"Générer le Code d'Invitation"**
6. **Résultat attendu** :
   - ✅ Modal affiche le code (ex: `SIGN-AB12CD`)
   - ✅ QR Code généré
   - ✅ Options : Copier, Partager
   - ✅ Compte à rebours d'expiration (7 jours)

### **Étape 2 : Vérifier l'Invitation dans la Liste**

1. **Fermer** le modal du code
2. **Vérifier** la liste des héritiers
3. **Résultat attendu** :
   - ✅ Carte affichée avec :
     - Nom : "Invitation en attente" (ou relation si spécifiée)
     - Badge : "En attente" (orange)
     - Code : `SIGN-AB12CD`
     - Niveau d'accès : "Full Access"
   - ✅ Bouton "Annuler" (icône cancel)
   - ✅ Statistiques mises à jour : "0 actif • 1 en attente"

### **Étape 3 : Partager le Code**

**Option A : Copier/Coller**
1. Noter le code affiché dans la carte
2. L'envoyer à Utilisateur B (SMS, email, etc.)

**Option B : QR Code**
1. Prendre une capture d'écran du QR code
2. L'envoyer à Utilisateur B

**Option C : Partage Direct**
1. Cliquer sur "Partager" dans le modal du code
2. Choisir l'app de partage

### **Étape 4 : Accepter l'Invitation (Utilisateur B)**

1. **Se déconnecter** de Utilisateur A
2. **Se connecter** avec **Utilisateur B**
3. **Naviguer** vers `/heir/join` :
   - **Méthode 1** : URL directe dans le navigateur
   - **Méthode 2** : Ajouter un bouton dans l'UI (à venir)
4. **Saisir le code** : `SIGN-AB12CD`
5. **Cliquer** sur **"Accepter l'Invitation"**
6. **Résultat attendu** :
   - ✅ Message de succès
   - ✅ Redirection automatique

### **Étape 5 : Vérifier l'Acceptation (Utilisateur A)**

1. **Se reconnecter** avec **Utilisateur A**
2. **Aller** dans l'onglet **"Héritiers"**
3. **Résultat attendu** :
   - ✅ Carte mise à jour :
     - Nom : Nom complet de Utilisateur B
     - Email : Email de Utilisateur B
     - Badge : "Accepté" (vert)
     - Bouton : "Supprimer" (au lieu de "Annuler")
   - ✅ Statistiques : "1 actif • 0 en attente"

---

## 🧪 Scénarios de Test Avancés

### **Test 1 : Annuler une Invitation**

1. Créer une invitation
2. Cliquer sur le bouton "Annuler" (icône cancel)
3. Confirmer l'annulation
4. **Résultat** : Invitation supprimée de la liste

### **Test 2 : Code Invalide**

1. Aller sur `/heir/join`
2. Saisir un code inexistant : `SIGN-XXXXXX`
3. Cliquer sur "Accepter"
4. **Résultat** : Erreur "Code d'invitation invalide"

### **Test 3 : Code Expiré**

1. Créer une invitation
2. Dans Supabase Dashboard :
   ```sql
   UPDATE heirs
   SET invitation_expires_at = NOW() - INTERVAL '1 day'
   WHERE invitation_code = 'SIGN-AB12CD';
   ```
3. Essayer d'accepter le code
4. **Résultat** : Erreur "Code d'invitation expiré"

### **Test 4 : Auto-Héritage (Bloqué)**

1. Créer une invitation avec Utilisateur A
2. Rester connecté avec Utilisateur A
3. Essayer d'accepter son propre code
4. **Résultat** : Erreur "Vous ne pouvez pas être votre propre héritier"

### **Test 5 : Code Déjà Utilisé**

1. Utilisateur B accepte un code
2. Utilisateur C essaie d'accepter le même code
3. **Résultat** : Erreur "Cette invitation a déjà été acceptée"

### **Test 6 : Limite Free Tier**

1. Créer 2 invitations (limite free = 2)
2. Essayer de créer une 3ème
3. **Résultat** : Modal "Limite atteinte" avec option "Passer au Premium"

---

## 🎨 Composants Implémentés

### **1. CreateInvitationForm**
- ✅ Sélection de relation (chips)
- ✅ Choix du niveau d'accès (radio cards)
- ✅ Toggle notification
- ✅ Sélection du délai de notification
- ✅ Validation et loading states

### **2. InvitationCodeDisplay**
- ✅ Affichage du code formaté
- ✅ Génération du QR code
- ✅ Bouton copier (avec feedback)
- ✅ Bouton partager
- ✅ Compte à rebours d'expiration
- ✅ Instructions claires

### **3. HeirCard (Mis à jour)**
- ✅ Badge de statut (Accepté/En attente/Expiré/Refusé)
- ✅ Affichage du code pour invitations en attente
- ✅ Affichage des infos utilisateur pour invitations acceptées
- ✅ Bouton "Annuler" pour invitations en attente
- ✅ Bouton "Supprimer" pour héritiers acceptés

### **4. HeirList (Mis à jour)**
- ✅ Support des invitations en attente
- ✅ Statistiques mises à jour
- ✅ Gestion des actions contextuelles

### **5. Écran Heirs (Réécrit)**
- ✅ Modal pour création d'invitation
- ✅ Modal pour affichage du code
- ✅ Gestion des états (loading, erreurs)
- ✅ Vérification des limites d'abonnement
- ✅ Statistiques en temps réel

---

## 📱 Navigation

### **Pages Disponibles**

| Route | Description | Utilisateur |
|-------|-------------|-------------|
| `/(tabs)/heirs` | Liste des héritiers + Créer invitation | Propriétaire |
| `/heir/join` | Accepter une invitation | Héritier |

### **À Ajouter (Optionnel)**

```typescript
// Dans app/(tabs)/_layout.tsx ou un menu
<Link href="/heir/join">
  <MaterialCommunityIcons name="qrcode-scan" size={24} />
  <Text>Rejoindre comme héritier</Text>
</Link>
```

---

## 🔍 Vérification dans Supabase

### **Voir toutes les invitations**

```sql
SELECT 
  h.id,
  h.invitation_code,
  h.invitation_status,
  h.invitation_expires_at,
  h.relationship,
  h.access_level,
  owner.email as owner_email,
  heir.email as heir_email,
  heir.full_name as heir_name
FROM heirs h
LEFT JOIN users owner ON h.user_id = owner.id
LEFT JOIN users heir ON h.heir_user_id = heir.id
ORDER BY h.created_at DESC;
```

### **Nettoyer les invitations expirées**

```sql
SELECT cleanup_expired_invitations();
-- Retourne le nombre d'invitations nettoyées
```

### **Voir les statistiques**

```sql
SELECT 
  invitation_status,
  COUNT(*) as count
FROM heirs
GROUP BY invitation_status;
```

---

## 🐛 Dépannage

### **Problème : "Cannot find module 'react-native-reanimated'"**
✅ **Résolu** : Package supprimé du projet

### **Problème : Code non généré**
- Vérifier que la migration SQL est appliquée
- Vérifier les logs de la fonction `generate_invitation_code()`

### **Problème : QR Code ne s'affiche pas**
- Vérifier que `react-native-qrcode-svg` est installé
- Vérifier que `react-native-svg` est installé

### **Problème : Modal ne s'ouvre pas**
- Vérifier les logs de la console
- Vérifier que `showInvitationForm` et `showInvitationCode` sont bien gérés

---

## ✅ Checklist de Test

- [ ] Migration SQL appliquée
- [ ] 2 utilisateurs créés (A et B)
- [ ] Invitation créée (code généré)
- [ ] QR Code affiché
- [ ] Code copié avec succès
- [ ] Invitation visible dans la liste (statut "En attente")
- [ ] Code partagé à Utilisateur B
- [ ] Invitation acceptée par Utilisateur B
- [ ] Héritier visible avec statut "Accepté"
- [ ] Infos utilisateur B affichées (nom, email)
- [ ] Statistiques mises à jour
- [ ] Test code invalide (erreur)
- [ ] Test code expiré (erreur)
- [ ] Test annulation d'invitation
- [ ] Test suppression d'héritier accepté
- [ ] Test limite free tier

---

## 🚀 Prochaines Étapes (Optionnel)

1. **Scanner QR Code** : Intégrer `expo-camera` pour scanner le QR code
2. **Notifications Push** : Notifier l'héritier quand il reçoit une invitation
3. **Deep Linking** : Lien direct vers `/heir/join?code=SIGN-AB12CD`
4. **Historique** : Voir les invitations refusées/expirées
5. **Réinviter** : Régénérer un code pour une invitation expirée

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier les logs de la console
2. Vérifier les erreurs dans Supabase Dashboard → Logs
3. Vérifier que la migration SQL est bien appliquée
4. Vérifier les RLS policies dans Supabase

---

**🎉 Le système d'invitation est maintenant 100% fonctionnel et prêt à être testé !**
