# 📱 Sign-off - Contexte du Projet

## 🎯 Vue d'ensemble

**Sign-off** est une application mobile de **gestion d'héritage numérique** qui permet aux utilisateurs de préparer et transmettre leurs données importantes (documents, mots de passe, instructions) à leurs héritiers de manière sécurisée.

---

## 🌟 Objectif Principal

Permettre aux utilisateurs de :
1. **Stocker** des informations sensibles de manière sécurisée
2. **Organiser** leurs données dans des coffres (vaults)
3. **Désigner** des héritiers qui recevront ces informations
4. **Automatiser** la transmission en cas de décès ou d'incapacité

---

## 👥 Public Cible

- **Utilisateurs principaux** : Personnes souhaitant préparer leur succession numérique
- **Héritiers** : Bénéficiaires désignés qui recevront les informations
- **Âge** : 30-70 ans
- **Profil** : Personnes soucieuses de l'organisation et de la sécurité

---

## 🏗️ Architecture Technique

### **Stack Technologique**

#### **Frontend**
- **Framework** : React Native (Expo)
- **Langage** : TypeScript
- **Navigation** : Expo Router (file-based routing)
- **UI** : React Native components + custom design system
- **État** : React Context API
- **Icônes** : MaterialCommunityIcons

#### **Backend**
- **BaaS** : Supabase
- **Base de données** : PostgreSQL
- **Authentification** : Supabase Auth
- **Storage** : Supabase Storage (fichiers)
- **Edge Functions** : Deno (webhooks, vérifications)

#### **Sécurité**
- **Chiffrement** : Crypto-JS (AES-256)
- **RLS** : Row Level Security (Supabase)
- **Authentification** : JWT tokens

#### **Paiements**
- **En cours de migration** : Square → In-App Purchases (Google Play + App Store)

---

## 📂 Structure du Projet

```
sign-off/
├── app/                          # Pages de l'application (Expo Router)
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── index.tsx             # 🏠 Accueil (dashboard)
│   │   ├── vaults.tsx            # 🗄️ Coffres
│   │   ├── heirs.tsx             # 👥 Héritiers
│   │   ├── inheritance.tsx       # 📋 Plans de succession
│   │   └── profile.tsx           # 👤 Profil
│   ├── auth/                     # Authentification
│   │   ├── login.tsx             # Connexion
│   │   └── register.tsx          # Inscription
│   ├── onboarding.tsx            # Premier lancement
│   └── upgrade.tsx               # Page premium (IAP)
│
├── components/                   # Composants réutilisables
│   ├── vault/                    # Composants des coffres
│   │   ├── VaultCard.tsx         # Carte d'un coffre
│   │   ├── VaultList.tsx         # Liste des coffres
│   │   ├── AddVault.tsx          # Formulaire d'ajout
│   │   └── AddItem.tsx           # Ajout d'élément
│   ├── heirs/                    # Composants des héritiers
│   │   ├── HeirCard.tsx          # Carte d'un héritier
│   │   ├── HeirList.tsx          # Liste des héritiers
│   │   └── HeirForm.tsx          # Formulaire héritier
│   └── inheritance/              # Composants de succession
│       ├── PlanCard.tsx          # Carte d'un plan
│       └── PlanForm.tsx          # Formulaire de plan
│
├── contexts/                     # Gestion d'état globale
│   ├── AuthContext.tsx           # Authentification
│   ├── VaultContext.tsx          # Coffres
│   ├── HeirContext.tsx           # Héritiers
│   └── InheritanceContext.tsx    # Plans de succession
│
├── lib/                          # Logique métier
│   ├── supabase.ts               # Client Supabase
│   ├── constants.ts              # Constantes globales
│   └── services/                 # Services métier
│       ├── vaultService.ts       # Gestion des coffres
│       ├── heirService.ts        # Gestion des héritiers
│       ├── inheritanceService.ts # Gestion des plans
│       ├── subscriptionService.ts# Abonnements
│       ├── fileUploadService.ts  # Upload de fichiers
│       ├── inAppPurchaseService.ts # Achats in-app
│       └── cleanupOrphanedFiles.ts # Nettoyage fichiers
│
├── supabase/                     # Configuration Supabase
│   ├── migrations/               # Migrations SQL
│   └── functions/                # Edge Functions
│       ├── square-webhook/       # Webhook Square (legacy)
│       └── verify-iap-receipt/   # Vérification IAP
│
├── types/                        # Types TypeScript
│   ├── vault.ts                  # Types des coffres
│   ├── heir.ts                   # Types des héritiers
│   ├── inheritance.ts            # Types de succession
│   └── database.types.ts         # Types Supabase
│
└── docs/                         # Documentation
    ├── IAP_MIGRATION_GUIDE.md    # Guide migration IAP
    ├── SCALABILITY.md            # Scalabilité
    └── TROUBLESHOOTING_HEIRS.md  # Dépannage héritiers
```

---

## 🔑 Concepts Clés

### **1. Coffres (Vaults)**
- **Définition** : Conteneurs sécurisés pour stocker des informations
- **Types d'éléments** :
  - 📄 Documents (PDF, images, etc.)
  - 🔑 Mots de passe
  - 💳 Informations bancaires
  - 📝 Notes importantes
  - 🏥 Informations médicales
- **Fonctionnalités** :
  - Chiffrement optionnel
  - Organisation par catégories
  - Partage avec héritiers
  - Upload de fichiers

### **2. Héritiers (Heirs)**
- **Définition** : Personnes désignées pour recevoir les informations
- **Informations** :
  - Nom complet (chiffré)
  - Email (chiffré)
  - Téléphone (chiffré)
  - Relation (chiffré)
  - Niveau d'accès
- **Niveaux d'accès** :
  - `full` : Accès complet à tout
  - `partial` : Accès à certains coffres
  - `view_only` : Lecture seule
- **États** :
  - `is_active` : Héritier actif
  - `has_accepted` : A accepté l'invitation

### **3. Plans de Succession (Inheritance Plans)**
- **Définition** : Règles de transmission des données
- **Types** :
  - `immediate` : Transmission immédiate
  - `delayed` : Transmission différée (X jours)
  - `conditional` : Selon conditions
- **Méthodes d'activation** :
  - `manual` : Activation manuelle
  - `inactivity` : Après X jours d'inactivité
  - `death_certificate` : Sur présentation certificat
  - `trusted_contact` : Via contact de confiance
- **Triggers** : Événements déclencheurs
  - Inactivité prolongée
  - Décès confirmé
  - Demande manuelle

### **4. Abonnements**
- **Tiers gratuit (Free)** :
  - 1 coffre
  - 1 héritier
  - 100 MB de stockage
  - Fonctionnalités de base
- **Tiers premium (Premium)** :
  - Coffres illimités
  - Héritiers illimités
  - 10 GB de stockage
  - Chiffrement avancé
  - Plans de succession automatiques
  - Support prioritaire

---

## 🔐 Sécurité

### **Chiffrement**
- **Algorithme** : AES-256-CBC
- **Données chiffrées** :
  - Informations des héritiers
  - Contenu des coffres (optionnel)
  - Documents sensibles
- **Clés** :
  - Clé utilisateur (stockée localement)
  - Clé publique héritier (pour partage)

### **Row Level Security (RLS)**
- **Principe** : Chaque utilisateur ne peut accéder qu'à ses propres données
- **Politiques** :
  - `SELECT` : Lecture de ses données
  - `INSERT` : Création de nouvelles données
  - `UPDATE` : Modification de ses données
  - `DELETE` : Suppression de ses données

### **Authentification**
- **Méthode** : Email + mot de passe
- **Tokens** : JWT (JSON Web Tokens)
- **Session** : Persistante avec refresh token

---

## 📊 Modèle de Données

### **Tables Principales**

#### **users**
```sql
- id (uuid, PK)
- email (text)
- subscription_tier (enum: 'free' | 'premium')
- subscription_status (enum: 'active' | 'inactive' | 'cancelled')
- subscription_expires_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **vaults**
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- name (text)
- description (text)
- icon (text)
- color (text)
- is_encrypted (boolean)
- encryption_key_hint (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **vault_items**
```sql
- id (uuid, PK)
- vault_id (uuid, FK → vaults)
- type (enum: 'password' | 'document' | 'note' | 'bank' | 'medical')
- title (text)
- metadata (jsonb)
- is_encrypted (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **heirs**
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- inheritance_plan_id (uuid, FK → inheritance_plans)
- full_name_encrypted (text)
- email_encrypted (text)
- phone_encrypted (text)
- relationship_encrypted (text)
- access_level (enum: 'full' | 'partial' | 'view_only')
- heir_user_id (uuid, FK → users)
- heir_public_key (text)
- is_active (boolean)
- has_accepted (boolean)
- accepted_at (timestamp)
- notify_on_activation (boolean)
- notification_delay_days (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **inheritance_plans**
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- name (text)
- description (text)
- plan_type (enum: 'immediate' | 'delayed' | 'conditional')
- activation_method (enum: 'manual' | 'inactivity' | 'death_certificate' | 'trusted_contact')
- inactivity_days (integer)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **subscriptions**
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- plan_name (text)
- amount (numeric)
- currency (text)
- status (enum: 'active' | 'cancelled' | 'past_due')
- current_period_start (timestamp)
- current_period_end (timestamp)
- cancelled_at (timestamp)
- store_transaction_id (text) -- Pour IAP
- store_product_id (text)     -- Pour IAP
- store_platform (enum: 'ios' | 'android' | 'web')
- receipt_data (text)          -- Pour IAP
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 🎨 Design System

### **Couleurs**
```typescript
Colors = {
  dark: {
    background: '#0A0A0A',
    surface: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    purple: {
      primary: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
    },
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
  light: {
    // ... (similaire mais inversé)
  }
}
```

### **Typographie**
- **Titres** : 24-32px, bold
- **Sous-titres** : 18-20px, semibold
- **Corps** : 14-16px, regular
- **Captions** : 12px, regular

### **Espacement**
- **Padding** : 16-24px
- **Margin** : 8-16px
- **Gap** : 8-12px

---

## 🔄 Flux Utilisateur

### **1. Onboarding**
```
Installation → Inscription → Onboarding → Dashboard
```

### **2. Création d'un coffre**
```
Dashboard → Coffres → Ajouter → Formulaire → Coffre créé
```

### **3. Ajout d'un héritier**
```
Dashboard → Héritiers → Ajouter → Formulaire → Héritier créé → Email envoyé
```

### **4. Création d'un plan de succession**
```
Succession → Nouveau plan → Configuration → Sélection héritiers → Plan actif
```

### **5. Passage à Premium**
```
Dashboard → Passer à Premium → Sélection plan → Paiement IAP → Premium activé
```

---

## 🚀 Fonctionnalités Principales

### **✅ Implémentées**
- [x] Authentification (email/password)
- [x] Gestion des coffres (CRUD)
- [x] Gestion des éléments de coffre
- [x] Upload de fichiers
- [x] Gestion des héritiers (CRUD)
- [x] Plans de succession (CRUD)
- [x] Système d'abonnement (Free/Premium)
- [x] Page upgrade avec IAP
- [x] Nettoyage automatique des fichiers orphelins
- [x] Dashboard avec statistiques
- [x] Profil utilisateur

### **🚧 En cours**
- [ ] Migration Square → IAP (code prêt, config stores manquante)
- [ ] Chiffrement bout-en-bout
- [ ] Notifications push
- [ ] Activation automatique des plans

### **📋 À venir**
- [ ] Partage de coffres entre utilisateurs
- [ ] Authentification biométrique
- [ ] Export de données
- [ ] Mode hors ligne
- [ ] Application web (PWA)

---

## 🐛 Problèmes Connus

### **1. Suppression des héritiers**
- **Statut** : ✅ Résolu
- **Cause** : Politique RLS manquante
- **Solution** : Script SQL fourni dans `FIX_HEIRS_DELETION.md`

### **2. Installation IAP**
- **Statut** : ⚠️ En attente
- **Cause** : Conflit de dépendances + PowerShell
- **Solution** : Mock temporaire, guide dans `INSTALLATION_IAP.md`

### **3. Erreur 406 sur subscriptions**
- **Statut** : ⚠️ En attente
- **Cause** : Table pas encore créée
- **Solution** : Migration SQL fournie

---

## 📈 Métriques Importantes

### **Performance**
- Temps de chargement : < 2s
- Taille de l'app : ~50 MB
- Upload fichiers : Max 100 MB (free), 10 GB (premium)

### **Limites**
- **Free** :
  - 1 coffre
  - 1 héritier
  - 100 MB stockage
- **Premium** :
  - Illimité coffres
  - Illimité héritiers
  - 10 GB stockage

---

## 🔧 Commandes Utiles

```bash
# Développement
npm start                    # Lancer Expo
npm run android             # Lancer sur Android
npm run ios                 # Lancer sur iOS
npm run web                 # Lancer sur Web

# Supabase
supabase start              # Démarrer local
supabase db push            # Appliquer migrations
supabase functions deploy   # Déployer functions

# Build
eas build --platform android
eas build --platform ios
```

---

## 📞 Support & Documentation

- **Guide IAP** : `docs/IAP_MIGRATION_GUIDE.md`
- **Dépannage héritiers** : `docs/TROUBLESHOOTING_HEIRS.md`
- **Scalabilité** : `docs/SCALABILITY.md`
- **Fix rapide** : `FIX_HEIRS_DELETION.md`

---

## 🎯 Vision & Roadmap

### **Court terme (1-3 mois)**
- Finaliser migration IAP
- Implémenter chiffrement E2E
- Ajouter notifications push
- Améliorer onboarding

### **Moyen terme (3-6 mois)**
- Application web (PWA)
- Partage de coffres
- Export de données
- Mode hors ligne

### **Long terme (6-12 mois)**
- Authentification biométrique
- Intégration services tiers (Google Drive, Dropbox)
- Marketplace de templates
- API publique

---

**Sign-off** vise à devenir la solution de référence pour la gestion d'héritage numérique, en combinant sécurité, simplicité et automatisation.
