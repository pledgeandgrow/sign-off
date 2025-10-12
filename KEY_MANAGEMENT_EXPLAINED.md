# 🔐 Key Management & User Creation Flow

## Complete User Registration Flow

Here's exactly what happens when a user creates an account:

---

## 📋 Step-by-Step Process

### **Step 1: User Signs Up** 
User enters email, password, and name in the app.

### **Step 2: Supabase Auth Creates Account**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: userData.email,
  password: userData.password,
  options: {
    data: { full_name: userData.fullName }
  }
});
```
✅ **Creates record in `auth.users` table** (Supabase's internal auth table)

### **Step 3: Generate Encryption Keys** 🔑
```typescript
const { publicKey, privateKey } = await generateKeyPair();
```

**What happens:**
- Generates a random 256-bit master key (private key)
- Derives a public key identifier from it
- Uses `expo-crypto` for cryptographically secure random generation

**Keys generated:**
- **Private Key**: `base64-encoded 32-byte random key` (e.g., "Kx7mP9qR...")
- **Public Key**: `SHA-256 hash` (e.g., "a3f2c8d1e5b...")

### **Step 4: Store Keys on Device** 💾
```typescript
await storePrivateKey(privateKey);  // Stored in device secure storage
await storePublicKey(publicKey);    // Stored in device secure storage
```

**Where keys are stored:**
- **iOS**: Keychain (hardware-encrypted)
- **Android**: Keystore (hardware-encrypted)
- **Storage keys**: 
  - `user_private_key` → Private key
  - `user_public_key` → Public key

**Security:**
- ✅ Never leaves the device
- ✅ Hardware-encrypted
- ✅ Requires device unlock to access
- ✅ Survives app reinstall (if device backup enabled)

### **Step 5: Create User Profile in Database** 👤
```typescript
await createUserProfile(data.user.id, userData.email, userData.fullName, publicKey);
```

**Creates record in `public.users` table:**
```sql
INSERT INTO public.users (
  id,                    -- Same as auth.users.id
  email,                 -- user@example.com
  full_name,             -- "John Doe"
  public_key,            -- "a3f2c8d1e5b..." (stored in DB)
  is_active,             -- true
  created_at,            -- NOW()
  updated_at,            -- NOW()
  last_login             -- NULL (first login)
) VALUES (...)
```

✅ **Now user exists in both:**
- `auth.users` (authentication)
- `public.users` (app profile + public key)

---

## 🔑 Key Storage Summary

### **Private Key** 🔒
- **Location**: Device secure storage (Keychain/Keystore)
- **Access**: Only on user's device
- **Purpose**: Decrypt data
- **Shared**: ❌ NEVER shared, never sent to server
- **Backup**: Optional via recovery passphrase

### **Public Key** 🔓
- **Location**: 
  - Device secure storage (for quick access)
  - Database `public.users.public_key` (for sharing)
- **Access**: Anyone who needs to encrypt data for this user
- **Purpose**: Encrypt data for this user
- **Shared**: ✅ Yes, stored in database
- **Backup**: In database

---

## 🔄 How Keys Are Used

### **Encrypting Data (Using Public Key)**
```typescript
// When creating a vault item
const publicKey = await getPublicKey(); // From device storage
const encrypted = await encryptData("My password", publicKey);
// Stores encrypted data in database
```

### **Decrypting Data (Using Private Key)**
```typescript
// When viewing a vault item
const privateKey = await getPrivateKey(); // From device storage
const decrypted = await decryptData(encryptedData, privateKey);
// Shows decrypted data to user
```

### **Sharing Data (Re-encryption)**
```typescript
// When sharing with another user
// 1. Get your private key
const myPrivateKey = await getPrivateKey();

// 2. Decrypt data with your private key
const plaintext = await decryptData(encryptedData, myPrivateKey);

// 3. Get recipient's public key from database
const { data: recipient } = await supabase
  .from('users')
  .select('public_key')
  .eq('id', recipientId)
  .single();

// 4. Re-encrypt with recipient's public key
const reencrypted = await encryptData(plaintext, recipient.public_key);

// 5. Store re-encrypted data for recipient
```

---

## 🆘 Key Recovery

### **Problem: User Loses Device**
If user loses their device, they lose their private key!

### **Solution 1: Recovery Passphrase** (Recommended)
```typescript
// During setup, user creates a recovery passphrase
const recoveryPassphrase = "my super secret recovery phrase";

// Encrypt private key with passphrase
const encryptedPrivateKey = await encryptPrivateKeyWithPassphrase(
  privateKey,
  recoveryPassphrase
);

// Store in database
await supabase
  .from('private_key_recovery')
  .insert({
    user_id: userId,
    encrypted_private_key: encryptedPrivateKey,
    recovery_method: 'passphrase',
  });
```

**Recovery process:**
1. User enters recovery passphrase
2. Fetch encrypted private key from database
3. Decrypt with passphrase
4. Store on new device

### **Solution 2: Security Questions**
Similar to passphrase but uses answers to security questions.

### **Solution 3: Backup Codes**
One-time use codes for recovery.

---

## 📊 Database Tables Involved

### **1. `auth.users`** (Supabase managed)
```sql
id              | UUID (primary key)
email           | TEXT
encrypted_password | TEXT (Supabase manages)
email_confirmed_at | TIMESTAMP
created_at      | TIMESTAMP
```

### **2. `public.users`** (Your app profile)
```sql
id              | UUID (references auth.users.id)
email           | TEXT
full_name       | TEXT
public_key      | TEXT (NOT NULL) ← Public key stored here!
is_active       | BOOLEAN
created_at      | TIMESTAMP
updated_at      | TIMESTAMP
last_login      | TIMESTAMP
```

### **3. `public.private_key_recovery`** (Optional backup)
```sql
id              | UUID
user_id         | UUID (references public.users.id)
encrypted_private_key | TEXT ← Private key encrypted with passphrase
recovery_method | TEXT ('passphrase', 'security_questions', 'backup_codes')
recovery_hint   | TEXT
created_at      | TIMESTAMP
```

---

## 🔒 Security Best Practices

### **✅ What We Do Right:**
1. **Private key never leaves device** - Stored in hardware-encrypted storage
2. **Public key in database** - Allows others to encrypt data for you
3. **AES-256-CBC encryption** - Industry standard
4. **PBKDF2 key derivation** - 5000 iterations for key strengthening
5. **Random IV per encryption** - Prevents pattern analysis
6. **Secure random generation** - Uses `expo-crypto` (cryptographically secure)

### **⚠️ Important Notes:**
1. **If user loses device AND has no recovery** → Data is permanently lost
2. **Recovery passphrase must be strong** → It's the only backup
3. **Public key is public** → Anyone can encrypt data for you (that's the point!)
4. **Private key = master key** → Protects everything

---

## 🎯 Quick Reference

### **When User Signs Up:**
```
1. Create auth.users record (Supabase)
2. Generate key pair (device)
3. Store private key (device secure storage)
4. Store public key (device + database)
5. Create public.users record (database)
```

### **When User Logs In:**
```
1. Authenticate with Supabase
2. Load user profile from public.users
3. Keys already on device (from signup)
4. Ready to encrypt/decrypt!
```

### **When User Logs In on New Device:**
```
1. Authenticate with Supabase
2. Load user profile from public.users
3. ❌ No private key on this device!
4. → Must use recovery method to restore private key
5. → Or start fresh (loses access to old encrypted data)
```

---

## 🧪 Testing the Flow

### **Test 1: Check Keys After Signup**
```typescript
// After signup, check if keys exist
const privateKey = await getPrivateKey();
const publicKey = await getPublicKey();

console.log('Private key exists:', !!privateKey);
console.log('Public key exists:', !!publicKey);
console.log('Public key length:', publicKey?.length);
```

### **Test 2: Check Database Record**
```sql
-- Check if user profile was created
SELECT id, email, full_name, public_key, created_at
FROM public.users
WHERE email = 'test@example.com';
```

### **Test 3: Test Encryption/Decryption**
```typescript
const publicKey = await getPublicKey();
const privateKey = await getPrivateKey();

const original = "Secret password";
const encrypted = await encryptData(original, publicKey!);
const decrypted = await decryptData(encrypted, privateKey!);

console.log('Original:', original);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
console.log('Match:', original === decrypted); // Should be true
```

---

## 📝 Summary

**Yes, when creating a user in the app:**
1. ✅ Creates `auth.users` record (Supabase Auth)
2. ✅ Creates `public.users` record (your app)
3. ✅ Generates private/public key pair
4. ✅ Stores private key on device (secure storage)
5. ✅ Stores public key on device AND in database

**Private key is given to user:**
- At signup (generated and stored on device)
- Never transmitted over network
- Never stored in database (unless encrypted for recovery)
- Stays on device in hardware-encrypted storage

**If user needs access on another device:**
- Must use recovery method (passphrase, security questions, backup codes)
- Or lose access to old encrypted data

---

**Status:** ✅ Complete end-to-end encryption with secure key management!
