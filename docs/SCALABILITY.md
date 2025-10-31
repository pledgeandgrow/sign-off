# 🚀 Guide de Scalabilité - Nettoyage des Fichiers Orphelins

## 📊 Problèmes avec des Millions d'Utilisateurs

### Système Actuel (Nettoyage Immédiat)
```typescript
// ❌ PROBLÈME : Exécuté à chaque upload/suppression
uploadFile() → cleanupOrphanedFiles(userId)
```

**Impacts négatifs :**
- ⚠️ **Charge DB excessive** : Millions de requêtes par jour
- ⚠️ **Latence utilisateur** : Attente du nettoyage
- ⚠️ **Coûts élevés** : Requêtes Supabase facturées
- ⚠️ **Risque de timeout** : Utilisateurs avec beaucoup de fichiers

---

## ✅ Solutions Recommandées

### **Solution 1 : Throttling (Implémenté)**

**Fichier :** `lib/services/cleanupOrphanedFiles.ts`

```typescript
// ✅ Nettoyage max 1 fois / 5 minutes par utilisateur
const CLEANUP_COOLDOWN = 5 * 60 * 1000;
```

**Avantages :**
- ✅ Réduit la charge de 95%+
- ✅ Pas de changement d'architecture
- ✅ Fonctionne jusqu'à ~100K utilisateurs actifs

**Limites :**
- ⚠️ Toujours synchrone avec l'action utilisateur
- ⚠️ Ne scale pas au-delà de 1M utilisateurs

---

### **Solution 2 : Job Planifié (Recommandé pour Scale)**

**Fichier :** `lib/services/scheduledCleanup.ts`

#### Architecture

```
┌─────────────────────────────────────────┐
│  Utilisateur Upload/Supprime Fichier   │
│  ✅ Pas de nettoyage immédiat          │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  CRON Job (1x par jour à 3h du matin)  │
│  - Traite 100 utilisateurs à la fois    │
│  - Pause de 1s entre chaque batch       │
│  - Logs détaillés                       │
└─────────────────────────────────────────┘
```

#### Implémentation avec Supabase Edge Functions

**1. Créer une Edge Function**

```bash
# Créer la fonction
supabase functions new cleanup-orphaned-files

# Déployer
supabase functions deploy cleanup-orphaned-files
```

**2. Code de la fonction** (`supabase/functions/cleanup-orphaned-files/index.ts`)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { scheduledCleanupAllUsers } from './scheduledCleanup.ts'

serve(async (req) => {
  // Vérifier l'authentification (clé secrète)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CLEANUP_SECRET_KEY')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Exécuter le nettoyage
  const result = await scheduledCleanupAllUsers()

  return new Response(
    JSON.stringify(result),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**3. Configurer le CRON**

Via GitHub Actions (`.github/workflows/cleanup-orphaned-files.yml`) :

```yaml
name: Cleanup Orphaned Files

on:
  schedule:
    - cron: '0 3 * * *'  # Tous les jours à 3h du matin UTC
  workflow_dispatch:  # Permet déclenchement manuel

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CLEANUP_SECRET_KEY }}" \
            https://your-project.supabase.co/functions/v1/cleanup-orphaned-files
```

**Avantages :**
- ✅ **Zéro impact utilisateur** : Nettoyage en arrière-plan
- ✅ **Scale infini** : Traite des millions d'utilisateurs
- ✅ **Contrôle des coûts** : 1 exécution par jour
- ✅ **Monitoring facile** : Logs centralisés
- ✅ **Réessai automatique** : En cas d'échec

---

### **Solution 3 : Nettoyage Lazy (Alternative)**

Ne nettoyer que quand nécessaire :

```typescript
// Nettoyer uniquement si > 10 fichiers orphelins détectés
if (orphanedFiles.length > 10) {
  await cleanupOrphanedFiles(userId)
}
```

**Avantages :**
- ✅ Très peu de nettoyages
- ✅ Simple à implémenter

**Inconvénients :**
- ⚠️ Fichiers orphelins s'accumulent
- ⚠️ Coûts de stockage plus élevés

---

## 📈 Comparaison des Solutions

| Critère | Throttling | Job Planifié | Lazy |
|---------|-----------|--------------|------|
| **Scale** | ~100K users | Illimité | ~500K users |
| **Impact utilisateur** | Faible | Aucun | Aucun |
| **Coûts DB** | Moyen | Faible | Très faible |
| **Complexité** | Faible | Moyenne | Faible |
| **Nettoyage** | Rapide | Différé | Différé |
| **Recommandé pour** | MVP/Beta | Production | Petite app |

---

## 🎯 Recommandation Finale

### Pour votre cas (Millions d'utilisateurs) :

1. **Court terme (maintenant)** :
   - ✅ Garder le throttling (déjà implémenté)
   - ✅ Augmenter le cooldown à 30 minutes

2. **Moyen terme (avant 10K utilisateurs)** :
   - ✅ Implémenter le job planifié
   - ✅ Désactiver le nettoyage immédiat
   - ✅ Configurer le CRON quotidien

3. **Long terme (scale)** :
   - ✅ Monitoring des métriques (fichiers orphelins, temps d'exécution)
   - ✅ Alertes si > 1000 fichiers orphelins par utilisateur
   - ✅ Auto-scaling du job selon la charge

---

## 🔧 Optimisations Additionnelles

### 1. Index Database
```sql
-- Accélérer les requêtes de nettoyage
CREATE INDEX idx_vault_items_user_file 
ON vault_items(user_id) 
WHERE metadata->>'fileUrl' IS NOT NULL;
```

### 2. Pagination
```typescript
// Pour utilisateurs avec beaucoup de fichiers
const ITEMS_PER_PAGE = 1000;
// Traiter par pages
```

### 3. Cache Redis
```typescript
// Cacher les résultats de nettoyage
const lastCleanup = await redis.get(`cleanup:${userId}`);
```

### 4. Métriques
```typescript
// Logger pour monitoring
console.log({
  event: 'cleanup_completed',
  userId,
  filesDeleted: count,
  duration: Date.now() - start
});
```

---

## 📊 Estimation des Coûts

### Avec Nettoyage Immédiat (Actuel)
- 1M utilisateurs × 10 uploads/jour = 10M nettoyages/jour
- Coût Supabase : ~$500-1000/mois

### Avec Job Planifié (Recommandé)
- 1 nettoyage/jour × 1M utilisateurs = 1M requêtes/jour
- Coût Supabase : ~$50-100/mois

**Économie : 90%+ 💰**

---

## 🚀 Migration

### Étape 1 : Augmenter le throttling
```typescript
const CLEANUP_COOLDOWN = 30 * 60 * 1000; // 30 minutes
```

### Étape 2 : Déployer le job planifié
```bash
supabase functions deploy cleanup-orphaned-files
```

### Étape 3 : Tester
```bash
# Test manuel
curl -X POST \
  -H "Authorization: Bearer YOUR_SECRET" \
  https://your-project.supabase.co/functions/v1/cleanup-orphaned-files
```

### Étape 4 : Désactiver le nettoyage immédiat
```typescript
// Dans fileUploadService.ts
// Commenter cette ligne :
// cleanupOrphanedFiles(userId).catch(...)
```

### Étape 5 : Monitoring
- Vérifier les logs quotidiens
- Alertes si échec
- Dashboard de métriques

---

## 📞 Support

Pour questions : Voir `lib/services/scheduledCleanup.ts`
