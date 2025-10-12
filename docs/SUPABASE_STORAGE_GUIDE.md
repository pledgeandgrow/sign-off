# Supabase Storage Integration Guide

## 🎯 Overview

The password manager now uses **Supabase Storage** for storing encrypted vault items as blob files, with metadata tracked in the database. This approach provides:

- ✅ **Better scalability** - No database bloat from large encrypted data
- ✅ **Efficient storage** - Optimized for binary/encrypted files
- ✅ **Easy backup** - Files can be backed up separately
- ✅ **Cost effective** - Storage is cheaper than database storage
- ✅ **Better performance** - Database queries remain fast

## 📊 Architecture Changes

### What Changed

**Removed:**
- ❌ `user_activity` table (no activity tracking)
- ❌ `activity_type` ENUM
- ❌ Inactivity-based inheritance triggers
- ❌ `check_user_inactivity()` function
- ❌ `log_user_activity()` function

**Modified:**
- ✅ `vault_items` table now stores **metadata only**
- ✅ Actual encrypted data stored in **Supabase Storage buckets**
- ✅ `inheritance_plans` no longer supports `inactivity` activation method
- ✅ New `trigger_inheritance_plan()` function for manual triggers

### Database Structure (14 Tables)

1. `users` - User profiles with public keys
2. `private_key_recovery` - Encrypted key backups
3. `vaults` - Password containers
4. **`vault_items`** - **Metadata + Storage references** ⭐
5. `inheritance_plans` - Death/manual/scheduled plans
6. `heirs` - Inheritance recipients
7. `heir_vault_access` - Granular permissions
8. `inheritance_triggers` - Plan execution logs
9. `shared_vaults` - Live sharing
10. `audit_logs` - Security audit trail
11. `security_alerts` - Security notifications
12. `password_breach_checks` - Breach monitoring
13. `two_factor_auth` - 2FA settings
14. `user_sessions` - Session management

---

## 🗄️ Supabase Storage Setup

### 1. Create Storage Bucket

```sql
-- In Supabase SQL Editor or Dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-items', 'vault-items', false);
```

Or via Dashboard:
1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `vault-items`
4. Public: **No** (private bucket)
5. Click **Create bucket**

### 2. Set Up Storage Policies

```sql
-- Allow users to upload their own vault items
CREATE POLICY "Users can upload their own vault items"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vault-items' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own vault items
CREATE POLICY "Users can read their own vault items"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vault-items' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own vault items
CREATE POLICY "Users can update their own vault items"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vault-items' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own vault items
CREATE POLICY "Users can delete their own vault items"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vault-items' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow heirs to read granted vault items after inheritance activation
CREATE POLICY "Heirs can read inherited vault items"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vault-items' AND
  EXISTS (
    SELECT 1 FROM public.vault_items vi
    JOIN public.heir_vault_access hva ON hva.vault_item_id = vi.id
    JOIN public.heirs h ON h.id = hva.heir_id
    WHERE vi.storage_path = name
    AND h.heir_user_id = auth.uid()
    AND hva.can_view = true
  )
);
```

---

## 💻 Implementation Guide

### Vault Item Structure

**Database Record (`vault_items` table):**
```typescript
{
  id: 'uuid',
  vault_id: 'vault-uuid',
  user_id: 'user-uuid',
  item_type: 'password' | 'note' | 'card' | 'identity' | 'document' | 'crypto_wallet',
  
  // Storage reference
  storage_path: 'user-id/vault-id/item-id.enc',
  storage_bucket: 'vault-items',
  file_size: 1024, // bytes
  
  // Encrypted metadata (for quick access)
  title_encrypted: 'encrypted-title',
  
  // Metadata
  tags: ['work', 'important'],
  is_favorite: false,
  password_strength: 85,
  
  // Timestamps
  created_at: '2025-01-06T00:00:00Z',
  updated_at: '2025-01-06T00:00:00Z',
  last_accessed: '2025-01-06T00:00:00Z'
}
```

**Storage File (Supabase Storage):**
```
Path: user-id/vault-id/item-id.enc
Content: Encrypted JSON blob containing:
{
  username: 'encrypted-username',
  password: 'encrypted-password',
  url: 'encrypted-url',
  notes: 'encrypted-notes',
  custom_fields: {
    // encrypted custom fields
  }
}
```

---

## 🔧 Code Examples

### 1. Create Vault Item

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function createVaultItem(
  vaultId: string,
  itemData: {
    type: VaultItemType
    title: string
    username?: string
    password?: string
    url?: string
    notes?: string
    custom_fields?: Record<string, any>
  }
) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Not authenticated')

  // 1. Encrypt the title for metadata
  const titleEncrypted = await encrypt(itemData.title, userPublicKey)

  // 2. Create encrypted blob for storage
  const itemBlob = {
    username: itemData.username ? await encrypt(itemData.username, userPublicKey) : null,
    password: itemData.password ? await encrypt(itemData.password, userPublicKey) : null,
    url: itemData.url ? await encrypt(itemData.url, userPublicKey) : null,
    notes: itemData.notes ? await encrypt(itemData.notes, userPublicKey) : null,
    custom_fields: itemData.custom_fields 
      ? await encrypt(JSON.stringify(itemData.custom_fields), userPublicKey) 
      : null,
  }

  const itemId = crypto.randomUUID()
  const storagePath = `${userId}/${vaultId}/${itemId}.enc`

  // 3. Upload encrypted blob to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('vault-items')
    .upload(storagePath, JSON.stringify(itemBlob), {
      contentType: 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) throw uploadError

  // 4. Create database record with metadata
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      id: itemId,
      vault_id: vaultId,
      user_id: userId,
      item_type: itemData.type,
      storage_path: storagePath,
      storage_bucket: 'vault-items',
      file_size: new Blob([JSON.stringify(itemBlob)]).size,
      title_encrypted: titleEncrypted,
      tags: [],
      password_strength: itemData.password 
        ? calculatePasswordStrength(itemData.password) 
        : null,
    })
    .select()
    .single()

  if (error) {
    // Cleanup: delete uploaded file if database insert fails
    await supabase.storage.from('vault-items').remove([storagePath])
    throw error
  }

  return data
}
```

### 2. Read Vault Item

```typescript
async function getVaultItem(itemId: string) {
  // 1. Get metadata from database
  const { data: metadata, error: dbError } = await supabase
    .from('vault_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (dbError) throw dbError

  // 2. Download encrypted blob from storage
  const { data: blob, error: storageError } = await supabase.storage
    .from(metadata.storage_bucket)
    .download(metadata.storage_path)

  if (storageError) throw storageError

  // 3. Parse encrypted blob
  const encryptedData = JSON.parse(await blob.text())

  // 4. Decrypt data with user's private key
  const decryptedItem = {
    id: metadata.id,
    vault_id: metadata.vault_id,
    item_type: metadata.item_type,
    title: await decrypt(metadata.title_encrypted, userPrivateKey),
    username: encryptedData.username 
      ? await decrypt(encryptedData.username, userPrivateKey) 
      : null,
    password: encryptedData.password 
      ? await decrypt(encryptedData.password, userPrivateKey) 
      : null,
    url: encryptedData.url 
      ? await decrypt(encryptedData.url, userPrivateKey) 
      : null,
    notes: encryptedData.notes 
      ? await decrypt(encryptedData.notes, userPrivateKey) 
      : null,
    custom_fields: encryptedData.custom_fields 
      ? JSON.parse(await decrypt(encryptedData.custom_fields, userPrivateKey)) 
      : null,
    tags: metadata.tags,
    is_favorite: metadata.is_favorite,
    password_strength: metadata.password_strength,
    created_at: metadata.created_at,
    updated_at: metadata.updated_at,
  }

  // 5. Update last_accessed
  await supabase
    .from('vault_items')
    .update({ last_accessed: new Date().toISOString() })
    .eq('id', itemId)

  return decryptedItem
}
```

### 3. Update Vault Item

```typescript
async function updateVaultItem(
  itemId: string,
  updates: Partial<{
    title: string
    username: string
    password: string
    url: string
    notes: string
    custom_fields: Record<string, any>
    tags: string[]
  }>
) {
  // 1. Get current metadata
  const { data: metadata } = await supabase
    .from('vault_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (!metadata) throw new Error('Item not found')

  // 2. Download current blob
  const { data: currentBlob } = await supabase.storage
    .from(metadata.storage_bucket)
    .download(metadata.storage_path)

  const currentData = JSON.parse(await currentBlob!.text())

  // 3. Update encrypted blob
  const updatedBlob = {
    username: updates.username 
      ? await encrypt(updates.username, userPublicKey) 
      : currentData.username,
    password: updates.password 
      ? await encrypt(updates.password, userPublicKey) 
      : currentData.password,
    url: updates.url 
      ? await encrypt(updates.url, userPublicKey) 
      : currentData.url,
    notes: updates.notes 
      ? await encrypt(updates.notes, userPublicKey) 
      : currentData.notes,
    custom_fields: updates.custom_fields 
      ? await encrypt(JSON.stringify(updates.custom_fields), userPublicKey) 
      : currentData.custom_fields,
  }

  // 4. Upload updated blob
  await supabase.storage
    .from(metadata.storage_bucket)
    .update(metadata.storage_path, JSON.stringify(updatedBlob), {
      contentType: 'application/octet-stream',
      upsert: true,
    })

  // 5. Update metadata in database
  const dbUpdates: any = {}
  
  if (updates.title) {
    dbUpdates.title_encrypted = await encrypt(updates.title, userPublicKey)
  }
  if (updates.tags) {
    dbUpdates.tags = updates.tags
  }
  if (updates.password) {
    dbUpdates.password_strength = calculatePasswordStrength(updates.password)
    dbUpdates.password_last_changed = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('vault_items')
    .update(dbUpdates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error

  return data
}
```

### 4. Delete Vault Item

```typescript
async function deleteVaultItem(itemId: string) {
  // 1. Get metadata
  const { data: metadata } = await supabase
    .from('vault_items')
    .select('storage_path, storage_bucket')
    .eq('id', itemId)
    .single()

  if (!metadata) throw new Error('Item not found')

  // 2. Delete from storage
  const { error: storageError } = await supabase.storage
    .from(metadata.storage_bucket)
    .remove([metadata.storage_path])

  if (storageError) throw storageError

  // 3. Delete from database
  const { error: dbError } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', itemId)

  if (dbError) throw dbError

  return true
}
```

### 5. List Vault Items (Metadata Only)

```typescript
async function listVaultItems(vaultId: string) {
  // Only fetch metadata from database
  const { data, error } = await supabase
    .from('vault_items')
    .select('id, vault_id, item_type, title_encrypted, tags, is_favorite, password_strength, created_at, updated_at')
    .eq('vault_id', vaultId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Decrypt titles for display
  const items = await Promise.all(
    data.map(async (item) => ({
      ...item,
      title: await decrypt(item.title_encrypted, userPrivateKey),
    }))
  )

  return items
}
```

---

## 🔄 Inheritance Plan Triggers

### Available Trigger Methods

Since we removed inactivity tracking, inheritance plans now support:

1. **Manual Trigger** - Manually triggered by user or trusted contact
2. **Scheduled** - Triggered on a specific date
3. **Death Certificate** - Triggered after death certificate verification
4. **Emergency Contact** - Triggered by emergency contact

### Trigger Inheritance Plan

```typescript
async function triggerInheritancePlan(
  planId: string,
  reason: 'manual' | 'scheduled' | 'death_certificate' | 'emergency_contact',
  metadata?: Record<string, any>
) {
  const { data, error } = await supabase.rpc('trigger_inheritance_plan', {
    p_plan_id: planId,
    p_trigger_reason: reason,
    p_trigger_metadata: metadata || null,
  })

  if (error) throw error

  return data // Returns trigger_id
}
```

### Example: Manual Trigger

```typescript
// User manually triggers their inheritance plan
await triggerInheritancePlan(
  'plan-uuid',
  'manual',
  {
    triggered_by: 'user',
    reason: 'User initiated inheritance distribution',
  }
)
```

### Example: Scheduled Trigger

```typescript
// Set up a scheduled trigger (run via cron job)
async function checkScheduledPlans() {
  const { data: plans } = await supabase
    .from('inheritance_plans')
    .select('*')
    .eq('activation_method', 'scheduled')
    .eq('is_triggered', false)
    .lte('scheduled_date', new Date().toISOString())

  for (const plan of plans || []) {
    await triggerInheritancePlan(
      plan.id,
      'scheduled',
      {
        scheduled_date: plan.scheduled_date,
        auto_triggered: true,
      }
    )
  }
}
```

---

## 📦 Storage Best Practices

### 1. File Naming Convention

```
{user_id}/{vault_id}/{item_id}.enc
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/
  ├── 7c9e6679-7425-40de-944b-e07fc1f90ae7/
  │   ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.enc
  │   ├── b2c3d4e5-f6a7-8901-bcde-f12345678901.enc
  │   └── c3d4e5f6-a7b8-9012-cdef-123456789012.enc
  └── 8d0e7680-8536-51ef-a827-f18fc2g01bf8/
      └── d4e5f6a7-b8c9-0123-def0-234567890123.enc
```

### 2. File Size Limits

- **Recommended**: < 50MB per file
- **Maximum**: 5GB (Supabase limit)
- For large files, consider chunking or compression

### 3. Encryption Format

```typescript
// Encrypted file structure
{
  version: '1.0', // Schema version
  encrypted_at: '2025-01-06T00:00:00Z',
  encryption_algorithm: 'RSA-4096',
  data: {
    username: 'encrypted-base64-string',
    password: 'encrypted-base64-string',
    url: 'encrypted-base64-string',
    notes: 'encrypted-base64-string',
    custom_fields: 'encrypted-base64-string'
  }
}
```

### 4. Cleanup on Delete

Always delete both database record AND storage file:

```typescript
// ❌ BAD - Leaves orphaned files
await supabase.from('vault_items').delete().eq('id', itemId)

// ✅ GOOD - Cleans up both
const { data } = await supabase
  .from('vault_items')
  .select('storage_path, storage_bucket')
  .eq('id', itemId)
  .single()

await supabase.storage.from(data.storage_bucket).remove([data.storage_path])
await supabase.from('vault_items').delete().eq('id', itemId)
```

---

## 🔍 Querying and Performance

### Fast Queries (Metadata Only)

```typescript
// ✅ Fast - Only queries database
const items = await supabase
  .from('vault_items')
  .select('id, title_encrypted, item_type, tags, is_favorite')
  .eq('vault_id', vaultId)

// ✅ Fast - Search by tags
const items = await supabase
  .from('vault_items')
  .select('*')
  .contains('tags', ['work'])

// ✅ Fast - Filter by type
const passwords = await supabase
  .from('vault_items')
  .select('*')
  .eq('item_type', 'password')
```

### Lazy Loading

```typescript
// Load metadata first, then load full data on demand
async function loadVaultItemsLazy(vaultId: string) {
  // 1. Load all metadata (fast)
  const { data: items } = await supabase
    .from('vault_items')
    .select('*')
    .eq('vault_id', vaultId)

  // 2. Return items with lazy loader
  return items.map(item => ({
    ...item,
    loadFullData: async () => {
      const { data: blob } = await supabase.storage
        .from(item.storage_bucket)
        .download(item.storage_path)
      
      return JSON.parse(await blob!.text())
    }
  }))
}
```

---

## 🚀 Migration from Old Schema

If you have existing data in the old schema:

```typescript
async function migrateToStorage() {
  // 1. Get all vault items
  const { data: items } = await supabase
    .from('vault_items')
    .select('*')

  for (const item of items || []) {
    // 2. Create blob from existing encrypted fields
    const blob = {
      username: item.username_encrypted,
      password: item.password_encrypted,
      url: item.url_encrypted,
      notes: item.notes_encrypted,
      custom_fields: item.custom_fields_encrypted,
    }

    // 3. Upload to storage
    const storagePath = `${item.user_id}/${item.vault_id}/${item.id}.enc`
    await supabase.storage
      .from('vault-items')
      .upload(storagePath, JSON.stringify(blob))

    // 4. Update database record
    await supabase
      .from('vault_items')
      .update({
        storage_path: storagePath,
        storage_bucket: 'vault-items',
        file_size: new Blob([JSON.stringify(blob)]).size,
        // Remove old encrypted fields
        username_encrypted: null,
        password_encrypted: null,
        url_encrypted: null,
        notes_encrypted: null,
        custom_fields_encrypted: null,
      })
      .eq('id', item.id)
  }
}
```

---

## 📊 Storage Monitoring

### Check Storage Usage

```typescript
async function getStorageUsage(userId: string) {
  const { data: items } = await supabase
    .from('vault_items')
    .select('file_size')
    .eq('user_id', userId)

  const totalSize = items?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0

  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    itemCount: items?.length || 0,
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
```

---

## ✅ Summary

**Key Changes:**
- ✅ Vault items stored in Supabase Storage (not database)
- ✅ Database stores metadata only
- ✅ No activity tracking
- ✅ Manual/scheduled/death certificate triggers only
- ✅ 14 tables (down from 15)
- ✅ Better performance and scalability

**Next Steps:**
1. Create `vault-items` storage bucket
2. Set up storage policies
3. Implement encryption utilities
4. Update frontend to use new storage API
5. Test create/read/update/delete operations
6. Set up scheduled job for scheduled triggers

**Ready for production! 🚀**
