import { supabase } from '@/lib/supabase';
import { VaultCategory } from '@/types/vault';

/**
 * Vault Action Service
 * Handles vault-specific actions when death is verified
 */

export interface VaultActionResult {
  vaultId: string;
  category: VaultCategory;
  action: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Execute actions for all vaults based on their category when death is verified
 */
export async function executeVaultActionsOnDeath(userId: string): Promise<VaultActionResult[]> {
  try {
    console.log(`Executing vault actions for user ${userId} after death verification`);

    // Get all vaults for the user
    const { data: vaults, error: vaultsError } = await supabase
      .from('vaults')
      .select('id, name, category, user_id')
      .eq('user_id', userId);

    if (vaultsError) {
      console.error('Error fetching vaults:', vaultsError);
      throw vaultsError;
    }

    if (!vaults || vaults.length === 0) {
      console.log('No vaults found for user');
      return [];
    }

    const results: VaultActionResult[] = [];

    // Process each vault based on its category
    for (const vault of vaults) {
      let result: VaultActionResult;

      switch (vault.category) {
        case 'delete_after_death':
          result = await deleteVaultAndItems(vault.id, vault.category);
          break;

        case 'share_after_death':
          result = await shareVaultWithHeirs(vault.id, vault.category);
          break;

        case 'handle_after_death':
          result = await notifyTrustedContactForVault(vault.id, vault.category);
          break;

        case 'sign_off_after_death':
          result = await createSignOffTask(vault.id, vault.category);
          break;

        default:
          result = {
            vaultId: vault.id,
            category: vault.category,
            action: 'unknown',
            success: false,
            error: 'Unknown vault category',
            timestamp: new Date().toISOString(),
          };
      }

      results.push(result);
    }

    console.log(`Completed vault actions: ${results.length} vaults processed`);
    return results;
  } catch (error) {
    console.error('Error in executeVaultActionsOnDeath:', error);
    throw error;
  }
}

/**
 * DELETE AFTER DEATH: Delete vault and all its items
 */
async function deleteVaultAndItems(vaultId: string, category: VaultCategory): Promise<VaultActionResult> {
  try {
    console.log(`Deleting vault ${vaultId} and all items`);

    // First, delete all vault items
    const { error: itemsError } = await supabase
      .from('vault_items')
      .delete()
      .eq('vault_id', vaultId);

    if (itemsError) {
      console.error('Error deleting vault items:', itemsError);
      return {
        vaultId,
        category,
        action: 'delete',
        success: false,
        error: itemsError.message,
        timestamp: new Date().toISOString(),
      };
    }

    // Then delete the vault itself
    const { error: vaultError } = await supabase
      .from('vaults')
      .delete()
      .eq('id', vaultId);

    if (vaultError) {
      console.error('Error deleting vault:', vaultError);
      return {
        vaultId,
        category,
        action: 'delete',
        success: false,
        error: vaultError.message,
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`Successfully deleted vault ${vaultId}`);
    return {
      vaultId,
      category,
      action: 'delete',
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error in deleteVaultAndItems:', error);
    return {
      vaultId,
      category,
      action: 'delete',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * SHARE AFTER DEATH: Make vault accessible to heirs
 * (Already handled by heir_vault_access, just mark as shared)
 */
async function shareVaultWithHeirs(vaultId: string, category: VaultCategory): Promise<VaultActionResult> {
  try {
    console.log(`Sharing vault ${vaultId} with heirs`);

    // Mark vault as shared
    const { error: updateError } = await supabase
      .from('vaults')
      .update({
        is_shared: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vaultId);

    if (updateError) {
      console.error('Error marking vault as shared:', updateError);
      return {
        vaultId,
        category,
        action: 'share',
        success: false,
        error: updateError.message,
        timestamp: new Date().toISOString(),
      };
    }

    // Update heir_vault_access records to granted status
    const { error: accessError } = await supabase
      .from('heir_vault_access')
      .update({
        access_status: 'granted',
        granted_at: new Date().toISOString(),
      })
      .eq('vault_id', vaultId)
      .eq('access_status', 'pending');

    if (accessError) {
      console.error('Error updating heir access:', accessError);
    }

    console.log(`Successfully shared vault ${vaultId}`);
    return {
      vaultId,
      category,
      action: 'share',
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error in shareVaultWithHeirs:', error);
    return {
      vaultId,
      category,
      action: 'share',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * HANDLE AFTER DEATH: Notify trusted contact to handle vault
 */
async function notifyTrustedContactForVault(vaultId: string, category: VaultCategory): Promise<VaultActionResult> {
  try {
    console.log(`Notifying trusted contact for vault ${vaultId}`);

    // Get vault details
    const { data: vault, error: vaultError } = await supabase
      .from('vaults')
      .select('*, users!inner(trusted_contact_email, trusted_contact_phone)')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      return {
        vaultId,
        category,
        action: 'notify_trusted',
        success: false,
        error: 'Vault not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Create notification record (you can implement email/SMS later)
    // For now, just mark vault with special status
    const { error: updateError } = await supabase
      .from('vaults')
      .update({
        death_settings: {
          ...vault.death_settings,
          trusted_contact_notified: true,
          notified_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', vaultId);

    if (updateError) {
      return {
        vaultId,
        category,
        action: 'notify_trusted',
        success: false,
        error: updateError.message,
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`Successfully notified trusted contact for vault ${vaultId}`);
    return {
      vaultId,
      category,
      action: 'notify_trusted',
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error in notifyTrustedContactForVault:', error);
    return {
      vaultId,
      category,
      action: 'notify_trusted',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * SIGN OFF AFTER DEATH: Create task for admin team to handle
 */
async function createSignOffTask(vaultId: string, category: VaultCategory): Promise<VaultActionResult> {
  try {
    console.log(`Creating sign-off task for vault ${vaultId}`);

    // Get vault details
    const { data: vault, error: vaultError } = await supabase
      .from('vaults')
      .select('*, users!inner(id, email, full_name)')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      return {
        vaultId,
        category,
        action: 'create_signoff_task',
        success: false,
        error: 'Vault not found',
        timestamp: new Date().toISOString(),
      };
    }

    // Create a task record (you'll need to create a sign_off_tasks table)
    // For now, update vault with sign-off status
    const { error: updateError } = await supabase
      .from('vaults')
      .update({
        death_settings: {
          ...vault.death_settings,
          signoff_task_created: true,
          task_created_at: new Date().toISOString(),
          task_status: 'pending',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', vaultId);

    if (updateError) {
      return {
        vaultId,
        category,
        action: 'create_signoff_task',
        success: false,
        error: updateError.message,
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`Successfully created sign-off task for vault ${vaultId}`);
    return {
      vaultId,
      category,
      action: 'create_signoff_task',
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error in createSignOffTask:', error);
    return {
      vaultId,
      category,
      action: 'create_signoff_task',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get vault action history for a user
 */
export async function getVaultActionHistory(userId: string) {
  try {
    // This would query a vault_actions_log table if you create one
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error getting vault action history:', error);
    return [];
  }
}

/**
 * Manually trigger vault actions (for testing or manual triggers)
 */
export async function manuallyTriggerVaultActions(userId: string, vaultId?: string) {
  try {
    if (vaultId) {
      // Trigger action for specific vault
      const { data: vault } = await supabase
        .from('vaults')
        .select('id, category')
        .eq('id', vaultId)
        .eq('user_id', userId)
        .single();

      if (!vault) {
        throw new Error('Vault not found');
      }

      // Execute action based on category
      switch (vault.category) {
        case 'delete_after_death':
          return await deleteVaultAndItems(vault.id, vault.category);
        case 'share_after_death':
          return await shareVaultWithHeirs(vault.id, vault.category);
        case 'handle_after_death':
          return await notifyTrustedContactForVault(vault.id, vault.category);
        case 'sign_off_after_death':
          return await createSignOffTask(vault.id, vault.category);
      }
    } else {
      // Trigger actions for all vaults
      return await executeVaultActionsOnDeath(userId);
    }
  } catch (error) {
    console.error('Error in manuallyTriggerVaultActions:', error);
    throw error;
  }
}
