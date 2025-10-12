# Database Quick Reference Guide

## Table Overview

| Table Name | Purpose | Key Encrypted Fields |
|------------|---------|---------------------|
| `users` | User profiles & public keys | None (public key is plain text) |
| `private_key_recovery` | Encrypted private key backups | `encrypted_private_key` |
| `vaults` | Password containers | `name_encrypted`, `description_encrypted` |
| `vault_items` | Password entries | `title_encrypted`, `username_encrypted`, `password_encrypted`, `url_encrypted`, `notes_encrypted`, `custom_fields_encrypted` |
| `inheritance_plans` | Death/inactivity plans | `instructions_encrypted` |
| `beneficiaries` | Inheritance recipients | `full_name_encrypted`, `email_encrypted`, `phone_encrypted`, `relationship_encrypted` |
| `beneficiary_vault_access` | Granular access control | `reencrypted_key` |
| `user_activity` | Activity tracking | None |
| `inheritance_triggers` | Plan execution logs | None |
| `shared_vaults` | Live vault sharing | `shared_key_encrypted` |
| `audit_logs` | Security audit trail | None |
| `security_alerts` | Security notifications | None |
| `password_breach_checks` | Breach monitoring | None |
| `two_factor_auth` | 2FA settings | `secret_encrypted`, `backup_codes_encrypted` |
| `user_sessions` | Session management | None |

---

## Common Queries

### Get User's Vaults with Item Count

```sql
SELECT 
  v.*,
  COUNT(vi.id) as item_count
FROM vaults v
LEFT JOIN vault_items vi ON vi.vault_id = v.id
WHERE v.user_id = auth.uid()
GROUP BY v.id
ORDER BY v.sort_order, v.created_at DESC;
```

### Get Vault Items by Vault

```sql
SELECT *
FROM vault_items
WHERE vault_id = $1
  AND user_id = auth.uid()
ORDER BY created_at DESC;
```

### Get User's Active Inheritance Plans

```sql
SELECT 
  ip.*,
  COUNT(b.id) as beneficiary_count
FROM inheritance_plans ip
LEFT JOIN beneficiaries b ON b.inheritance_plan_id = ip.id
WHERE ip.user_id = auth.uid()
  AND ip.is_active = true
GROUP BY ip.id
ORDER BY ip.created_at DESC;
```

### Get Beneficiaries for a Plan

```sql
SELECT *
FROM beneficiaries
WHERE inheritance_plan_id = $1
  AND user_id = auth.uid()
  AND is_active = true
ORDER BY created_at;
```

### Get Shared Vaults (Received)

```sql
SELECT 
  v.*,
  sv.can_view,
  sv.can_edit,
  sv.can_delete,
  u.full_name as owner_name
FROM shared_vaults sv
JOIN vaults v ON v.id = sv.vault_id
JOIN users u ON u.id = sv.owner_id
WHERE sv.shared_with_user_id = auth.uid()
  AND sv.is_active = true
  AND sv.accepted = true
ORDER BY sv.shared_at DESC;
```

### Get Recent Activity

```sql
SELECT *
FROM user_activity
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 50;
```

### Get Security Alerts

```sql
SELECT *
FROM security_alerts
WHERE user_id = auth.uid()
  AND is_resolved = false
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END,
  created_at DESC;
```

### Check Password Breaches

```sql
SELECT 
  vi.id,
  vi.title_encrypted,
  pbc.is_breached,
  pbc.breach_count,
  pbc.checked_at
FROM vault_items vi
LEFT JOIN password_breach_checks pbc ON pbc.vault_item_id = vi.id
WHERE vi.user_id = auth.uid()
  AND vi.item_type = 'password'
  AND (pbc.is_breached = true OR pbc.id IS NULL)
ORDER BY pbc.breach_count DESC NULLS LAST;
```

### Get Active Sessions

```sql
SELECT *
FROM user_sessions
WHERE user_id = auth.uid()
  AND is_active = true
  AND expires_at > NOW()
ORDER BY last_activity DESC;
```

---

## Common Operations

### Create Vault

```typescript
const { data, error } = await supabase
  .from('vaults')
  .insert({
    user_id: userId,
    name_encrypted: encryptedName,
    description_encrypted: encryptedDescription,
    icon: 'lock',
    color: '#3B82F6',
    is_favorite: false,
    sort_order: 0,
  })
  .select()
  .single();
```

### Create Vault Item

```typescript
const { data, error } = await supabase
  .from('vault_items')
  .insert({
    vault_id: vaultId,
    user_id: userId,
    item_type: 'password',
    title_encrypted: encryptedTitle,
    username_encrypted: encryptedUsername,
    password_encrypted: encryptedPassword,
    url_encrypted: encryptedUrl,
    notes_encrypted: encryptedNotes,
    tags: ['work', 'important'],
    password_strength: 85,
  })
  .select()
  .single();
```

### Share Vault

```typescript
const { data, error } = await supabase
  .from('shared_vaults')
  .insert({
    vault_id: vaultId,
    owner_id: ownerId,
    shared_with_user_id: recipientId,
    can_view: true,
    can_edit: false,
    can_delete: false,
    shared_key_encrypted: encryptedVaultKey,
  })
  .select()
  .single();
```

### Log Activity

```typescript
const { data, error } = await supabase
  .from('user_activity')
  .insert({
    user_id: userId,
    activity_type: 'vault_access',
    ip_address: ipAddress,
    user_agent: userAgent,
    metadata: { vault_id: vaultId },
  });
```

### Create Audit Log

```typescript
const { data, error } = await supabase
  .rpc('create_audit_log', {
    p_user_id: userId,
    p_action: 'update',
    p_resource_type: 'vault_item',
    p_resource_id: itemId,
    p_old_values: oldValues,
    p_new_values: newValues,
    p_risk_level: 'low',
  });
```

---

## Encryption Helpers

### Client-Side Encryption Example

```typescript
import { generateKeyPair, encrypt, decrypt } from './crypto';

// Generate key pair on registration
const { publicKey, privateKey } = await generateKeyPair();

// Store public key in database
await supabase
  .from('users')
  .update({ public_key: publicKey })
  .eq('id', userId);

// Show private key to user (they must save it!)
displayPrivateKeyToUser(privateKey);

// Encrypt data before storing
const encryptedData = await encrypt(plaintext, publicKey);

// Decrypt data after retrieving
const plaintext = await decrypt(encryptedData, privateKey);
```

### Recovery Key Setup

```typescript
// Encrypt private key with recovery passphrase
const recoveryPassphrase = await promptUserForPassphrase();
const encryptedPrivateKey = await encryptWithPassphrase(
  privateKey,
  recoveryPassphrase
);

// Store encrypted backup
await supabase
  .from('private_key_recovery')
  .insert({
    user_id: userId,
    encrypted_private_key: encryptedPrivateKey,
    recovery_method: 'passphrase',
    recovery_hint: 'Your mother\'s maiden name',
  });
```

---

## Inheritance Flow

### 1. Create Inheritance Plan

```typescript
const { data: plan } = await supabase
  .from('inheritance_plans')
  .insert({
    user_id: userId,
    plan_name: 'Family Inheritance',
    plan_type: 'partial_access',
    activation_method: 'inactivity',
    inactivity_days: 90,
    instructions_encrypted: encryptedInstructions,
  })
  .select()
  .single();
```

### 2. Add Beneficiaries

```typescript
const { data: beneficiary } = await supabase
  .from('beneficiaries')
  .insert({
    user_id: userId,
    inheritance_plan_id: plan.id,
    full_name_encrypted: encryptedName,
    email_encrypted: encryptedEmail,
    access_level: 'specific_vaults',
    beneficiary_public_key: beneficiaryPublicKey,
    notify_on_activation: true,
    notification_delay_days: 7,
  })
  .select()
  .single();
```

### 3. Grant Vault Access

```typescript
await supabase
  .from('beneficiary_vault_access')
  .insert({
    beneficiary_id: beneficiary.id,
    vault_id: vaultId,
    can_view: true,
    can_export: true,
    can_edit: false,
  });
```

### 4. Check for Inactivity (Scheduled Job)

```typescript
// Run daily
await supabase.rpc('check_user_inactivity');
```

### 5. Handle Triggered Plan

```typescript
// When plan is triggered, re-encrypt data for beneficiaries
const triggers = await supabase
  .from('inheritance_triggers')
  .select('*, inheritance_plans(*), beneficiaries(*)')
  .eq('status', 'pending');

for (const trigger of triggers.data) {
  // Get beneficiary's public key
  const beneficiary = trigger.beneficiaries[0];
  
  // Re-encrypt vault items
  const items = await getVaultItems(trigger.user_id);
  for (const item of items) {
    const decrypted = await decrypt(item.password_encrypted, userPrivateKey);
    const reencrypted = await encrypt(decrypted, beneficiary.beneficiary_public_key);
    
    // Store re-encrypted key
    await supabase
      .from('beneficiary_vault_access')
      .update({ reencrypted_key: reencrypted })
      .eq('beneficiary_id', beneficiary.id)
      .eq('vault_item_id', item.id);
  }
  
  // Update trigger status
  await supabase
    .from('inheritance_triggers')
    .update({ status: 'completed', completed_at: new Date() })
    .eq('id', trigger.id);
}
```

---

## Security Best Practices

### 1. Always Encrypt Sensitive Data

```typescript
// ❌ BAD - Storing plain text
await supabase.from('vault_items').insert({
  title: 'My Password', // Plain text!
  password: 'secret123', // Plain text!
});

// ✅ GOOD - Encrypting before storage
await supabase.from('vault_items').insert({
  title_encrypted: await encrypt('My Password', publicKey),
  password_encrypted: await encrypt('secret123', publicKey),
});
```

### 2. Log Security Events

```typescript
// Log all sensitive operations
await logActivity('password_change', {
  item_id: itemId,
  ip_address: req.ip,
});

await createAuditLog({
  action: 'delete',
  resource_type: 'vault_item',
  resource_id: itemId,
  risk_level: 'high',
});
```

### 3. Validate Permissions

```typescript
// Always check ownership before operations
const { data: vault } = await supabase
  .from('vaults')
  .select('user_id')
  .eq('id', vaultId)
  .single();

if (vault.user_id !== currentUserId) {
  throw new Error('Unauthorized');
}
```

### 4. Rate Limit Recovery Attempts

```typescript
// Check failed attempts before allowing recovery
const { data: recovery } = await supabase
  .from('private_key_recovery')
  .select('failed_attempts, locked_until')
  .eq('user_id', userId)
  .single();

if (recovery.locked_until && recovery.locked_until > new Date()) {
  throw new Error('Account locked due to too many failed attempts');
}

if (recovery.failed_attempts >= 5) {
  // Lock account for 1 hour
  await supabase
    .from('private_key_recovery')
    .update({ locked_until: new Date(Date.now() + 3600000) })
    .eq('user_id', userId);
  
  throw new Error('Too many failed attempts');
}
```

---

## Performance Tips

### 1. Use Indexes

All foreign keys and frequently queried fields are already indexed.

### 2. Paginate Large Results

```typescript
const pageSize = 50;
const page = 1;

const { data, error } = await supabase
  .from('vault_items')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range((page - 1) * pageSize, page * pageSize - 1);
```

### 3. Use Select to Limit Fields

```typescript
// Only fetch needed fields
const { data } = await supabase
  .from('vaults')
  .select('id, name_encrypted, icon, color')
  .eq('user_id', userId);
```

### 4. Batch Operations

```typescript
// Insert multiple items at once
const items = [/* ... */];
const { data, error } = await supabase
  .from('vault_items')
  .insert(items);
```

---

## Maintenance Tasks

### Daily

```sql
-- Check for inheritance triggers
SELECT * FROM check_user_inactivity();

-- Clean expired sessions
DELETE FROM user_sessions
WHERE expires_at < NOW();

-- Clean expired recovery keys
DELETE FROM private_key_recovery
WHERE expires_at IS NOT NULL AND expires_at < NOW();
```

### Weekly

```sql
-- Archive old audit logs (older than 90 days)
-- Move to separate archive table or export

-- Check for weak passwords
SELECT COUNT(*)
FROM vault_items
WHERE password_strength < 50;

-- Review security alerts
SELECT alert_type, COUNT(*)
FROM security_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY alert_type;
```

### Monthly

```sql
-- Review inactive users
SELECT id, email, last_login
FROM users
WHERE last_login < NOW() - INTERVAL '30 days'
  AND is_active = true;

-- Check inheritance plan health
SELECT 
  activation_method,
  COUNT(*) as plan_count,
  COUNT(CASE WHEN is_triggered THEN 1 END) as triggered_count
FROM inheritance_plans
WHERE is_active = true
GROUP BY activation_method;
```

---

## Troubleshooting

### User Can't Access Vault

1. Check vault ownership:
```sql
SELECT user_id FROM vaults WHERE id = $1;
```

2. Check shared access:
```sql
SELECT * FROM shared_vaults 
WHERE vault_id = $1 AND shared_with_user_id = $2;
```

3. Check RLS policies are enabled:
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'vaults';
```

### Inheritance Not Triggering

1. Check plan is active:
```sql
SELECT * FROM inheritance_plans 
WHERE user_id = $1 AND is_active = true;
```

2. Check last activity:
```sql
SELECT MAX(created_at) FROM user_activity WHERE user_id = $1;
```

3. Manually run inactivity check:
```sql
SELECT * FROM check_user_inactivity();
```

### Recovery Key Not Working

1. Check recovery record exists:
```sql
SELECT * FROM private_key_recovery WHERE user_id = $1;
```

2. Check if locked:
```sql
SELECT failed_attempts, locked_until 
FROM private_key_recovery 
WHERE user_id = $1;
```

3. Reset failed attempts (admin only):
```sql
UPDATE private_key_recovery 
SET failed_attempts = 0, locked_until = NULL 
WHERE user_id = $1;
```

---

## API Endpoints to Implement

### Vaults
- `GET /api/vaults` - List user's vaults
- `POST /api/vaults` - Create vault
- `GET /api/vaults/:id` - Get vault details
- `PUT /api/vaults/:id` - Update vault
- `DELETE /api/vaults/:id` - Delete vault

### Vault Items
- `GET /api/vaults/:id/items` - List vault items
- `POST /api/vaults/:id/items` - Create item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Inheritance
- `GET /api/inheritance/plans` - List plans
- `POST /api/inheritance/plans` - Create plan
- `PUT /api/inheritance/plans/:id` - Update plan
- `DELETE /api/inheritance/plans/:id` - Delete plan
- `POST /api/inheritance/plans/:id/beneficiaries` - Add beneficiary
- `PUT /api/inheritance/beneficiaries/:id` - Update beneficiary
- `DELETE /api/inheritance/beneficiaries/:id` - Remove beneficiary

### Sharing
- `POST /api/vaults/:id/share` - Share vault
- `GET /api/shared/vaults` - List shared vaults
- `PUT /api/shared/:id/accept` - Accept share
- `DELETE /api/shared/:id` - Revoke share

### Security
- `GET /api/security/alerts` - Get security alerts
- `PUT /api/security/alerts/:id/resolve` - Resolve alert
- `GET /api/security/sessions` - List active sessions
- `DELETE /api/security/sessions/:id` - Revoke session
- `POST /api/security/breach-check` - Check password breaches

### Recovery
- `POST /api/recovery/setup` - Setup recovery method
- `POST /api/recovery/verify` - Verify recovery
- `POST /api/recovery/recover` - Recover private key

---

## Testing Checklist

- [ ] User registration with key generation
- [ ] Vault creation and encryption
- [ ] Item creation with all types
- [ ] Vault sharing and permissions
- [ ] Inheritance plan creation
- [ ] Beneficiary management
- [ ] Inactivity detection
- [ ] Inheritance trigger execution
- [ ] Recovery key setup
- [ ] Recovery key usage
- [ ] 2FA setup and verification
- [ ] Session management
- [ ] Audit logging
- [ ] Security alerts
- [ ] Password breach checking
- [ ] RLS policy enforcement
- [ ] Performance under load

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **Have I Been Pwned API**: https://haveibeenpwned.com/API/v3

---

This quick reference should help you get started with the database schema. For detailed information, see `DATABASE_SCHEMA.md`.
