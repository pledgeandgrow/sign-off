# Heir Functionality Documentation

## Overview

The heir functionality system provides comprehensive digital legacy management, allowing users to designate heirs who will receive access to their vaults and items upon specific trigger conditions. This system is built with end-to-end encryption and follows best security practices.

## Architecture

### Database Tables

The heir functionality is built on four main database tables:

1. **inheritance_plans** - Defines what happens to user's data after death
2. **heirs** - People who will receive access to vaults/items
3. **heir_vault_access** - Maps which vaults/items heirs can access
4. **inheritance_triggers** - Logs when inheritance plans are triggered

### Key Features

- **Multiple Inheritance Plans**: Users can create multiple plans with different activation methods
- **Granular Access Control**: Heirs can have full, partial, or view-only access
- **Flexible Activation Methods**: 
  - Inactivity-based triggers
  - Death certificate verification
  - Manual triggers
  - Scheduled activation
- **Encrypted Data**: All heir information is encrypted using the user's public key
- **Notification System**: Configurable notifications with delay options
- **Vault-Level and Item-Level Access**: Grant access to entire vaults or specific items

## Components

### Heir Management Components

#### `HeirCard`
Displays heir information in a card format with status indicators and action buttons.

**Props:**
- `heir: HeirDecrypted` - The heir data to display
- `onPress?: () => void` - Handler for card press
- `onEdit?: () => void` - Handler for edit action
- `onDelete?: () => void` - Handler for delete action
- `showActions?: boolean` - Whether to show action buttons

#### `HeirForm`
Form component for creating or editing heirs.

**Props:**
- `initialData?: Partial<HeirFormData>` - Initial form data for editing
- `onSubmit: (data: HeirFormData) => void` - Form submission handler
- `onCancel: () => void` - Cancel handler
- `inheritancePlanId?: string | null` - Associated inheritance plan

**Features:**
- Personal information fields (name, email, phone, relationship)
- Access level selection (full, partial, view)
- Notification settings with delay configuration
- Active/inactive status toggle

#### `HeirList`
Displays a list of heirs with statistics and actions.

**Props:**
- `heirs: HeirDecrypted[]` - Array of heirs to display
- `loading?: boolean` - Loading state
- `onRefresh?: () => void` - Refresh handler
- `onHeirPress?: (heir: HeirDecrypted) => void` - Heir press handler
- `onEditHeir?: (heir: HeirDecrypted) => void` - Edit handler
- `onDeleteHeir?: (heir: HeirDecrypted) => void` - Delete handler
- `onAddHeir?: () => void` - Add new heir handler
- `showActions?: boolean` - Whether to show action buttons

### Inheritance Plan Components

#### `InheritancePlanCard`
Displays inheritance plan information in a card format.

**Props:**
- `plan: InheritancePlanDecrypted` - The plan data to display
- `onPress?: () => void` - Handler for card press
- `onEdit?: () => void` - Handler for edit action
- `onDelete?: () => void` - Handler for delete action
- `onToggleStatus?: () => void` - Handler for activating/deactivating plan
- `showActions?: boolean` - Whether to show action buttons

#### `InheritancePlanForm`
Form component for creating or editing inheritance plans.

**Props:**
- `initialData?: Partial<InheritancePlanFormData>` - Initial form data
- `onSubmit: (data: InheritancePlanFormData) => void` - Form submission handler
- `onCancel: () => void` - Cancel handler

**Features:**
- Plan name and type selection
- Activation method configuration
- Scheduled date picker (for scheduled activation)
- Encrypted instructions for heirs
- Active/inactive status toggle

#### `InheritancePlanList`
Displays a list of inheritance plans with statistics.

**Props:**
- `plans: InheritancePlanDecrypted[]` - Array of plans to display
- `loading?: boolean` - Loading state
- `onRefresh?: () => void` - Refresh handler
- `onPlanPress?: (plan: InheritancePlanDecrypted) => void` - Plan press handler
- `onEditPlan?: (plan: InheritancePlanDecrypted) => void` - Edit handler
- `onDeletePlan?: (plan: InheritancePlanDecrypted) => void` - Delete handler
- `onTogglePlanStatus?: (plan: InheritancePlanDecrypted) => void` - Toggle status handler
- `onAddPlan?: () => void` - Add new plan handler

### Vault Access Components

#### `VaultAccessManager`
Manages vault and item access permissions for heirs.

**Props:**
- `heirId: string` - The heir's ID
- `vaults: Vault[]` - Available vaults
- `vaultItems: VaultItem[]` - Available vault items
- `currentAccess: HeirVaultAccess[]` - Current access permissions
- `onGrantVaultAccess: (vaultId: string, permissions: any) => void` - Grant vault access handler
- `onGrantItemAccess: (itemId: string, permissions: any) => void` - Grant item access handler
- `onRevokeAccess: (accessId: string) => void` - Revoke access handler
- `onUpdatePermissions: (accessId: string, permissions: any) => void` - Update permissions handler

**Features:**
- Tabbed interface for vaults and items
- Toggle access on/off
- Granular permission controls (view, export, edit)
- Real-time permission updates

#### `InheritanceTriggerCard`
Displays inheritance trigger information and status.

**Props:**
- `trigger: InheritanceTrigger` - The trigger data to display
- `onPress?: () => void` - Handler for card press
- `onVerify?: () => void` - Handler for verification action
- `onCancel?: () => void` - Handler for cancellation
- `showActions?: boolean` - Whether to show action buttons

## Service Layer

### `inheritanceService.ts`

Comprehensive service layer for all heir-related operations.

#### Inheritance Plan Functions

```typescript
// Get all plans for a user
getInheritancePlans(userId: string): Promise<InheritancePlan[]>

// Get single plan
getInheritancePlan(planId: string): Promise<InheritancePlan | null>

// Get plan with decrypted instructions
getInheritancePlanDecrypted(planId: string, privateKey: string): Promise<InheritancePlanDecrypted | null>

// Create new plan
createInheritancePlan(userId: string, formData: InheritancePlanFormData, publicKey: string): Promise<InheritancePlan>

// Update plan
updateInheritancePlan(planId: string, updates: Partial<InheritancePlanFormData>, publicKey?: string): Promise<InheritancePlan>

// Delete plan
deleteInheritancePlan(planId: string): Promise<void>

// Toggle plan status
toggleInheritancePlanStatus(planId: string, isActive: boolean): Promise<InheritancePlan>

// Get plan with heirs
getInheritancePlanWithHeirs(planId: string, privateKey: string): Promise<InheritancePlanWithHeirs | null>

// Get plan statistics
getInheritancePlanStatistics(userId: string): Promise<InheritancePlanStatistics>
```

#### Heir Management Functions

```typescript
// Get all heirs for a user
getHeirs(userId: string): Promise<Heir[]>

// Get heirs by plan
getHeirsByPlan(planId: string, privateKey: string): Promise<HeirDecrypted[]>

// Get single heir
getHeir(heirId: string): Promise<Heir | null>

// Get heir with decrypted data
getHeirDecrypted(heirId: string, privateKey: string): Promise<HeirDecrypted | null>

// Get all heirs with decrypted data
getHeirsDecrypted(userId: string, privateKey: string): Promise<HeirDecrypted[]>

// Create heir
createHeir(userId: string, formData: HeirFormData, publicKey: string): Promise<Heir>

// Update heir
updateHeir(heirId: string, updates: Partial<HeirFormData>, publicKey?: string): Promise<Heir>

// Delete heir
deleteHeir(heirId: string): Promise<void>

// Accept heir invitation
acceptHeirInvitation(heirId: string): Promise<Heir>

// Get heir statistics
getHeirStatistics(userId: string): Promise<HeirStatistics>
```

#### Vault Access Functions

```typescript
// Get vault access for heir
getHeirVaultAccess(heirId: string): Promise<HeirVaultAccess[]>

// Grant vault access
grantVaultAccess(formData: HeirVaultAccessFormData): Promise<HeirVaultAccess>

// Update vault access permissions
updateVaultAccess(accessId: string, updates: Partial<HeirVaultAccessFormData>): Promise<HeirVaultAccess>

// Revoke vault access
revokeVaultAccess(accessId: string): Promise<void>

// Grant vault access to heir (convenience function)
grantVaultAccessToHeir(heirId: string, vaultId: string, permissions: {...}): Promise<HeirVaultAccess>

// Grant vault item access to heir (convenience function)
grantVaultItemAccessToHeir(heirId: string, vaultItemId: string, permissions: {...}): Promise<HeirVaultAccess>
```

#### Inheritance Trigger Functions

```typescript
// Get all triggers for a user
getInheritanceTriggers(userId: string): Promise<InheritanceTrigger[]>

// Get triggers for a plan
getInheritanceTriggersByPlan(planId: string): Promise<InheritanceTrigger[]>

// Create trigger
createInheritanceTrigger(formData: InheritanceTriggerFormData): Promise<InheritanceTrigger>

// Update trigger status
updateInheritanceTriggerStatus(triggerId: string, status: TriggerStatusType): Promise<InheritanceTrigger>

// Verify trigger
verifyInheritanceTrigger(triggerId: string, verificationCode: string, verifiedBy: string): Promise<InheritanceTrigger>

// Cancel trigger
cancelInheritanceTrigger(triggerId: string): Promise<InheritanceTrigger>

// Manually trigger plan
triggerInheritancePlanManually(planId: string, userId: string, metadata?: Record<string, any>): Promise<InheritanceTrigger>
```

## Type Definitions

### Core Types

```typescript
// Heir types
interface Heir {
  id: string;
  user_id: string;
  inheritance_plan_id: string | null;
  full_name_encrypted: string;
  email_encrypted: string;
  phone_encrypted: string | null;
  relationship_encrypted: string | null;
  access_level: AccessLevelType;
  heir_user_id: string | null;
  heir_public_key: string | null;
  notify_on_activation: boolean;
  notification_delay_days: number;
  is_active: boolean;
  has_accepted: boolean;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Decrypted heir data
interface HeirDecrypted {
  // Same as Heir but with decrypted fields
  full_name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
  // ... other fields
}

// Inheritance plan
interface InheritancePlan {
  id: string;
  user_id: string;
  plan_name: string;
  plan_type: InheritancePlanType;
  activation_method: ActivationMethodType;
  scheduled_date: string | null;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at: string | null;
  instructions_encrypted: string | null;
  created_at: string;
  updated_at: string;
}

// Vault access
interface HeirVaultAccess {
  id: string;
  heir_id: string;
  vault_id: string | null;
  vault_item_id: string | null;
  can_view: boolean;
  can_export: boolean;
  can_edit: boolean;
  reencrypted_key: string | null;
  granted_at: string;
  accessed_at: string | null;
}

// Inheritance trigger
interface InheritanceTrigger {
  id: string;
  inheritance_plan_id: string;
  user_id: string;
  trigger_reason: TriggerReasonType;
  trigger_metadata: Record<string, any> | null;
  status: TriggerStatusType;
  requires_verification: boolean;
  verification_code: string | null;
  verified_at: string | null;
  verified_by: string | null;
  triggered_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}
```

### Enum Types

```typescript
type AccessLevelType = 'full' | 'partial' | 'view';
type InheritancePlanType = 'full_access' | 'partial_access' | 'view_only' | 'destroy';
type ActivationMethodType = 'inactivity' | 'death_certificate' | 'manual_trigger' | 'scheduled';
type TriggerReasonType = 'inactivity' | 'manual' | 'scheduled' | 'death_certificate' | 'emergency_contact';
type TriggerStatusType = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
```

## App Pages

### `/app/(tabs)/inheritance.tsx`
Main inheritance plans management screen with list of all plans and ability to create/edit plans.

### `/app/inheritance/[id].tsx`
Detailed view of a specific inheritance plan showing:
- Plan overview and settings
- Associated heirs
- Trigger history
- Manual trigger option (for manual_trigger activation method)

### `/app/heirs/[id].tsx`
Detailed view of a specific heir showing:
- Heir information
- Contact details
- Access settings
- Vault access management

### `/app/(tabs)/heirs.tsx`
Main heirs management screen (already exists) - can be enhanced with new components.

## Usage Examples

### Creating an Inheritance Plan

```typescript
import { createInheritancePlan } from '@/lib/services/inheritanceService';

const handleCreatePlan = async () => {
  const formData: InheritancePlanFormData = {
    plan_name: 'My Estate Plan',
    plan_type: 'partial_access',
    activation_method: 'inactivity',
    scheduled_date: null,
    instructions_encrypted: 'Please distribute my assets according to my will.',
    is_active: true,
  };

  const plan = await createInheritancePlan(userId, formData, userPublicKey);
};
```

### Adding an Heir

```typescript
import { createHeir } from '@/lib/services/inheritanceService';

const handleAddHeir = async () => {
  const formData: HeirFormData = {
    full_name_encrypted: 'John Doe',
    email_encrypted: 'john@example.com',
    phone_encrypted: '+1234567890',
    relationship_encrypted: 'Son',
    access_level: 'partial',
    inheritance_plan_id: planId,
    heir_user_id: null,
    heir_public_key: null,
    notify_on_activation: true,
    notification_delay_days: 7,
    is_active: true,
  };

  const heir = await createHeir(userId, formData, userPublicKey);
};
```

### Granting Vault Access

```typescript
import { grantVaultAccessToHeir } from '@/lib/services/inheritanceService';

const handleGrantAccess = async () => {
  await grantVaultAccessToHeir(heirId, vaultId, {
    can_view: true,
    can_export: true,
    can_edit: false,
  });
};
```

### Manually Triggering a Plan

```typescript
import { triggerInheritancePlanManually } from '@/lib/services/inheritanceService';

const handleTrigger = async () => {
  const trigger = await triggerInheritancePlanManually(planId, userId, {
    reason: 'User requested manual trigger',
    timestamp: new Date().toISOString(),
  });
};
```

## Security Considerations

1. **Encryption**: All sensitive heir data (name, email, phone, relationship) is encrypted using the user's public key
2. **Access Control**: Row-level security policies ensure users can only access their own heirs and plans
3. **Verification**: Triggers can require verification before activation
4. **Audit Trail**: All trigger events are logged in the inheritance_triggers table
5. **Granular Permissions**: Fine-grained control over what heirs can view, export, or edit

## Future Enhancements

1. **Email Notifications**: Automated email notifications to heirs when plans are triggered
2. **Multi-Factor Verification**: Additional verification steps for high-security triggers
3. **Heir Portal**: Dedicated interface for heirs to view and accept their inheritance
4. **Document Uploads**: Ability to attach death certificates and legal documents
5. **Scheduled Checks**: Automated inactivity monitoring and trigger scheduling
6. **Heir Communication**: Secure messaging between users and heirs
7. **Legal Templates**: Pre-built templates for common inheritance scenarios
8. **Blockchain Integration**: Immutable record of inheritance plan activation

## Testing

To test the heir functionality:

1. Create an inheritance plan
2. Add heirs to the plan
3. Grant vault access to heirs
4. Test manual trigger functionality
5. Verify heir notifications
6. Test access revocation
7. Verify encryption/decryption of heir data

## Troubleshooting

### Common Issues

**Issue**: Heir data not decrypting properly
- **Solution**: Ensure you're using the correct private key for decryption

**Issue**: Vault access not showing
- **Solution**: Verify the heir_vault_access records are properly linked to the heir

**Issue**: Trigger not activating
- **Solution**: Check that the plan is active and trigger conditions are met

**Issue**: Permissions not updating
- **Solution**: Ensure RLS policies allow the user to update heir_vault_access records

## Support

For questions or issues with the heir functionality, please refer to:
- Database schema: `migrations/schema.sql`
- Type definitions: `types/heir.ts`
- Service layer: `lib/services/inheritanceService.ts`
- Components: `components/heirs/` and `components/inheritance/`
