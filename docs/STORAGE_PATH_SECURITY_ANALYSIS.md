# Storage Path Security Analysis

## 🔐 Question: Should storage paths be encrypted in the database?

### TL;DR: **Keep Storage Paths READABLE (Not Encrypted)**

---

## 📊 Analysis

### Storage Path Structure
```
storage_path: "user-id/vault-id/item-id.enc"
storage_bucket: "vault-items"
```

### What Information Does This Reveal?

**If readable:**
- ✅ User ID (already known - they're logged in)
- ✅ Vault ID (already accessible via RLS)
- ✅ Item ID (already accessible via RLS)
- ✅ File extension `.enc` (indicates encrypted)

**Sensitive information revealed:** ❌ **NONE**

---

## ✅ Recommendation: Keep Paths READABLE

### Reasons to Keep Readable

#### 1. **No Sensitive Data Exposed**
```typescript
// Path reveals structure, not content
storage_path: "550e8400-e29b-41d4-a716-446655440000/7c9e6679-7425-40de-944b-e07fc1f90ae7/a1b2c3d4-e5f6-7890-abcd-ef1234567890.enc"

// What an attacker sees:
// - UUIDs (meaningless without context)
// - File is encrypted (.enc extension)
// - No file names, no content, no metadata
```

#### 2. **Database Queries & Performance**
```sql
-- ✅ FAST - Can query by path
SELECT * FROM vault_items WHERE storage_path = 'user-id/vault-id/item-id.enc';

-- ✅ FAST - Can use indexes
CREATE INDEX idx_vault_items_storage_path ON vault_items(storage_path);

-- ❌ SLOW - Cannot query encrypted paths
SELECT * FROM vault_items WHERE storage_path_encrypted = ?;
-- Would need to decrypt every row to find match
```

#### 3. **Supabase Storage Requires Plain Paths**
```typescript
// ✅ Works - Supabase needs plain path
await supabase.storage
  .from('vault-items')
  .download('user-id/vault-id/item-id.enc')

// ❌ Doesn't work - Supabase can't decrypt
await supabase.storage
  .from('vault-items')
  .download(encryptedPath)  // Storage doesn't know how to decrypt
```

#### 4. **Row Level Security (RLS) Protects Access**
```sql
-- Users can only access their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vault-items' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Even if someone knows the path, RLS prevents access
-- Path: "other-user-id/vault-id/item-id.enc"
-- Result: Access denied by RLS
```

#### 5. **Simplifies Implementation**
```typescript
// ✅ Simple - Direct path usage
const { data } = await supabase.storage
  .from(item.storage_bucket)
  .download(item.storage_path)

// ❌ Complex - Need to decrypt first
const decryptedPath = await decrypt(item.storage_path_encrypted, privateKey)
const { data } = await supabase.storage
  .from(item.storage_bucket)
  .download(decryptedPath)
```

#### 6. **Debugging & Monitoring**
```typescript
// ✅ Easy to debug
console.log('Downloading:', item.storage_path)
// Output: "user-id/vault-id/item-id.enc"

// ❌ Hard to debug
console.log('Downloading:', item.storage_path_encrypted)
// Output: "8f3k2j9d8s7a6g5h4j3k2l1m..."
```

---

## ❌ Why NOT to Encrypt Paths

### Problems with Encrypted Paths

#### 1. **Performance Issues**
```typescript
// Need to decrypt every path for queries
const items = await supabase
  .from('vault_items')
  .select('*')
  .eq('vault_id', vaultId)

// Then decrypt each path
for (const item of items) {
  item.storage_path = await decrypt(item.storage_path_encrypted, privateKey)
}
// Slow for large lists!
```

#### 2. **Cannot Use Database Features**
```sql
-- ❌ Cannot search by path
WHERE storage_path LIKE 'user-id/%'

-- ❌ Cannot use path in joins
JOIN storage.objects ON objects.name = vault_items.storage_path

-- ❌ Cannot create functional indexes
CREATE INDEX ON vault_items(storage_path)
```

#### 3. **Complicates Inheritance**
```typescript
// When heir inherits, they need to:
// 1. Decrypt path with original user's key
// 2. Access file in storage
// 3. Re-encrypt with heir's key

// But heir doesn't have original user's private key!
// Would need complex key re-encryption system
```

#### 4. **Storage Cleanup Issues**
```typescript
// ❌ Cannot easily find orphaned files
// If database record deleted but storage file remains
// Cannot match encrypted paths to storage files
```

---

## 🔒 What SHOULD Be Encrypted

### Encrypt These Fields

```typescript
vault_items {
  // ✅ ENCRYPT - Contains sensitive data
  title_encrypted: text
  file_name_encrypted: text  // Original filename
  content_encrypted: text    // For text items
  
  // ❌ DON'T ENCRYPT - System identifiers
  storage_path: text         // "user-id/vault-id/item-id.enc"
  storage_bucket: text       // "vault-items"
  
  // ❌ DON'T ENCRYPT - Metadata
  file_size: bigint
  file_type: text
  dimensions: jsonb
  
  // ❌ DON'T ENCRYPT - Non-sensitive
  tags: text[]
  is_favorite: boolean
}
```

### Why This Works

**Encrypted:**
- ✅ `title_encrypted` - "My Bank Password.pdf" → encrypted
- ✅ `file_name_encrypted` - "secret-document.pdf" → encrypted

**Not Encrypted:**
- ✅ `storage_path` - "uuid/uuid/uuid.enc" → meaningless to attacker
- ✅ `file_type` - "application/pdf" → doesn't reveal content
- ✅ `file_size` - "1024000" → doesn't reveal content

---

## 🛡️ Security Layers

### Multiple Protection Layers

```
Layer 1: Authentication
├─ User must be logged in
└─ Valid session token required

Layer 2: Row Level Security (Database)
├─ Can only query own vault_items
└─ Cannot see other users' records

Layer 3: Storage Policies (Supabase Storage)
├─ Can only access files in own folder
└─ Path structure enforced: user-id/vault-id/item-id.enc

Layer 4: File Encryption
├─ File content is encrypted
└─ Cannot decrypt without private key

Layer 5: Metadata Encryption
├─ Sensitive fields encrypted (title, filename)
└─ Cannot see what file contains
```

**Result:** Even if someone gets the storage path, they:
- ❌ Cannot access the file (RLS blocks)
- ❌ Cannot decrypt the file (no private key)
- ❌ Cannot see what it contains (encrypted)
- ❌ Cannot see the original filename (encrypted)

---

## 📋 Recommended Schema

```sql
CREATE TABLE public.vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  item_type vault_item_type NOT NULL,
  storage_type TEXT NOT NULL CHECK (storage_type IN ('database', 'storage')),
  
  -- ✅ ENCRYPT - Sensitive metadata
  title_encrypted TEXT NOT NULL,
  file_name_encrypted TEXT,  -- Original filename
  content_encrypted TEXT,    -- For text items
  
  -- ❌ DON'T ENCRYPT - System paths (protected by RLS)
  storage_path TEXT,         -- "user-id/vault-id/item-id.enc"
  storage_bucket TEXT DEFAULT 'vault-items',
  
  -- ❌ DON'T ENCRYPT - Non-sensitive metadata
  file_size BIGINT,
  file_type TEXT,
  dimensions JSONB,
  duration INTEGER,
  thumbnail_path TEXT,       -- Also a system path
  
  -- ❌ DON'T ENCRYPT - User preferences
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT vault_items_storage_check CHECK (
    (storage_type = 'database' AND content_encrypted IS NOT NULL) OR
    (storage_type = 'storage' AND storage_path IS NOT NULL)
  ),
  CONSTRAINT vault_items_storage_path_unique UNIQUE (storage_path)
);

-- ✅ Can create index on plain path
CREATE INDEX idx_vault_items_storage_path ON vault_items(storage_path);
CREATE INDEX idx_vault_items_storage_bucket ON vault_items(storage_bucket);
```

---

## 💡 Best Practices

### 1. Use Predictable Path Structure
```typescript
// ✅ GOOD - Predictable, organized
const storagePath = `${userId}/${vaultId}/${itemId}.enc`

// ❌ BAD - Random, hard to manage
const storagePath = `${randomString()}.enc`
```

### 2. Always Use .enc Extension
```typescript
// ✅ GOOD - Clearly indicates encrypted
const storagePath = `${userId}/${vaultId}/${itemId}.enc`

// ❌ BAD - Looks like plain file
const storagePath = `${userId}/${vaultId}/${itemId}.pdf`
```

### 3. Store Original Filename Encrypted
```typescript
// Database
{
  storage_path: "user-id/vault-id/item-id.enc",  // System path
  file_name_encrypted: encrypt("My Secret Document.pdf")  // User's filename
}

// When displaying to user
const originalName = decrypt(item.file_name_encrypted)
// Shows: "My Secret Document.pdf"
```

### 4. Use RLS for Access Control
```sql
-- Enforce access at database level
CREATE POLICY "Users can only access own items"
ON vault_items FOR SELECT
USING (auth.uid() = user_id);

-- Enforce access at storage level
CREATE POLICY "Users can only access own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vault-items' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🔍 Attack Scenarios

### Scenario 1: Database Breach
**Attacker gets:** Database dump with all records

**What they see:**
```json
{
  "storage_path": "550e8400-e29b-41d4-a716-446655440000/7c9e6679/a1b2c3d4.enc",
  "title_encrypted": "8f3k2j9d8s7a6g5h4j3k2l1m...",
  "file_name_encrypted": "9g4l3k0e9t8b7c6d5e4f3g2h..."
}
```

**Can they access files?** ❌ No
- Don't have Supabase credentials
- Don't have storage access tokens
- RLS would block even if they did

**Can they decrypt?** ❌ No
- Don't have user's private key
- Files are encrypted
- Metadata is encrypted

**Damage:** ⚠️ Minimal - They know UUIDs exist, but cannot access or decrypt anything

---

### Scenario 2: Storage Breach
**Attacker gets:** Direct access to storage bucket

**What they see:**
```
vault-items/
├── 550e8400-e29b-41d4-a716-446655440000/
│   └── 7c9e6679-7425-40de-944b-e07fc1f90ae7/
│       └── a1b2c3d4-e5f6-7890-abcd-ef1234567890.enc
```

**Can they read files?** ❌ No
- Files are encrypted
- Don't have private keys

**Can they see filenames?** ❌ No
- Only see UUIDs
- Original filenames encrypted in database

**Damage:** ⚠️ Minimal - They see encrypted blobs with UUID names

---

### Scenario 3: Both Database + Storage Breach
**Attacker gets:** Both database and storage access

**What they can do:**
- ✅ Match storage paths to database records
- ✅ Download encrypted files
- ❌ Cannot decrypt files (no private keys)
- ❌ Cannot see original filenames (encrypted)
- ❌ Cannot see titles (encrypted)

**Damage:** ⚠️ Low - They have encrypted data but cannot decrypt it

---

## ✅ Final Recommendation

### Keep Storage Paths READABLE

**Schema:**
```sql
CREATE TABLE vault_items (
  -- ❌ DON'T ENCRYPT
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'vault-items',
  thumbnail_path TEXT,
  
  -- ✅ DO ENCRYPT
  title_encrypted TEXT NOT NULL,
  file_name_encrypted TEXT,
  content_encrypted TEXT,
  
  CONSTRAINT vault_items_storage_path_unique UNIQUE (storage_path)
);
```

**Benefits:**
- ✅ Fast database queries
- ✅ Simple implementation
- ✅ Easy debugging
- ✅ Works with Supabase Storage
- ✅ Supports inheritance
- ✅ No sensitive data exposed
- ✅ Protected by RLS
- ✅ Files are encrypted anyway

**Security:**
- ✅ Multiple protection layers
- ✅ RLS prevents unauthorized access
- ✅ Files encrypted with user's key
- ✅ Sensitive metadata encrypted
- ✅ No meaningful information in paths

---

## 📝 Summary

**Storage paths are system identifiers, not sensitive data.**

Like database IDs or API endpoints, they:
- Don't reveal content
- Don't reveal user information
- Are protected by access control (RLS)
- Should remain readable for functionality

**Encrypt the data, not the pointers to the data.**

**Decision: Keep storage paths READABLE in database** ✅
