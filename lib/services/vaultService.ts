import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { encryptData, decryptData, getPublicKey, getPrivateKey } from '@/lib/encryption';
import type { Database } from '@/types/database.types';

type Vault = Database['public']['Tables']['vaults']['Row'];
type VaultInsert = Database['public']['Tables']['vaults']['Insert'];
type VaultItem = Database['public']['Tables']['vault_items']['Row'];
type VaultItemInsert = Database['public']['Tables']['vault_items']['Insert'];

/**
 * Vault Service - Handles all vault-related database operations
 */
export class VaultService {
  /**
   * Get all vaults for the current user
   */
  static async getUserVaults(userId: string): Promise<Vault[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new vault
   */
  static async createVault(vaultData: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }): Promise<Vault> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const publicKey = await getPublicKey();
    if (!publicKey) {
      throw new Error('Public key not found. Please set up encryption first.');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Encrypt sensitive fields
    const nameEncrypted = await encryptData(vaultData.name, publicKey);
    const descriptionEncrypted = vaultData.description
      ? await encryptData(vaultData.description, publicKey)
      : null;

    const { data, error } = await supabase
      .from('vaults')
      .insert({
        user_id: user.id,
        name_encrypted: nameEncrypted,
        description_encrypted: descriptionEncrypted,
        icon: vaultData.icon || 'lock',
        color: vaultData.color || '#3B82F6',
        is_shared: false,
        is_favorite: false,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a vault
   */
  static async updateVault(
    vaultId: string,
    updates: Partial<{
      name: string;
      description: string;
      icon: string;
      color: string;
      is_favorite: boolean;
    }>
  ): Promise<Vault> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const publicKey = await getPublicKey();
    if (!publicKey) {
      throw new Error('Public key not found');
    }

    const updateData: any = {};

    if (updates.name) {
      updateData.name_encrypted = await encryptData(updates.name, publicKey);
    }
    if (updates.description !== undefined) {
      updateData.description_encrypted = updates.description
        ? await encryptData(updates.description, publicKey)
        : null;
    }
    if (updates.icon) updateData.icon = updates.icon;
    if (updates.color) updateData.color = updates.color;
    if (updates.is_favorite !== undefined) updateData.is_favorite = updates.is_favorite;

    const { data, error } = await supabase
      .from('vaults')
      .update(updateData)
      .eq('id', vaultId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a vault
   */
  static async deleteVault(vaultId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('vaults')
      .delete()
      .eq('id', vaultId);

    if (error) throw error;
  }

  /**
   * Get all items in a vault (decrypted)
   */
  static async getVaultItems(vaultId: string): Promise<any[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Decrypt items
    const decryptedItems = await Promise.all(
      (data || []).map(async (item) => ({
        ...item,
        title: item.title_encrypted ? await decryptData(item.title_encrypted, privateKey) : '',
        username: item.username_encrypted ? await decryptData(item.username_encrypted, privateKey) : '',
        password: item.password_encrypted ? await decryptData(item.password_encrypted, privateKey) : '',
        url: item.url_encrypted ? await decryptData(item.url_encrypted, privateKey) : '',
        notes: item.notes_encrypted ? await decryptData(item.notes_encrypted, privateKey) : '',
      }))
    );

    return decryptedItems;
  }

  /**
   * Create a vault item
   */
  static async createVaultItem(itemData: {
    vaultId: string;
    type: string;
    title: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
    tags?: string[];
  }): Promise<VaultItem> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const publicKey = await getPublicKey();
    if (!publicKey) {
      throw new Error('Public key not found');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Encrypt sensitive fields
    const titleEncrypted = await encryptData(itemData.title, publicKey);
    const usernameEncrypted = itemData.username ? await encryptData(itemData.username, publicKey) : null;
    const passwordEncrypted = itemData.password ? await encryptData(itemData.password, publicKey) : null;
    const urlEncrypted = itemData.url ? await encryptData(itemData.url, publicKey) : null;
    const notesEncrypted = itemData.notes ? await encryptData(itemData.notes, publicKey) : null;

    const { data, error } = await supabase
      .from('vault_items')
      .insert({
        vault_id: itemData.vaultId,
        user_id: user.id,
        item_type: itemData.type as any,
        title_encrypted: titleEncrypted,
        username_encrypted: usernameEncrypted,
        password_encrypted: passwordEncrypted,
        url_encrypted: urlEncrypted,
        notes_encrypted: notesEncrypted,
        tags: itemData.tags || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a vault item
   */
  static async updateVaultItem(
    itemId: string,
    updates: Partial<{
      title: string;
      username: string;
      password: string;
      url: string;
      notes: string;
      tags: string[];
    }>
  ): Promise<VaultItem> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const publicKey = await getPublicKey();
    if (!publicKey) {
      throw new Error('Public key not found');
    }

    const updateData: any = {};

    if (updates.title) updateData.title_encrypted = await encryptData(updates.title, publicKey);
    if (updates.username !== undefined) {
      updateData.username_encrypted = updates.username ? await encryptData(updates.username, publicKey) : null;
    }
    if (updates.password !== undefined) {
      updateData.password_encrypted = updates.password ? await encryptData(updates.password, publicKey) : null;
    }
    if (updates.url !== undefined) {
      updateData.url_encrypted = updates.url ? await encryptData(updates.url, publicKey) : null;
    }
    if (updates.notes !== undefined) {
      updateData.notes_encrypted = updates.notes ? await encryptData(updates.notes, publicKey) : null;
    }
    if (updates.tags) updateData.tags = updates.tags;

    const { data, error } = await supabase
      .from('vault_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a vault item
   */
  static async deleteVaultItem(itemId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }
}
