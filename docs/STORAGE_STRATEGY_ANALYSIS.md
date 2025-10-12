# Storage Strategy Analysis for Password Manager

## 📊 Current Project Analysis

### Existing Item Types

Based on the codebase analysis, the project currently supports **8 item types**:

```typescript
type VaultItemType = 
  | 'password'    // Login credentials
  | 'note'        // Text notes
  | 'crypto'      // Cryptocurrency wallets
  | 'bank'        // Bank account details
  | 'document'    // Files/documents
  | 'video'       // Video files
  | 'image'       // Image files
  | 'other'       // Miscellaneous
```

### Current Data Structure

**Frontend Types (`types/vault.ts`):**
```typescript
interface VaultItem {
  id: string
  title: string
  type: VaultItemType
  metadata: VaultItemMetadata
  isEncrypted: boolean
  encryptedFields?: string[]
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// Metadata varies by type
interface PasswordMetadata {
  username?: string
  password?: string
  url?: string
}

interface DocumentMetadata {
  fileName?: string
  fileSize?: number
  fileType?: string
}

interface MediaMetadata {
  fileName?: string
  fileSize?: number
  dimensions?: { width: number; height: number }
  duration?: number  // For videos
}
```

---

## 🎯 Storage Strategy Recommendation

### Hybrid Approach: Database + Supabase Storage

Based on the analysis, here's the optimal storage strategy:

## Strategy Overview

| Item Type | Metadata (DB) | Content Storage | Reasoning |
|-----------|---------------|-----------------|-----------|
| **password** | ✅ Database | ✅ Database | Small text data, frequent access |
| **note** | ✅ Database | ✅ Database | Small text data, frequent access |
| **crypto** | ✅ Database | ✅ Database | Small text data, high security |
| **bank** | ✅ Database | ✅ Database | Small text data, frequent access |
| **document** | ✅ Database | ⭐ **Storage** | Large files, infrequent access |
| **video** | ✅ Database | ⭐ **Storage** | Large files, streaming |
| **image** | ✅ Database | ⭐ **Storage** | Large files, preview needed |
| **other** | ✅ Database | 🔀 **Hybrid** | Depends on size |

---

## 📋 Detailed Storage Strategy

### 1. Text-Based Items (Store in Database)

**Items:** `password`, `note`, `crypto`, `bank`

**Storage Method:**
- Encrypt entire content with user's public key
- Store encrypted blob in database
- Fast retrieval and search

**Database Structure:**
```typescript
vault_items {
  id: uuid
  vault_id: uuid
  user_id: uuid
  item_type: 'password' | 'note' | 'crypto' | 'bank'
  
  // Encrypted metadata
  title_encrypted: text
  
  // Encrypted content (JSON blob)
  content_encrypted: text  // Stores all metadata fields
  
  // Non-encrypted metadata
  tags: text[]
  is_favorite: boolean
  password_strength: integer  // For passwords only
  
  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
  last_accessed: timestamptz
}
```

**Encrypted Content Example (password):**
```json
{
  "username": "encrypted-username",
  "password": "encrypted-password",
  "url": "encrypted-url",
  "notes": "encrypted-notes"
}
```

**Benefits:**
- ✅ Fast queries and filtering
- ✅ No additional storage costs
- ✅ Simple implementation
- ✅ Works well for small data (<10KB)

---

### 2. File-Based Items (Store in Supabase Storage)

**Items:** `document`, `video`, `image`

**Storage Method:**
- Store encrypted file in Supabase Storage bucket
- Store metadata and reference in database
- Lazy load files on demand

**Database Structure:**
```typescript
vault_items {
  id: uuid
  vault_id: uuid
  user_id: uuid
  item_type: 'document' | 'video' | 'image'
  
  // Encrypted metadata
  title_encrypted: text
  file_name_encrypted: text
  
  // Storage reference
  storage_path: text  // 'user_id/vault_id/item_id.enc'
  storage_bucket: text  // 'vault-items'
  file_size: bigint
  file_type: text  // MIME type
  
  // Media-specific metadata
  dimensions: jsonb  // For images/videos: {width, height}
  duration: integer  // For videos (seconds)
  thumbnail_path: text  // Optional thumbnail in storage
  
  // Non-encrypted metadata
  tags: text[]
  is_favorite: boolean
  
  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
  last_accessed: timestamptz
}
```

**Storage Structure:**
```
vault-items/
├── user-id-1/
│   ├── vault-id-1/
│   │   ├── item-id-1.enc           # Encrypted document
│   │   ├── item-id-1-thumb.enc     # Encrypted thumbnail (optional)
│   │   ├── item-id-2.enc           # Encrypted image
│   │   └── item-id-3.enc           # Encrypted video
│   └── vault-id-2/
│       └── item-id-4.enc
└── user-id-2/
    └── ...
```

**Benefits:**
- ✅ Handles large files efficiently
- ✅ Supports streaming for videos
- ✅ Cost-effective for large files
- ✅ Easy backup and CDN integration
- ✅ Thumbnail generation possible

---

## 🔧 Implementation Details

### Updated Database Schema

```sql
-- Update vault_items table to support both strategies
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Item type
  item_type vault_item_type NOT NULL,
  
  -- Encrypted metadata (always in DB)
  title_encrypted TEXT NOT NULL,
  
  -- Content storage strategy
  storage_type TEXT NOT NULL CHECK (storage_type IN ('database', 'storage')),
  
  -- For database storage (text-based items)
  content_encrypted TEXT,  -- JSON blob with all fields
  
  -- For file storage (file-based items)
  storage_path TEXT,
  storage_bucket TEXT DEFAULT 'vault-items',
  file_size BIGINT,
  file_type TEXT,  -- MIME type
  file_name_encrypted TEXT,
  
  -- Media-specific metadata
  dimensions JSONB,  -- {width: number, height: number}
  duration INTEGER,  -- For videos (seconds)
  thumbnail_path TEXT,  -- Optional thumbnail
  
  -- Non-encrypted metadata
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  
  -- Security
  password_strength INTEGER CHECK (password_strength BETWEEN 0 AND 100),
  password_last_changed TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT vault_items_password_strength_check CHECK (
    password_strength IS NULL OR (password_strength >= 0 AND password_strength <= 100)
  ),
  CONSTRAINT vault_items_storage_check CHECK (
    (storage_type = 'database' AND content_encrypted IS NOT NULL) OR
    (storage_type = 'storage' AND storage_path IS NOT NULL)
  ),
  CONSTRAINT vault_items_storage_path_unique UNIQUE (storage_path)
);

-- Indexes
CREATE INDEX idx_vault_items_storage_type ON public.vault_items(storage_type);
CREATE INDEX idx_vault_items_file_type ON public.vault_items(file_type);
```

---

## 💻 Code Implementation

### 1. Create Text-Based Item (Database Storage)

```typescript
async function createTextItem(
  vaultId: string,
  itemData: {
    type: 'password' | 'note' | 'crypto' | 'bank'
    title: string
    metadata: Record<string, any>
  }
) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Not authenticated')

  // 1. Encrypt title
  const titleEncrypted = await encrypt(itemData.title, userPublicKey)

  // 2. Encrypt content (all metadata fields)
  const contentEncrypted = await encrypt(
    JSON.stringify(itemData.metadata),
    userPublicKey
  )

  // 3. Insert into database
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      vault_id: vaultId,
      user_id: userId,
      item_type: itemData.type,
      storage_type: 'database',
      title_encrypted: titleEncrypted,
      content_encrypted: contentEncrypted,
      password_strength: itemData.type === 'password' 
        ? calculatePasswordStrength(itemData.metadata.password) 
        : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 2. Create File-Based Item (Storage)

```typescript
async function createFileItem(
  vaultId: string,
  itemData: {
    type: 'document' | 'video' | 'image'
    title: string
    file: File | Blob
    fileName: string
  }
) {
  const userId = (await supabase.auth.getUser()).data.user?.id
  if (!userId) throw new Error('Not authenticated')

  const itemId = crypto.randomUUID()
  const storagePath = `${userId}/${vaultId}/${itemId}.enc`

  // 1. Encrypt file
  const encryptedFile = await encryptFile(itemData.file, userPublicKey)

  // 2. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('vault-items')
    .upload(storagePath, encryptedFile, {
      contentType: 'application/octet-stream',
      upsert: false,
    })

  if (uploadError) throw uploadError

  // 3. Generate thumbnail for images/videos (optional)
  let thumbnailPath: string | null = null
  if (itemData.type === 'image' || itemData.type === 'video') {
    const thumbnail = await generateThumbnail(itemData.file)
    const encryptedThumbnail = await encryptFile(thumbnail, userPublicKey)
    thumbnailPath = `${userId}/${vaultId}/${itemId}-thumb.enc`
    
    await supabase.storage
      .from('vault-items')
      .upload(thumbnailPath, encryptedThumbnail)
  }

  // 4. Get file metadata
  const fileSize = itemData.file.size
  const fileType = itemData.file.type
  let dimensions = null
  let duration = null

  if (itemData.type === 'image') {
    dimensions = await getImageDimensions(itemData.file)
  } else if (itemData.type === 'video') {
    const videoMeta = await getVideoMetadata(itemData.file)
    dimensions = videoMeta.dimensions
    duration = videoMeta.duration
  }

  // 5. Insert metadata into database
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      id: itemId,
      vault_id: vaultId,
      user_id: userId,
      item_type: itemData.type,
      storage_type: 'storage',
      title_encrypted: await encrypt(itemData.title, userPublicKey),
      file_name_encrypted: await encrypt(itemData.fileName, userPublicKey),
      storage_path: storagePath,
      storage_bucket: 'vault-items',
      file_size: fileSize,
      file_type: fileType,
      dimensions: dimensions,
      duration: duration,
      thumbnail_path: thumbnailPath,
    })
    .select()
    .single()

  if (error) {
    // Cleanup: delete uploaded files if database insert fails
    await supabase.storage.from('vault-items').remove([storagePath])
    if (thumbnailPath) {
      await supabase.storage.from('vault-items').remove([thumbnailPath])
    }
    throw error
  }

  return data
}
```

### 3. Read Item (Universal)

```typescript
async function getVaultItem(itemId: string) {
  // 1. Get metadata from database
  const { data: metadata, error: dbError } = await supabase
    .from('vault_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (dbError) throw dbError

  // 2. Decrypt title
  const title = await decrypt(metadata.title_encrypted, userPrivateKey)

  // 3. Get content based on storage type
  let content: any

  if (metadata.storage_type === 'database') {
    // Decrypt from database
    const decryptedContent = await decrypt(
      metadata.content_encrypted,
      userPrivateKey
    )
    content = JSON.parse(decryptedContent)
  } else {
    // Download from storage
    const { data: blob, error: storageError } = await supabase.storage
      .from(metadata.storage_bucket)
      .download(metadata.storage_path)

    if (storageError) throw storageError

    // Decrypt file
    const decryptedFile = await decryptFile(blob, userPrivateKey)
    
    content = {
      file: decryptedFile,
      fileName: await decrypt(metadata.file_name_encrypted, userPrivateKey),
      fileSize: metadata.file_size,
      fileType: metadata.file_type,
      dimensions: metadata.dimensions,
      duration: metadata.duration,
    }
  }

  // 4. Update last_accessed
  await supabase
    .from('vault_items')
    .update({ last_accessed: new Date().toISOString() })
    .eq('id', itemId)

  return {
    id: metadata.id,
    title,
    type: metadata.item_type,
    content,
    tags: metadata.tags,
    is_favorite: metadata.is_favorite,
    created_at: metadata.created_at,
    updated_at: metadata.updated_at,
  }
}
```

### 4. List Items with Thumbnails

```typescript
async function listVaultItems(vaultId: string) {
  // Get all items metadata
  const { data: items, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('vault_id', vaultId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Decrypt titles and load thumbnails
  const processedItems = await Promise.all(
    items.map(async (item) => {
      const title = await decrypt(item.title_encrypted, userPrivateKey)
      
      let thumbnail = null
      if (item.thumbnail_path) {
        // Load thumbnail for preview
        const { data: thumbBlob } = await supabase.storage
          .from(item.storage_bucket)
          .download(item.thumbnail_path)
        
        if (thumbBlob) {
          thumbnail = await decryptFile(thumbBlob, userPrivateKey)
        }
      }

      return {
        id: item.id,
        title,
        type: item.item_type,
        storage_type: item.storage_type,
        file_size: item.file_size,
        file_type: item.file_type,
        thumbnail,
        tags: item.tags,
        is_favorite: item.is_favorite,
        created_at: item.created_at,
      }
    })
  )

  return processedItems
}
```

---

## 📊 Storage Size Limits

### Database Storage (Text Items)

| Item Type | Typical Size | Max Recommended |
|-----------|--------------|-----------------|
| password | 500 bytes | 10 KB |
| note | 1-5 KB | 50 KB |
| crypto | 500 bytes | 10 KB |
| bank | 500 bytes | 10 KB |

**Total per user:** Unlimited (database scales well)

### File Storage (Supabase Storage)

| Item Type | Typical Size | Max Recommended |
|-----------|--------------|-----------------|
| document | 100 KB - 10 MB | 50 MB |
| image | 100 KB - 5 MB | 20 MB |
| video | 1 MB - 100 MB | 500 MB |

**Limits:**
- Single file: 5 GB (Supabase limit)
- Total per user: Set quota (e.g., 10 GB)
- Free tier: 1 GB total

---

## 💰 Cost Analysis

### Supabase Pricing (as of 2024)

**Database Storage:**
- Free: 500 MB
- Pro: 8 GB included, $0.125/GB after

**File Storage:**
- Free: 1 GB
- Pro: 100 GB included, $0.021/GB after

**Bandwidth:**
- Free: 2 GB
- Pro: 200 GB included, $0.09/GB after

### Cost Comparison (1000 users)

**Scenario 1: All Database (Text Only)**
- Average per user: 5 MB
- Total: 5 GB
- Cost: ~$0.63/month

**Scenario 2: Hybrid (Text + Files)**
- Database: 2 MB/user = 2 GB
- Storage: 50 MB/user = 50 GB
- Total cost: ~$1.30/month

**Recommendation:** Hybrid approach is cost-effective and scalable

---

## 🔐 Security Considerations

### Encryption Strategy

**Text Items (Database):**
```typescript
// Encrypt entire content as JSON
const content = {
  username: 'user@example.com',
  password: 'secret123',
  url: 'https://example.com'
}
const encrypted = await encrypt(JSON.stringify(content), publicKey)
```

**File Items (Storage):**
```typescript
// Encrypt file in chunks for large files
const encryptedFile = await encryptFileChunked(file, publicKey, {
  chunkSize: 1024 * 1024, // 1 MB chunks
  algorithm: 'AES-256-GCM'
})
```

### Access Control

**Storage Policies:**
```sql
-- Users can only access their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vault-items' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Heirs can access inherited files
CREATE POLICY "Heirs can read inherited files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vault-items' AND
  EXISTS (
    SELECT 1 FROM vault_items vi
    JOIN heir_vault_access hva ON hva.vault_item_id = vi.id
    JOIN heirs h ON h.id = hva.heir_id
    WHERE vi.storage_path = name
    AND h.heir_user_id = auth.uid()
    AND hva.can_view = true
  )
);
```

---

## 🚀 Migration Strategy

### Phase 1: Update Database Schema
1. Add new columns to `vault_items` table
2. Add `storage_type` field
3. Keep backward compatibility

### Phase 2: Implement Storage Logic
1. Create file upload/download functions
2. Implement encryption for files
3. Add thumbnail generation

### Phase 3: Update Frontend
1. Update `AddItem` component to handle files
2. Add file picker for documents/images/videos
3. Show thumbnails in list view
4. Implement file preview

### Phase 4: Migrate Existing Data
1. Identify items that should use storage
2. Migrate large items to storage
3. Update database records

---

## ✅ Recommendations

### For Your Project

**Use Database Storage For:**
- ✅ Passwords
- ✅ Notes
- ✅ Crypto wallets
- ✅ Bank accounts
- ✅ Any text data < 10 KB

**Use File Storage For:**
- ✅ Documents (PDF, DOCX, etc.)
- ✅ Images (JPG, PNG, etc.)
- ✅ Videos (MP4, MOV, etc.)
- ✅ Any files > 10 KB

### Implementation Priority

1. **High Priority:**
   - Implement hybrid storage in database schema
   - Add file upload for documents/images/videos
   - Implement encryption for both strategies

2. **Medium Priority:**
   - Add thumbnail generation
   - Implement file preview
   - Add progress indicators for uploads

3. **Low Priority:**
   - Video streaming
   - File compression
   - Advanced file management

---

## 📝 Summary

**Optimal Strategy: Hybrid Approach**

- **Text items** (password, note, crypto, bank) → **Database**
  - Fast, simple, cost-effective
  - Perfect for small, frequently accessed data

- **File items** (document, image, video) → **Supabase Storage**
  - Scalable, efficient for large files
  - Supports thumbnails and streaming
  - Cost-effective for large files

This hybrid approach gives you the best of both worlds: speed and simplicity for text data, scalability and efficiency for files.

**Ready to implement! 🚀**
