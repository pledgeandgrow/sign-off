# 🛒 Migration vers les Achats In-App (Google Play & App Store)

## 📋 Vue d'ensemble

Ce guide explique comment migrer de Square vers les achats in-app natifs pour Android (Google Play) et iOS (App Store).

---

## ✅ Avantages des Achats In-App

### **vs Square**
| Critère | Square | In-App Purchases |
|---------|--------|------------------|
| **Commission** | 2.9% + 0.30€ | 15-30% (Apple/Google) |
| **Expérience** | Redirection web | Native dans l'app |
| **Confiance** | Moyenne | Très élevée |
| **Gestion** | Externe | Intégrée aux stores |
| **Renouvellement** | Manuel | Automatique |
| **Restauration** | Complexe | Native |
| **Conformité** | Manuelle | Automatique (stores) |

### **Pourquoi migrer ?**
✅ **Obligatoire** : Google Play et App Store exigent l'utilisation de leur système de paiement  
✅ **Meilleure UX** : Paiement natif, pas de redirection  
✅ **Confiance** : Les utilisateurs font confiance aux stores  
✅ **Automatisation** : Renouvellement et gestion automatiques  
✅ **Restauration facile** : Restaurer les achats sur nouveau device  

---

## 🚀 Installation

### **Étape 1 : Installer le package**

```bash
npx expo install expo-in-app-purchases
```

### **Étape 2 : Configuration Android (Google Play)**

#### 2.1 Créer l'application sur Google Play Console
1. Aller sur [Google Play Console](https://play.google.com/console)
2. Créer une nouvelle application
3. Remplir les informations de base

#### 2.2 Configurer les produits d'abonnement
1. Dans Play Console → **Monétisation** → **Produits** → **Abonnements**
2. Créer un nouvel abonnement :
   - **ID produit** : `premium_monthly`
   - **Nom** : Abonnement Premium Mensuel
   - **Description** : Accès illimité aux fonctionnalités premium
   - **Prix** : 10.00 EUR
   - **Période** : 1 mois
   - **Renouvellement** : Automatique

3. Créer un abonnement annuel (optionnel) :
   - **ID produit** : `premium_yearly`
   - **Prix** : 100.00 EUR
   - **Période** : 1 an

#### 2.3 Configurer l'API Google Play Developer
1. Dans Play Console → **Configuration** → **Accès API**
2. Créer un compte de service
3. Télécharger la clé JSON
4. Activer l'API Google Play Developer dans Google Cloud Console
5. Copier la clé API

#### 2.4 Ajouter les variables d'environnement
```bash
# Dans Supabase Edge Functions
GOOGLE_PLAY_API_KEY=your_google_play_api_key
ANDROID_PACKAGE_NAME=com.signoff.app
```

### **Étape 3 : Configuration iOS (App Store)**

#### 3.1 Créer l'application sur App Store Connect
1. Aller sur [App Store Connect](https://appstoreconnect.apple.com)
2. Créer une nouvelle app
3. Remplir les informations de base

#### 3.2 Configurer les produits d'abonnement
1. Dans App Store Connect → **Fonctionnalités** → **Abonnements**
2. Créer un nouveau groupe d'abonnements
3. Créer un abonnement :
   - **ID produit** : `com.signoff.premium.monthly`
   - **Nom de référence** : Premium Monthly
   - **Prix** : 10.00 EUR
   - **Durée** : 1 mois

4. Créer un abonnement annuel (optionnel) :
   - **ID produit** : `com.signoff.premium.yearly`
   - **Prix** : 100.00 EUR
   - **Durée** : 1 an

#### 3.3 Obtenir le Shared Secret
1. Dans App Store Connect → **Mon App** → **Informations générales**
2. Sous **Informations sur l'abonnement** → **Secret partagé**
3. Générer ou copier le secret

#### 3.4 Ajouter les variables d'environnement
```bash
# Dans Supabase Edge Functions
APPLE_SHARED_SECRET=your_apple_shared_secret
```

### **Étape 4 : Déployer la fonction de vérification**

```bash
# Déployer la fonction Supabase
supabase functions deploy verify-iap-receipt

# Définir les secrets
supabase secrets set GOOGLE_PLAY_API_KEY=your_key
supabase secrets set APPLE_SHARED_SECRET=your_secret
supabase secrets set ANDROID_PACKAGE_NAME=com.signoff.app
```

### **Étape 5 : Mettre à jour la base de données**

```sql
-- Ajouter les colonnes pour IAP dans la table subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS store_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS store_product_id TEXT,
ADD COLUMN IF NOT EXISTS store_platform TEXT CHECK (store_platform IN ('ios', 'android', 'web')),
ADD COLUMN IF NOT EXISTS receipt_data TEXT;

-- Créer un index pour les transactions
CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction 
ON subscriptions(store_transaction_id);
```

---

## 💻 Utilisation dans le Code

### **Exemple : Page d'upgrade**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  initializeIAP,
  getProducts,
  completePurchaseFlow,
  restorePurchases,
  PurchaseProduct,
} from '@/lib/services/inAppPurchaseService';

export default function UpgradeScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    return () => {
      // Cleanup on unmount
      disconnectIAP();
    };
  }, []);

  const loadProducts = async () => {
    // Initialize IAP
    const initResult = await initializeIAP();
    if (!initResult.success) {
      Alert.alert('Erreur', 'Impossible de charger les produits');
      return;
    }

    // Get available products
    const availableProducts = await getProducts();
    setProducts(availableProducts);
  };

  const handlePurchase = async (productId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await completePurchaseFlow(user.id, productId);
      
      if (result.success) {
        Alert.alert(
          'Succès !',
          'Votre abonnement Premium est maintenant actif',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Échec de l\'achat');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      
      if (result.success && result.purchases.length > 0) {
        Alert.alert('Succès', 'Achats restaurés avec succès');
      } else {
        Alert.alert('Info', 'Aucun achat à restaurer');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la restauration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {products.map(product => (
        <TouchableOpacity
          key={product.productId}
          onPress={() => handlePurchase(product.productId)}
          disabled={loading}
        >
          <Text>{product.title}</Text>
          <Text>{product.description}</Text>
          <Text>{product.price}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={handleRestore} disabled={loading}>
        <Text>Restaurer les achats</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 🧪 Tests

### **Test en mode Sandbox**

#### Android (Google Play)
1. Ajouter des testeurs dans Play Console → **Configuration** → **Accès aux licences**
2. Installer l'app via internal testing track
3. Effectuer un achat test (ne sera pas facturé)

#### iOS (App Store)
1. Créer un compte Sandbox dans App Store Connect → **Utilisateurs et accès** → **Testeurs Sandbox**
2. Se déconnecter de l'App Store sur l'appareil
3. Lors de l'achat, se connecter avec le compte Sandbox

### **Vérifier les webhooks**

```bash
# Voir les logs de la fonction
supabase functions logs verify-iap-receipt --tail

# Tester manuellement
curl -X POST https://your-project.supabase.co/functions/v1/verify-iap-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "transactionId": "test-transaction",
    "productId": "premium_monthly",
    "receiptData": "test-receipt",
    "platform": "android"
  }'
```

---

## 🔄 Migration depuis Square

### **Étape 1 : Garder Square temporairement**
- Les deux systèmes peuvent coexister
- Square pour web, IAP pour mobile

### **Étape 2 : Migrer les utilisateurs existants**
```sql
-- Identifier les utilisateurs avec abonnement Square actif
SELECT id, email, subscription_tier, subscription_expires_at
FROM users
WHERE subscription_tier = 'premium'
  AND subscription_status = 'active'
  AND square_subscription_id IS NOT NULL;

-- Leur envoyer un email pour migrer vers IAP
```

### **Étape 3 : Période de transition**
- 30 jours pour migrer
- Garder Square actif pendant cette période
- Notifier les utilisateurs

### **Étape 4 : Désactiver Square**
```typescript
// Commenter/supprimer le code Square
// Dans app/(tabs)/index.tsx
/*
const handleUpgrade = async () => {
  const paymentUrl = `${SQUARE_CONFIG.PAYMENT_LINK}?user_id=${user.id}`;
  await Linking.openURL(paymentUrl);
};
*/
```

---

## 📊 Monitoring

### **Métriques à suivre**
- Taux de conversion (essai → achat)
- Taux de renouvellement
- Taux d'annulation
- Revenus mensuels
- Nombre d'abonnés actifs

### **Dashboard Supabase**
```sql
-- Abonnés actifs par plateforme
SELECT 
  store_platform,
  COUNT(*) as active_subscriptions,
  SUM(amount) as monthly_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY store_platform;

-- Taux de renouvellement
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_subscriptions,
  COUNT(CASE WHEN cancelled_at IS NULL THEN 1 END) as still_active
FROM subscriptions
GROUP BY month
ORDER BY month DESC;
```

---

## ⚠️ Points d'attention

### **Commissions**
- **Apple** : 30% la première année, 15% après
- **Google** : 15% (pour abonnements < 1M$/an)
- Prévoir dans votre pricing

### **Délais de paiement**
- Apple : 30-45 jours
- Google : 15-30 jours

### **Remboursements**
- Gérés par les stores
- Vous recevez une notification webhook
- Mettre à jour le statut dans votre DB

### **Conformité**
- Respecter les guidelines des stores
- Ne pas mentionner d'autres moyens de paiement dans l'app
- Pas de liens externes pour payer

---

## 🆘 Dépannage

### **Erreur : "Cannot connect to store"**
- Vérifier que l'app est signée correctement
- Vérifier les product IDs
- Tester en mode Sandbox

### **Erreur : "Product not found"**
- Vérifier que les produits sont actifs dans les stores
- Attendre 2-24h après création des produits
- Vérifier les IDs dans le code

### **Erreur : "Receipt verification failed"**
- Vérifier les secrets (Apple Shared Secret, Google API Key)
- Vérifier les logs de la fonction Edge
- Tester avec un receipt valide

---

## 📚 Ressources

- [Expo In-App Purchases Docs](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [Apple In-App Purchase](https://developer.apple.com/in-app-purchase/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist de Migration

- [ ] Installer `expo-in-app-purchases`
- [ ] Créer les produits sur Google Play Console
- [ ] Créer les produits sur App Store Connect
- [ ] Configurer les API keys et secrets
- [ ] Déployer la fonction `verify-iap-receipt`
- [ ] Mettre à jour la base de données
- [ ] Tester en mode Sandbox (Android)
- [ ] Tester en mode Sandbox (iOS)
- [ ] Mettre à jour l'UI pour utiliser IAP
- [ ] Notifier les utilisateurs Square existants
- [ ] Période de transition (30 jours)
- [ ] Désactiver Square
- [ ] Monitoring et analytics

---

**Prêt à migrer ? Suivez ce guide étape par étape !** 🚀
