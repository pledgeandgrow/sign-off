import { supabase } from '@/lib/supabase';
import { Vault } from '@/types/vault';

/**
 * Shared Vault Service
 * Handles vaults shared with heirs from deceased ancestors
 */

export interface SharedVault extends Vault {
  shared_from_user_name: string;
  shared_from_user_email: string;
  granted_at: string;
  can_view: boolean;
  can_export: boolean;
  can_edit: boolean;
  inheritance_plan_name: string;
}

/**
 * Get vaults shared with the current user as an heir
 * Only shows vaults from triggered inheritance plans
 */
export async function getSharedVaultsAsHeir(userId: string): Promise<SharedVault[]> {
  try {
    const { data, error } = await supabase
      .from('heir_vault_access')
      .select(`
        id,
        can_view,
        can_export,
        can_edit,
        granted_at,
        vault:vaults (
          id,
          name,
          description,
          category,
          icon,
          color,
          is_encrypted,
          is_locked,
          created_at,
          updated_at
        ),
        heir:heirs (
          id,
          inheritance_plan:inheritance_plans (
            id,
            plan_name,
            is_triggered,
            triggered_at,
            user:users (
              id,
              full_name,
              email
            )
          )
        )
      `)
      .eq('heir.heir_user_id', userId)
      .eq('heir.inheritance_plan.is_triggered', true)
      .eq('access_status', 'granted');

    if (error) {
      console.error('Error fetching shared vaults:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data into SharedVault format
    const sharedVaults: SharedVault[] = data
      .filter(item => item.vault && item.heir?.inheritance_plan)
      .map(item => ({
        ...item.vault,
        shared_from_user_name: item.heir.inheritance_plan.user?.full_name || 'Unknown',
        shared_from_user_email: item.heir.inheritance_plan.user?.email || '',
        granted_at: item.granted_at || new Date().toISOString(),
        can_view: item.can_view,
        can_export: item.can_export,
        can_edit: item.can_edit,
        inheritance_plan_name: item.heir.inheritance_plan.plan_name,
        items: [], // Items will be loaded separately when vault is opened
      }));

    return sharedVaults;
  } catch (error) {
    console.error('Error in getSharedVaultsAsHeir:', error);
    return [];
  }
}

/**
 * Get items from a shared vault
 */
export async function getSharedVaultItems(vaultId: string, heirUserId: string) {
  try {
    // First verify the heir has access to this vault
    const { data: accessData, error: accessError } = await supabase
      .from('heir_vault_access')
      .select(`
        id,
        can_view,
        heir:heirs!inner (
          heir_user_id
        )
      `)
      .eq('vault_id', vaultId)
      .eq('heir.heir_user_id', heirUserId)
      .eq('access_status', 'granted')
      .single();

    if (accessError || !accessData || !accessData.can_view) {
      throw new Error('Access denied to this vault');
    }

    // Fetch vault items
    const { data: items, error: itemsError } = await supabase
      .from('vault_items')
      .select('*')
      .eq('vault_id', vaultId);

    if (itemsError) {
      console.error('Error fetching vault items:', itemsError);
      throw itemsError;
    }

    return items || [];
  } catch (error) {
    console.error('Error in getSharedVaultItems:', error);
    throw error;
  }
}

/**
 * Check if user has access to a specific vault as heir
 */
export async function checkHeirVaultAccess(vaultId: string, heirUserId: string) {
  try {
    const { data, error } = await supabase
      .from('heir_vault_access')
      .select(`
        can_view,
        can_export,
        can_edit,
        heir:heirs!inner (
          heir_user_id,
          inheritance_plan:inheritance_plans (
            is_triggered
          )
        )
      `)
      .eq('vault_id', vaultId)
      .eq('heir.heir_user_id', heirUserId)
      .eq('access_status', 'granted')
      .single();

    if (error || !data) {
      return null;
    }

    return {
      can_view: data.can_view,
      can_export: data.can_export,
      can_edit: data.can_edit,
      is_triggered: data.heir.inheritance_plan?.is_triggered || false,
    };
  } catch (error) {
    console.error('Error checking heir vault access:', error);
    return null;
  }
}
