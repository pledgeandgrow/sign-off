# 📱 Sign-off

> **Gérez votre héritage numérique en toute sécurité**

Application mobile de gestion d'héritage numérique permettant de stocker, organiser et transmettre vos données importantes à vos héritiers de manière sécurisée et automatisée.

---

## 🌟 Fonctionnalités

### ✅ Disponibles
- 🗄️ **Coffres sécurisés** : Stockez documents, mots de passe, notes
- 👥 **Gestion des héritiers** : Désignez vos bénéficiaires
- 📋 **Plans de succession** : Automatisez la transmission
- 🔐 **Chiffrement** : Protection AES-256
- 📤 **Upload de fichiers** : Documents, images, PDF
- 💎 **Abonnement Premium** : Fonctionnalités avancées
- 📊 **Dashboard** : Vue d'ensemble de vos données

### 🚧 En cours
- 🔔 Notifications push
- 🔄 Synchronisation multi-device
- 🌐 Application web (PWA)

---

## 🚀 Démarrage Rapide

### Prérequis
```bash
node >= 18
npm >= 9
expo-cli
```

### Installation
```bash
# Cloner le repo
git clone https://github.com/votre-username/sign-off.git
cd sign-off

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase

# Lancer l'application
npm start
```

### Configuration Supabase
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

---

## 📂 Structure du Projet

```
sign-off/
├── app/                    # Pages (Expo Router)
│   ├── (tabs)/            # Navigation principale
│   ├── auth/              # Authentification
│   └── upgrade.tsx        # Page premium
├── components/            # Composants réutilisables
│   ├── vault/            # Composants coffres
│   ├── heirs/            # Composants héritiers
│   └── inheritance/      # Composants succession
├── contexts/             # Gestion d'état (Context API)
├── lib/                  # Logique métier
│   ├── services/        # Services
│   └── supabase.ts      # Client Supabase
├── types/               # Types TypeScript
├── supabase/           # Config & migrations
└── docs/               # Documentation
```

---

## 🛠️ Technologies

### Frontend
- **React Native** (Expo)
- **TypeScript**
- **Expo Router** (navigation)
- **React Context** (état)

### Backend
- **Supabase** (BaaS)
- **PostgreSQL** (base de données)
- **Supabase Auth** (authentification)
- **Supabase Storage** (fichiers)
- **Edge Functions** (Deno)

### Sécurité
- **RLS** (Row Level Security)
- **Crypto-JS** (chiffrement AES-256)
- **JWT** (tokens)

---

## 📖 Documentation

### Guides Principaux
- 📘 [**Contexte du Projet**](PROJECT_CONTEXT.md) - Vue d'ensemble complète
- 🔧 [**Règles de Développement**](.cursorrules) - Standards de code
- 🛒 [**Migration IAP**](docs/IAP_MIGRATION_GUIDE.md) - Achats in-app
- 🐛 [**Dépannage Héritiers**](docs/TROUBLESHOOTING_HEIRS.md) - Résolution problèmes
- 📈 [**Scalabilité**](docs/SCALABILITY.md) - Architecture évolutive

### Guides Rapides
- ⚡ [**Fix Suppression Héritiers**](FIX_HEIRS_DELETION.md) - Solution 2 min
- 📦 [**Installation IAP**](INSTALLATION_IAP.md) - Achats in-app

---

## 🔐 Sécurité

### Chiffrement
- **Algorithme** : AES-256-CBC
- **Données chiffrées** : Héritiers, mots de passe, documents sensibles
- **Clés** : Stockées localement, jamais sur le serveur

### Row Level Security (RLS)
- Chaque utilisateur accède uniquement à ses propres données
- Politiques strictes sur toutes les tables
- Vérification automatique de `user_id`

### Authentification
- Email + mot de passe
- Tokens JWT avec refresh
- Session persistante sécurisée

---

## 💎 Abonnements

### Free (Gratuit)
- ✅ 1 coffre
- ✅ 1 héritier
- ✅ 100 MB de stockage
- ✅ Fonctionnalités de base

### Premium (10€/mois ou 100€/an)
- ✅ Coffres illimités
- ✅ Héritiers illimités
- ✅ 10 GB de stockage
- ✅ Chiffrement avancé
- ✅ Plans de succession automatiques
- ✅ Support prioritaire

---

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests E2E
npm run test:e2e

# Linter
npm run lint

# Type checking
npm run type-check
```

---

## 📦 Build & Déploiement

### Development
```bash
npm start              # Expo dev server
npm run android       # Android
npm run ios          # iOS
npm run web          # Web
```

### Production
```bash
# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 🐛 Problèmes Connus

### 1. Suppression des héritiers
**Statut** : ✅ Résolu  
**Solution** : Voir [FIX_HEIRS_DELETION.md](FIX_HEIRS_DELETION.md)

### 2. Installation expo-in-app-purchases
**Statut** : ⚠️ En cours  
**Solution** : Voir [INSTALLATION_IAP.md](INSTALLATION_IAP.md)

### 3. Erreur 406 sur subscriptions
**Statut** : ⚠️ En cours  
**Solution** : Appliquer migration SQL

---

## 🤝 Contribution

### Workflow
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards
- Code en TypeScript strict
- Tests pour les nouvelles fonctionnalités
- Documentation à jour
- Respect des conventions (voir `.cursorrules`)

---

## 📝 Changelog

### [1.0.0] - 2025-01-31
#### Ajouté
- ✨ Système de coffres sécurisés
- ✨ Gestion des héritiers
- ✨ Plans de succession
- ✨ Upload de fichiers
- ✨ Abonnement Premium avec IAP
- ✨ Dashboard avec statistiques
- ✨ Nettoyage automatique des fichiers

#### Corrigé
- 🐛 Suppression des héritiers (RLS)
- 🐛 Navigation dans la page upgrade
- 🐛 Gestion des fichiers orphelins

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Votre Nom**
- GitHub: [@votre-username](https://github.com/votre-username)
- Email: votre.email@example.com

---

## 🙏 Remerciements

- [Expo](https://expo.dev/) - Framework React Native
- [Supabase](https://supabase.com/) - Backend as a Service
- [React Native](https://reactnative.dev/) - Framework mobile
- Communauté open source

---

## 📞 Support

- 📧 Email: support@sign-off.app
- 💬 Discord: [Rejoindre](https://discord.gg/sign-off)
- 📖 Documentation: [docs.sign-off.app](https://docs.sign-off.app)
- 🐛 Issues: [GitHub Issues](https://github.com/votre-username/sign-off/issues)

---

<p align="center">
  <strong>Fait avec ❤️ pour protéger votre héritage numérique</strong>
</p>

<p align="center">
  <a href="https://sign-off.app">Site Web</a> •
  <a href="PROJECT_CONTEXT.md">Documentation</a> •
  <a href="https://github.com/votre-username/sign-off/issues">Signaler un Bug</a> •
  <a href="https://github.com/votre-username/sign-off/issues">Demander une Fonctionnalité</a>
</p>
