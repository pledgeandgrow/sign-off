# 🔧 Fix: Cannot find module 'react-native-worklets/plugin'

## ❌ Erreur

```
Cannot find module 'react-native-worklets/plugin'
Require stack:
- react-native-reanimated\plugin\index.js
```

## 🎯 Cause

Conflit de versions entre `react-native-reanimated` et ses dépendances.

---

## ✅ Solution 1 : Réinstaller react-native-reanimated (RECOMMANDÉ)

### **Étape 1 : Supprimer les packages problématiques**

```bash
npm uninstall react-native-reanimated react-native-worklets-core
```

### **Étape 2 : Nettoyer le cache**

```bash
npm cache clean --force
```

### **Étape 3 : Supprimer node_modules**

```bash
rmdir /s /q node_modules
```

### **Étape 4 : Réinstaller**

```bash
npm install
```

### **Étape 5 : Installer react-native-reanimated**

```bash
npx expo install react-native-reanimated
```

### **Étape 6 : Nettoyer le cache Metro et redémarrer**

```bash
npx expo start --clear
```

---

## ✅ Solution 2 : Downgrade react-native-reanimated

Si la solution 1 ne fonctionne pas :

```bash
npm install react-native-reanimated@3.6.0 --legacy-peer-deps
npx expo start --clear
```

---

## ✅ Solution 3 : Créer un lien symbolique (Workaround)

Si les solutions précédentes échouent, créer un alias :

### **Dans node_modules/react-native-reanimated/plugin/index.js**

Modifier la ligne :
```javascript
// Avant
const { plugin } = require('react-native-worklets/plugin');

// Après
const plugin = () => ({ visitor: {} }); // Workaround temporaire
```

⚠️ **Cette solution est temporaire et peut causer d'autres problèmes.**

---

## ✅ Solution 4 : Vérifier babel.config.js

Assurez-vous que `babel.config.js` est correct :

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Doit être en dernier
    ],
  };
};
```

---

## 🔍 Vérification

Après avoir appliqué une solution :

1. **Arrêter Expo** (Ctrl+C)
2. **Nettoyer le cache** : `npx expo start --clear`
3. **Vérifier les versions** :
   ```bash
   npm list react-native-reanimated
   npm list react-native-worklets-core
   ```

---

## 📊 Versions Compatibles

| Package | Version Recommandée |
|---------|---------------------|
| expo | ~52.0.0 |
| react-native-reanimated | ~3.16.0 |
| react-native-worklets-core | Pas nécessaire (inclus dans reanimated) |

---

## 🚨 Si Rien Ne Fonctionne

### **Option A : Supprimer react-native-reanimated temporairement**

Si vous n'utilisez pas d'animations complexes :

```bash
npm uninstall react-native-reanimated
```

Puis commenter dans `babel.config.js` :
```javascript
plugins: [
  // 'react-native-reanimated/plugin',
],
```

### **Option B : Projet propre**

```bash
# 1. Sauvegarder package.json
copy package.json package.json.backup

# 2. Tout supprimer
rmdir /s /q node_modules
del package-lock.json

# 3. Réinstaller
npm install

# 4. Redémarrer
npx expo start --clear
```

---

## 📝 Commandes Rapides (CMD)

Copiez-collez dans CMD (pas PowerShell) :

```cmd
npm uninstall react-native-reanimated react-native-worklets-core
npm cache clean --force
rmdir /s /q node_modules
npm install
npx expo install react-native-reanimated
npx expo start --clear
```

---

## ✅ Résultat Attendu

Après le fix, vous devriez voir :

```
✓ Metro waiting on exp://192.168.1.17:8081
✓ Web is waiting on http://localhost:8081
```

Sans erreur `Cannot find module 'react-native-worklets/plugin'`.
