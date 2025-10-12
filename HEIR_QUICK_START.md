# Heir Functionality - Quick Start Guide

## 🚀 Installation & Setup

### 1. Install Required Dependencies

```bash
npm install @react-native-community/datetimepicker @react-native-picker/picker
```

### 2. Verify Database Schema

Ensure your database has the following tables (already in `migrations/schema.sql`):
- ✅ `inheritance_plans`
- ✅ `heirs`
- ✅ `heir_vault_access`
- ✅ `inheritance_triggers`

### 3. Run Database Migrations

```bash
# If using Supabase CLI
supabase db push

# Or apply the schema manually through Supabase Dashboard
```

---

## 📱 Quick Usage Examples

### Example 1: Create an Inheritance Plan

```typescript
import { createInheritancePlan } from '@/lib/services/inheritanceService';
import { useAuth } from '@/contexts/AuthContext';

const { user } = useAuth();

const handleCreatePlan = async () => {
  const plan = await createInheritancePlan(user.id, {
    plan_name: 'Family Estate Plan',
    plan_type: 'partial_access',
    activation_method: 'inactivity',
    scheduled_date: null,
    instructions_encrypted: 'Please contact my lawyer for further instructions.',
    is_active: true,
  }, user.public_key);
  
  console.log('Plan created:', plan.id);
};
```

### Example 2: Add an Heir

```typescript
import { createHeir } from '@/lib/services/inheritanceService';

const handleAddHeir = async (planId: string) => {
  const heir = await createHeir(user.id, {
    full_name_encrypted: 'Jane Doe',
    email_encrypted: 'jane@example.com',
    phone_encrypted: '+1-555-0123',
    relationship_encrypted: 'Daughter',
    access_level: 'partial',
    inheritance_plan_id: planId,
    heir_user_id: null,
    heir_public_key: null,
    notify_on_activation: true,
    notification_delay_days: 0,
    is_active: true,
  }, user.public_key);
  
  console.log('Heir added:', heir.id);
};
```

### Example 3: Grant Vault Access

```typescript
import { grantVaultAccessToHeir } from '@/lib/services/inheritanceService';

const handleGrantAccess = async (heirId: string, vaultId: string) => {
  await grantVaultAccessToHeir(heirId, vaultId, {
    can_view: true,
    can_export: false,
    can_edit: false,
  });
  
  console.log('Access granted');
};
```

### Example 4: Manually Trigger a Plan

```typescript
import { triggerInheritancePlanManually } from '@/lib/services/inheritanceService';

const handleTrigger = async (planId: string) => {
  const trigger = await triggerInheritancePlanManually(planId, user.id, {
    reason: 'Emergency situation',
    timestamp: new Date().toISOString(),
  });
  
  console.log('Plan triggered:', trigger.id);
};
```

---

## 🎨 Using Components

### Display Inheritance Plans

```tsx
import { InheritancePlanList } from '@/components/inheritance';

<InheritancePlanList
  plans={plans}
  onRefresh={loadPlans}
  onPlanPress={(plan) => router.push(`/inheritance/${plan.id}`)}
  onEditPlan={handleEdit}
  onDeletePlan={handleDelete}
  onTogglePlanStatus={handleToggle}
  onAddPlan={() => setShowForm(true)}
/>
```

### Display Heirs

```tsx
import { HeirList } from '@/components/heirs';

<HeirList
  heirs={heirs}
  onRefresh={loadHeirs}
  onHeirPress={(heir) => router.push(`/heirs/${heir.id}`)}
  onEditHeir={handleEdit}
  onDeleteHeir={handleDelete}
  onAddHeir={() => setShowForm(true)}
/>
```

### Create/Edit Inheritance Plan

```tsx
import { InheritancePlanForm } from '@/components/inheritance';

<InheritancePlanForm
  initialData={editingPlan}
  onSubmit={handleSubmit}
  onCancel={() => setShowForm(false)}
/>
```

### Create/Edit Heir

```tsx
import { HeirForm } from '@/components/heirs';

<HeirForm
  initialData={editingHeir}
  onSubmit={handleSubmit}
  onCancel={() => setShowForm(false)}
  inheritancePlanId={planId}
/>
```

### Manage Vault Access

```tsx
import { VaultAccessManager } from '@/components/inheritance';

<VaultAccessManager
  heirId={heirId}
  vaults={vaults}
  vaultItems={vaultItems}
  currentAccess={vaultAccess}
  onGrantVaultAccess={handleGrantVault}
  onGrantItemAccess={handleGrantItem}
  onRevokeAccess={handleRevoke}
  onUpdatePermissions={handleUpdate}
/>
```

---

## 🔐 Encryption Notes

### Important: Data Encryption

All heir data is encrypted using the user's public key:
- `full_name_encrypted`
- `email_encrypted`
- `phone_encrypted`
- `relationship_encrypted`
- `instructions_encrypted`

### Encryption Flow

1. **When Creating/Updating:**
   ```typescript
   const encrypted = await encryptData(plaintext, user.public_key);
   ```

2. **When Reading:**
   ```typescript
   const decrypted = await decryptData(encrypted, user.private_key);
   ```

3. **Service Layer Handles This:**
   - `createHeir()` - Encrypts data automatically
   - `getHeirDecrypted()` - Decrypts data automatically
   - `createInheritancePlan()` - Encrypts instructions
   - `getInheritancePlanDecrypted()` - Decrypts instructions

---

## 📋 Common Tasks Checklist

### Setting Up Inheritance

- [ ] Create an inheritance plan
- [ ] Add heirs to the plan
- [ ] Grant vault access to heirs
- [ ] Configure notification settings
- [ ] Activate the plan

### Managing Heirs

- [ ] Add heir personal information
- [ ] Set access level (full/partial/view)
- [ ] Configure notifications
- [ ] Link to inheritance plan
- [ ] Grant specific vault access

### Triggering Plans

- [ ] Set activation method
- [ ] Configure trigger conditions
- [ ] Test manual trigger
- [ ] Verify heir notifications
- [ ] Monitor trigger status

---

## 🎯 Navigation Routes

### Available Routes

```typescript
import { router } from 'expo-router';

// Navigate to inheritance plans
router.push('/(tabs)/inheritance');

// Navigate to specific plan
router.push(`/inheritance/${planId}`);

// Navigate to heirs list
router.push('/(tabs)/heirs');

// Navigate to specific heir
router.push(`/heirs/${heirId}`);
```

---

## 🧪 Testing Checklist

### Inheritance Plans
- [ ] Create plan with all activation methods
- [ ] Edit plan details
- [ ] Toggle plan active/inactive
- [ ] Delete plan
- [ ] View plan statistics

### Heirs
- [ ] Add heir with all fields
- [ ] Edit heir information
- [ ] Delete heir
- [ ] View heir details
- [ ] Check encryption/decryption

### Vault Access
- [ ] Grant vault access
- [ ] Grant item access
- [ ] Update permissions
- [ ] Revoke access
- [ ] View access list

### Triggers
- [ ] Create manual trigger
- [ ] Verify trigger
- [ ] Cancel trigger
- [ ] View trigger history
- [ ] Check trigger status

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@react-native-community/datetimepicker'"
**Solution:** Run `npm install @react-native-community/datetimepicker`

### Issue: Heir data not decrypting
**Solution:** Ensure you're passing the correct private key to decryption functions

### Issue: Database errors when creating heirs
**Solution:** Verify all required fields are provided and properly encrypted

### Issue: Navigation not working
**Solution:** Ensure routes are properly configured in `app/routes.ts`

### Issue: RLS policies blocking access
**Solution:** Verify user is authenticated and owns the resources

---

## 📞 Support

For detailed documentation, see:
- **Full Documentation:** `docs/HEIR_FUNCTIONALITY.md`
- **Implementation Summary:** `HEIR_IMPLEMENTATION_SUMMARY.md`
- **Database Schema:** `migrations/schema.sql`

---

## ✅ Quick Verification

Run this checklist to verify everything is working:

1. ✅ Dependencies installed
2. ✅ Database schema applied
3. ✅ Can create inheritance plan
4. ✅ Can add heir
5. ✅ Can grant vault access
6. ✅ Can manually trigger plan
7. ✅ Navigation works
8. ✅ Encryption/decryption works

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Production Ready
