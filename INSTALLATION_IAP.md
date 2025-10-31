# 🛠️ Installation d'expo-in-app-purchases

## ⚠️ Problème rencontré

L'installation a échoué à cause de :
1. **Conflit de dépendances** : `@types/react` version incompatible
2. **Politique PowerShell** : Exécution de scripts désactivée

---

## ✅ Solution : Installation manuelle

### **Étape 1 : Activer l'exécution de scripts PowerShell**

Ouvrez **PowerShell en tant qu'administrateur** :
1. Clic droit sur le menu Démarrer → "Terminal (Admin)" ou "Windows PowerShell (Admin)"
2. Exécutez cette commande :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

3. Confirmez avec `O` (Oui)

### **Étape 2 : Installer le package**

Dans votre terminal normal (pas admin), exécutez :

```bash
npm install --save expo-in-app-purchases --legacy-peer-deps
```

**OU** si vous préférez yarn :

```bash
yarn add expo-in-app-purchases
```

### **Étape 3 : Restaurer le vrai service IAP**

Une fois le package installé :

```bash
# Supprimer le mock
del lib\services\inAppPurchaseService.ts

# Restaurer le vrai service
move lib\services\inAppPurchaseService.ts.backup lib\services\inAppPurchaseService.ts
```

---

## 🔄 Alternative : Installation sans IAP (pour tester l'UI)

Si vous voulez juste tester l'interface sans installer le package :

### **Le mock est déjà actif !**

Le fichier `lib/services/inAppPurchaseService.ts` actuel est un mock qui :
- ✅ Permet au code de compiler
- ✅ Affiche des produits fictifs dans l'UI
- ✅ Affiche des warnings dans la console
- ❌ Ne permet pas d'achats réels

### **Tester la page upgrade**

1. Lancez l'app : `npx expo start`
2. Naviguez vers la page upgrade
3. Vous verrez l'interface avec des produits mock
4. Les achats afficheront un message d'erreur

---

## 📱 Après installation du vrai package

### **1. Vérifier l'installation**

```bash
npm list expo-in-app-purchases
```

Devrait afficher :
```
sign-off@1.0.0
└── expo-in-app-purchases@15.x.x
```

### **2. Rebuild l'app**

```bash
# Nettoyer le cache
npx expo start --clear

# OU rebuild complet
npx expo prebuild --clean
```

### **3. Tester sur device réel**

Les achats in-app ne fonctionnent **PAS** sur simulateur/émulateur.
Vous devez tester sur :
- **Android** : Device physique avec Google Play
- **iOS** : Device physique avec App Store

---

## 🧪 Tests en mode Sandbox

### **Android (Google Play)**

1. Créer l'app sur Google Play Console
2. Ajouter des testeurs internes
3. Installer via internal testing track
4. Les achats seront gratuits pour les testeurs

### **iOS (App Store)**

1. Créer un compte Sandbox dans App Store Connect
2. Se déconnecter de l'App Store sur le device
3. Lors de l'achat, se connecter avec le compte Sandbox
4. Les achats seront gratuits en Sandbox

---

## 🐛 Dépannage

### **Erreur : "Cannot connect to store"**

**Cause** : App pas signée ou testée sur simulateur

**Solution** :
- Tester sur device physique
- Vérifier que l'app est signée correctement
- Vérifier les product IDs

### **Erreur : "Product not found"**

**Cause** : Produits pas encore actifs dans les stores

**Solution** :
- Attendre 2-24h après création des produits
- Vérifier les IDs dans le code
- Vérifier que les produits sont "Active" dans les consoles

### **Erreur : "IAP not installed"**

**Cause** : Le mock est toujours actif

**Solution** :
- Suivre l'Étape 3 ci-dessus pour restaurer le vrai service

---

## 📊 État actuel du projet

### **✅ Déjà implémenté**

- [x] Service IAP (mock temporaire)
- [x] Page upgrade avec UI complète
- [x] Fonction de vérification des reçus (Supabase Edge Function)
- [x] Intégration avec la base de données
- [x] Gestion des erreurs
- [x] Support iOS et Android

### **⏳ À faire**

- [ ] Installer `expo-in-app-purchases`
- [ ] Restaurer le vrai service IAP
- [ ] Configurer Google Play Console
- [ ] Configurer App Store Connect
- [ ] Déployer la fonction `verify-iap-receipt`
- [ ] Tester en mode Sandbox

---

## 🚀 Commandes rapides

```bash
# 1. Activer PowerShell (en tant qu'admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. Installer le package
npm install --save expo-in-app-purchases --legacy-peer-deps

# 3. Restaurer le vrai service
del lib\services\inAppPurchaseService.ts
move lib\services\inAppPurchaseService.ts.backup lib\services\inAppPurchaseService.ts

# 4. Nettoyer et relancer
npx expo start --clear
```

---

## 📚 Ressources

- [Expo In-App Purchases Docs](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Guide de migration complet](./docs/IAP_MIGRATION_GUIDE.md)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [Apple In-App Purchase](https://developer.apple.com/in-app-purchase/)

---

**Note** : Pour l'instant, l'app fonctionne avec le mock. Vous pouvez tester l'interface sans problème. Les achats réels nécessitent l'installation du vrai package.
