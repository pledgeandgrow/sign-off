# Password Manager Database Schema Documentation

## Overview

This database schema is designed for a secure password manager with inheritance planning capabilities. The system uses **end-to-end encryption** where all sensitive data is encrypted using public/private key cryptography. Users maintain control of their private keys (similar to crypto wallets), and the database only stores encrypted data.

## Core Concepts

### Encryption Architecture

1. **Public Key Storage**: Each user's public key is stored in the database
2. **Private Key Management**: Users store their private keys locally (like a crypto wallet seed phrase)
3. **Private Key Recovery**: Optional encrypted backup of private keys with recovery methods
4. **Data Encryption**: All sensitive fields are encrypted before storage
5. **Key Sharing**: For inheritance, data is re-encrypted with beneficiary's public key

### Inheritance Planning

The system supports multiple inheritance scenarios:
- **Full Access**: Complete access to all vaults and items
- **Partial Access**: Access to specific vaults or items
- **View Only**: Read-only access to data
- **Destroy**: Automatic deletion of data

Inheritance can be triggered by:
- **Inactivity**: After X days of no activity
- **Death Certificate**: Manual verification
- **Scheduled**: At a specific date
- **Manual Trigger**: User-initiated

## Database Tables

### 1. Users Table (`public.users`)

Extended user profile with encryption keys.

**Key Fields:**
- `id`: UUID (references auth.users)
- `email`: User's email address
- `public_key`: Public key for encryption (plain text)
- `emergency_contact_email`: Emergency contact information
- `is_active`: Account status
- `last_login`: Last login timestamp

**Purpose:** Store user profiles and public keys for encryption.

---

### 2. Private Key Recovery (`public.private_key_recovery`)

Temporary storage for encrypted private key backups.

**Key Fields:**
- `user_id`: Reference to user
- `encrypted_private_key`: Private key encrypted with recovery passphrase
- `recovery_method`: Method type (passphrase, security_questions, backup_codes)
- `recovery_hint`: Non-sensitive hint
- `failed_attempts`: Failed recovery attempts counter
- `locked_until`: Lockout timestamp after too many failures
- `expires_at`: Optional expiration date

**Purpose:** Allow users to recover their private key if lost, using a recovery passphrase or other methods.

**Security Notes:**
- Private key is encrypted with user's recovery passphrase (not stored in DB)
- Failed attempts are tracked to prevent brute force
- Can be set to expire for additional security

---

### 3. Vaults Table (`public.vaults`)

Containers for organizing passwords and secrets.

**Key Fields:**
- `id`: Vault UUID
- `user_id`: Owner reference
- `name_encrypted`: Encrypted vault name
- `description_encrypted`: Encrypted description
- `icon`: Icon identifier (not encrypted)
- `color`: Color code (not encrypted)
- `is_shared`: Whether vault is shared
- `is_favorite`: Favorite flag
- `sort_order`: Display order

**Purpose:** Organize passwords into logical groups (e.g., "Work", "Personal", "Banking").

**Encryption:** Name and description are encrypted, but metadata like icon and color are not.

---

### 4. Vault Items (`public.vault_items`)

Individual password entries and secrets.

**Key Fields:**
- `id`: Item UUID
- `vault_id`: Parent vault reference
- `user_id`: Owner reference
- `item_type`: Type (password, note, card, identity, document, crypto_wallet)
- `title_encrypted`: Encrypted title
- `username_encrypted`: Encrypted username
- `password_encrypted`: Encrypted password
- `url_encrypted`: Encrypted URL
- `notes_encrypted`: Encrypted notes
- `custom_fields_encrypted`: Encrypted JSON for additional fields
- `tags`: Array of tags (not encrypted)
- `password_strength`: Password strength score (0-100)
- `password_last_changed`: When password was last changed
- `last_accessed`: Last access timestamp

**Purpose:** Store individual password entries with full encryption.

**Item Types:**
- `password`: Standard login credentials
- `note`: Secure notes
- `card`: Credit/debit card information
- `identity`: Personal identity information
- `document`: Encrypted documents
- `crypto_wallet`: Cryptocurrency wallet information

---

### 5. Inheritance Plans (`public.inheritance_plans`)

Define what happens to user's data after death.

**Key Fields:**
- `id`: Plan UUID
- `user_id`: Owner reference
- `plan_name`: Name of the plan
- `plan_type`: Type (full_access, partial_access, view_only, destroy)
- `activation_method`: How plan is triggered (inactivity, death_certificate, manual_trigger, scheduled)
- `inactivity_days`: Days of inactivity before activation
- `scheduled_date`: For scheduled activation
- `is_active`: Whether plan is active
- `is_triggered`: Whether plan has been triggered
- `instructions_encrypted`: Encrypted instructions for beneficiaries

**Purpose:** Define inheritance rules for user's data.

**Activation Methods:**
- `inactivity`: Triggered after X days of no activity
- `death_certificate`: Requires manual verification with death certificate
- `manual_trigger`: User or trusted contact manually triggers
- `scheduled`: Activates on a specific date

---

### 6. Beneficiaries (`public.beneficiaries`)

People who will receive access to vaults/items.

**Key Fields:**
- `id`: Beneficiary UUID
- `user_id`: Owner reference
- `inheritance_plan_id`: Associated plan
- `full_name_encrypted`: Encrypted name
- `email_encrypted`: Encrypted email
- `phone_encrypted`: Encrypted phone
- `relationship_encrypted`: Encrypted relationship description
- `access_level`: Access level (full, read_only, specific_vaults, specific_items)
- `beneficiary_user_id`: If beneficiary is also a user
- `beneficiary_public_key`: Public key for encryption
- `notify_on_activation`: Whether to notify on plan activation
- `notification_delay_days`: Delay before notifying
- `has_accepted`: Whether beneficiary accepted

**Purpose:** Define who receives access and how they're notified.

**Access Levels:**
- `full`: Complete access to all data
- `read_only`: Can view but not export or edit
- `specific_vaults`: Access to specific vaults only
- `specific_items`: Access to specific items only

---

### 7. Beneficiary Vault Access (`public.beneficiary_vault_access`)

Specific vault/item access grants for beneficiaries.

**Key Fields:**
- `id`: Access grant UUID
- `beneficiary_id`: Beneficiary reference
- `vault_id`: Vault reference (if vault-level access)
- `vault_item_id`: Item reference (if item-level access)
- `can_view`: View permission
- `can_export`: Export permission
- `can_edit`: Edit permission
- `reencrypted_key`: Encrypted symmetric key for this vault/item

**Purpose:** Granular control over what each beneficiary can access.

**Re-encryption:** When plan activates, data is re-encrypted with beneficiary's public key.

---

### 8. User Activity (`public.user_activity`)

Track user activity for inactivity-based inheritance triggers.

**Key Fields:**
- `id`: Activity UUID
- `user_id`: User reference
- `activity_type`: Type (login, vault_access, item_view, item_edit, password_change, api_call)
- `ip_address`: IP address
- `user_agent`: Browser/device info
- `metadata`: Additional context (JSON)
- `created_at`: Activity timestamp

**Purpose:** Monitor user activity to detect inactivity for inheritance triggers.

---

### 9. Inheritance Triggers (`public.inheritance_triggers`)

Log when inheritance plans are triggered.

**Key Fields:**
- `id`: Trigger UUID
- `inheritance_plan_id`: Plan reference
- `user_id`: User reference
- `trigger_reason`: Reason (inactivity, manual, scheduled, death_certificate, emergency_contact)
- `status`: Status (pending, processing, completed, cancelled, failed)
- `requires_verification`: Whether verification is needed
- `verification_code`: Verification code
- `verified_at`: Verification timestamp
- `triggered_at`: When triggered
- `completed_at`: When completed

**Purpose:** Track and manage inheritance plan execution.

---

### 10. Shared Vaults (`public.shared_vaults`)

Vault sharing between users while alive.

**Key Fields:**
- `id`: Share UUID
- `vault_id`: Vault reference
- `owner_id`: Owner reference
- `shared_with_user_id`: Recipient reference
- `can_view`: View permission
- `can_edit`: Edit permission
- `can_delete`: Delete permission
- `can_share`: Share permission
- `shared_key_encrypted`: Vault key encrypted with recipient's public key
- `is_active`: Whether share is active
- `accepted`: Whether recipient accepted
- `expires_at`: Optional expiration

**Purpose:** Share vaults with other users during lifetime.

---

### 11. Audit Logs (`public.audit_logs`)

Comprehensive audit trail for security and compliance.

**Key Fields:**
- `id`: Log UUID
- `user_id`: User reference
- `action`: Action performed
- `resource_type`: Type of resource (vault, vault_item, inheritance_plan, etc.)
- `resource_id`: Resource UUID
- `ip_address`: IP address
- `user_agent`: Browser/device info
- `old_values`: Previous values (JSON)
- `new_values`: New values (JSON)
- `risk_level`: Risk level (low, medium, high, critical)
- `created_at`: Log timestamp

**Purpose:** Complete audit trail for security, compliance, and forensics.

---

### 12. Security Alerts (`public.security_alerts`)

Track security events and breaches.

**Key Fields:**
- `id`: Alert UUID
- `user_id`: User reference
- `alert_type`: Type (failed_login, suspicious_activity, data_breach, weak_password, compromised_password, unauthorized_access)
- `severity`: Severity (info, warning, critical)
- `title`: Alert title
- `description`: Alert description
- `is_resolved`: Whether resolved
- `metadata`: Additional context (JSON)

**Purpose:** Notify users of security issues and track resolution.

---

### 13. Password Breach Checks (`public.password_breach_checks`)

Track passwords checked against breach databases.

**Key Fields:**
- `id`: Check UUID
- `vault_item_id`: Item reference
- `user_id`: User reference
- `is_breached`: Whether password found in breach
- `breach_count`: How many times found
- `checked_at`: Check timestamp
- `last_notified_at`: Last notification timestamp

**Purpose:** Monitor passwords against known breach databases (e.g., Have I Been Pwned).

---

### 14. Two-Factor Authentication (`public.two_factor_auth`)

Two-factor authentication settings.

**Key Fields:**
- `id`: 2FA UUID
- `user_id`: User reference
- `method`: Method (totp, sms, email, hardware_key)
- `secret_encrypted`: Encrypted TOTP secret
- `backup_codes_encrypted`: Encrypted backup codes array
- `is_enabled`: Whether enabled
- `is_verified`: Whether verified
- `last_used_at`: Last use timestamp

**Purpose:** Manage 2FA settings for enhanced security.

---

### 15. User Sessions (`public.user_sessions`)

Track active user sessions.

**Key Fields:**
- `id`: Session UUID
- `user_id`: User reference
- `session_token`: Unique session token
- `device_name`: Device name
- `device_type`: Device type
- `ip_address`: IP address
- `user_agent`: Browser/device info
- `location_city`: City (optional)
- `location_country`: Country (optional)
- `is_active`: Whether session is active
- `last_activity`: Last activity timestamp
- `expires_at`: Expiration timestamp

**Purpose:** Track and manage active sessions for security.

---

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Beneficiaries can only access granted data after inheritance activation
- Shared vault recipients can only access shared data with proper permissions

### Encryption Strategy

**Client-Side Encryption:**
- All sensitive data is encrypted on the client before sending to database
- Private keys never leave the client
- Database only stores encrypted data

**Fields That Are Encrypted:**
- Vault names and descriptions
- All vault item fields (title, username, password, URL, notes, custom fields)
- Beneficiary personal information
- Inheritance plan instructions
- Private key backups (encrypted with recovery passphrase)
- 2FA secrets and backup codes

**Fields That Are NOT Encrypted:**
- User email (needed for authentication)
- Public keys (needed for encryption)
- Metadata (icons, colors, tags)
- Timestamps and status flags
- Activity logs and audit trails

### Key Management

**User Private Key:**
- Generated on client during registration
- User must save it (like crypto wallet seed phrase)
- Never stored in database unencrypted
- Optional encrypted backup in `private_key_recovery` table

**Recovery Options:**
1. **Passphrase Recovery**: Private key encrypted with user's recovery passphrase
2. **Security Questions**: Private key encrypted with answers to security questions
3. **Backup Codes**: One-time use codes for recovery

---

## Indexes

All tables have appropriate indexes for:
- Foreign key relationships
- Frequently queried fields
- Date/timestamp fields for range queries
- Boolean flags for filtering
- GIN indexes for JSONB and array fields

---

## Triggers

**Automatic Timestamp Updates:**
- `updated_at` fields are automatically updated on record modification

**Activity Logging:**
- User activities are logged for inactivity monitoring

---

## Functions

### `check_user_inactivity()`
Checks all active inheritance plans with inactivity triggers and creates inheritance triggers when inactivity period is exceeded.

**Usage:** Should be called by a scheduled job (e.g., daily cron job).

### `log_user_activity()`
Logs user activity for inactivity monitoring.

**Parameters:**
- `p_user_id`: User UUID
- `p_activity_type`: Activity type
- `p_ip_address`: IP address (optional)
- `p_user_agent`: User agent (optional)
- `p_metadata`: Additional metadata (optional)

### `create_audit_log()`
Creates an audit log entry.

**Parameters:**
- `p_user_id`: User UUID
- `p_action`: Action performed
- `p_resource_type`: Resource type
- `p_resource_id`: Resource UUID (optional)
- `p_old_values`: Previous values (optional)
- `p_new_values`: New values (optional)
- `p_ip_address`: IP address (optional)
- `p_user_agent`: User agent (optional)
- `p_risk_level`: Risk level (optional, default: 'low')

---

## Implementation Guide

### 1. Initial Setup

```sql
-- Run the migration file in Supabase SQL Editor
-- File: migrations/20250106000000_password_manager_schema.sql
```

### 2. User Registration Flow

1. Generate public/private key pair on client
2. Store public key in `users` table
3. Show private key to user (must save it!)
4. Optionally create encrypted backup in `private_key_recovery`

### 3. Creating Vaults and Items

1. Encrypt data on client with user's public key
2. Insert encrypted data into database
3. Log activity in `user_activity` table

### 4. Setting Up Inheritance

1. Create inheritance plan in `inheritance_plans`
2. Add beneficiaries in `beneficiaries` table
3. Grant specific access in `beneficiary_vault_access`
4. System monitors activity via `user_activity`
5. When triggered, create entry in `inheritance_triggers`
6. Re-encrypt data with beneficiary's public key

### 5. Sharing Vaults

1. Encrypt vault key with recipient's public key
2. Create entry in `shared_vaults`
3. Recipient accepts share
4. Recipient can now decrypt vault data

---

## Scheduled Jobs

### Daily Jobs

1. **Check Inactivity**: Call `check_user_inactivity()` to trigger inheritance plans
2. **Clean Expired Sessions**: Delete expired sessions from `user_sessions`
3. **Clean Expired Recovery Keys**: Delete expired entries from `private_key_recovery`

### Weekly Jobs

1. **Password Breach Check**: Check passwords against breach databases
2. **Security Alert Cleanup**: Archive old resolved alerts

---

## Best Practices

### Security

1. **Never store unencrypted sensitive data**
2. **Always validate encryption on client before sending**
3. **Use strong key derivation for recovery passphrases**
4. **Implement rate limiting on recovery attempts**
5. **Log all security-sensitive operations**
6. **Regularly audit access logs**

### Performance

1. **Use pagination for large result sets**
2. **Cache frequently accessed non-sensitive data**
3. **Optimize queries with proper indexes**
4. **Use connection pooling**
5. **Monitor slow queries**

### Privacy

1. **Minimize metadata collection**
2. **Encrypt all PII**
3. **Implement data retention policies**
4. **Provide data export functionality**
5. **Support account deletion**

---

## API Integration Examples

### Creating a Vault Item

```typescript
// Client-side
import { encryptData } from './encryption';

async function createVaultItem(vaultId: string, itemData: any) {
  // Encrypt sensitive fields
  const encryptedItem = {
    vault_id: vaultId,
    user_id: currentUser.id,
    item_type: itemData.type,
    title_encrypted: await encryptData(itemData.title, userPublicKey),
    username_encrypted: await encryptData(itemData.username, userPublicKey),
    password_encrypted: await encryptData(itemData.password, userPublicKey),
    url_encrypted: await encryptData(itemData.url, userPublicKey),
    notes_encrypted: await encryptData(itemData.notes, userPublicKey),
    tags: itemData.tags, // Not encrypted
    password_strength: calculatePasswordStrength(itemData.password),
  };

  // Insert into database
  const { data, error } = await supabase
    .from('vault_items')
    .insert(encryptedItem)
    .select()
    .single();

  // Log activity
  await logActivity('item_edit', { item_id: data.id });

  return data;
}
```

### Setting Up Inheritance

```typescript
async function createInheritancePlan(planData: any) {
  // Create plan
  const { data: plan } = await supabase
    .from('inheritance_plans')
    .insert({
      user_id: currentUser.id,
      plan_name: planData.name,
      plan_type: planData.type,
      activation_method: 'inactivity',
      inactivity_days: 90,
      instructions_encrypted: await encryptData(planData.instructions, userPublicKey),
    })
    .select()
    .single();

  // Add beneficiaries
  for (const beneficiary of planData.beneficiaries) {
    const { data: ben } = await supabase
      .from('beneficiaries')
      .insert({
        user_id: currentUser.id,
        inheritance_plan_id: plan.id,
        full_name_encrypted: await encryptData(beneficiary.name, userPublicKey),
        email_encrypted: await encryptData(beneficiary.email, userPublicKey),
        access_level: beneficiary.accessLevel,
        beneficiary_public_key: beneficiary.publicKey,
      })
      .select()
      .single();

    // Grant specific vault access
    if (beneficiary.vaultIds) {
      for (const vaultId of beneficiary.vaultIds) {
        await supabase
          .from('beneficiary_vault_access')
          .insert({
            beneficiary_id: ben.id,
            vault_id: vaultId,
            can_view: true,
            can_export: beneficiary.canExport,
          });
      }
    }
  }

  return plan;
}
```

---

## Migration Notes

### From Existing System

If migrating from an existing password manager:

1. Export all data from old system
2. Generate new key pairs for users
3. Re-encrypt all data with new keys
4. Import into new schema
5. Verify data integrity
6. Provide users with new private keys

### Backup Strategy

1. **Database Backups**: Regular automated backups via Supabase
2. **User Data Export**: Allow users to export encrypted data
3. **Key Backup**: Encourage users to backup private keys securely

---

## Compliance

This schema supports compliance with:

- **GDPR**: Right to access, right to deletion, data portability
- **CCPA**: Data access and deletion rights
- **SOC 2**: Audit trails, access controls, encryption
- **HIPAA**: Encryption, audit logs, access controls (if storing health data)

---

## Future Enhancements

Potential additions to consider:

1. **Multi-signature inheritance**: Require multiple parties to activate
2. **Time-locked encryption**: Data automatically decrypts at specific time
3. **Biometric authentication**: Additional security layer
4. **Hardware security module (HSM)**: Enhanced key storage
5. **Blockchain verification**: Immutable audit trail
6. **Zero-knowledge proofs**: Prove data validity without revealing content

---

## Support and Maintenance

### Monitoring

Monitor these metrics:
- Failed login attempts
- Unusual activity patterns
- Inheritance trigger events
- Password breach detections
- Session anomalies

### Regular Tasks

- Review security alerts
- Update breach databases
- Audit access logs
- Test recovery procedures
- Update encryption algorithms as needed

---

## Conclusion

This schema provides a robust foundation for a secure password manager with inheritance planning. The encryption-first approach ensures user privacy while the inheritance features provide peace of mind for digital legacy planning.

For questions or issues, refer to the inline SQL comments or create an issue in the project repository.
