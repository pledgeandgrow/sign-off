/**
 * Supabase Service Layer
 * Handles all database operations with proper error handling
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import type { Database, Vault, VaultItem, Heir, InheritancePlan } from '@/types/database.types';
import { encryptData, decryptData, getPrivateKey } from '../encryption';

// =====================================================
// USER OPERATIONS
// =====================================================

export async function createUserProfile(userId: string, email: string, fullName?: string, publicKey?: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: fullName || null,
        public_key: publicKey || 'pending', // Temporary value if not provided
        is_active: true,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function updateUserActivity(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
}

// =====================================================
// VAULT OPERATIONS
// =====================================================

export async function createVault(userId: string, vaultData: {
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('vaults')
      .insert({
        user_id: userId,
        name: vaultData.name,
        description: vaultData.description || null,
        category: vaultData.category as any,
        icon: vaultData.icon || null,
        color: vaultData.color || null,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Update user activity
    await updateUserActivity(userId);
    
    return data;
  } catch (error) {
    console.error('Error creating vault:', error);
    throw error;
  }
}

export async function getUserVaults(userId: string) {
  try {
    const { data, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vaults:', error);
    throw error;
  }
}

export async function updateVault(vaultId: string, updates: Partial<Vault>) {
  try {
    const { data, error } = await supabase
      .from('vaults')
      .update(updates)
      .eq('id', vaultId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating vault:', error);
    throw error;
  }
}

export async function deleteVault(vaultId: string) {
  try {
    const { error } = await supabase
      .from('vaults')
      .delete()
      .eq('id', vaultId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting vault:', error);
    throw error;
  }
}

// =====================================================
// VAULT ITEM OPERATIONS
// =====================================================

export async function createVaultItem(
  userId: string,
  vaultId: string,
  itemData: {
    title: string;
    type: string;
    data: Record<string, any>;
  }
) {
  try {
    // Get user's private key for encryption
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found. Please log in again.');
    }

    // Encrypt the title
    const titleEncrypted = await encryptData(itemData.title, privateKey);

    // Encrypt the item data and upload to Supabase Storage
    const itemDataString = JSON.stringify(itemData.data);
    const encryptedData = await encryptData(itemDataString, privateKey);
    
    // Generate storage path
    const storagePath = `${userId}/${vaultId}/${Date.now()}_${Math.random().toString(36).substring(7)}.enc`;
    
    // Upload encrypted data to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('vault-items')
      .upload(storagePath, encryptedData, {
        contentType: 'application/octet-stream',
      });

    if (uploadError) throw uploadError;

    // Create database record
    const { data, error } = await supabase
      .from('vault_items')
      .insert({
        user_id: userId,
        vault_id: vaultId,
        item_type: itemData.type as any,
        storage_path: storagePath,
        storage_bucket: 'vault-items',
        title_encrypted: titleEncrypted,
        file_size: encryptedData.length,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Update user activity
    await updateUserActivity(userId);
    
    return data;
  } catch (error) {
    console.error('Error creating vault item:', error);
    throw error;
  }
}

export async function getVaultItems(vaultId: string) {
  try {
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching vault items:', error);
    throw error;
  }
}

export async function getDecryptedVaultItem(item: VaultItem) {
  try {
    // Get user's private key
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    // Download encrypted data from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(item.storage_bucket)
      .download(item.storage_path);

    if (downloadError) throw downloadError;

    // Read file content
    const encryptedData = await fileData.text();

    // Decrypt data
    const decryptedDataString = await decryptData(encryptedData, privateKey);
    const decryptedData = JSON.parse(decryptedDataString);

    // Decrypt title
    const decryptedTitle = await decryptData(item.title_encrypted, privateKey);

    return {
      ...item,
      title: decryptedTitle,
      decrypted_data: decryptedData,
    };
  } catch (error) {
    console.error('Error decrypting vault item:', error);
    throw error;
  }
}

export async function deleteVaultItem(itemId: string, storagePath: string, storageBucket: string) {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(storageBucket)
      .remove([storagePath]);

    if (storageError) console.error('Storage deletion error:', storageError);

    // Delete from database
    const { error } = await supabase
      .from('vault_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting vault item:', error);
    throw error;
  }
}

// =====================================================
// HEIR OPERATIONS
// =====================================================

export async function createHeir(userId: string, heirData: {
  name: string;
  email: string;
  phone?: string;
  relationship?: string;
  accessLevel: string;
}) {
  try {
    // Get user's private key for encryption
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    // Encrypt heir details
    const nameEncrypted = await encryptData(heirData.name, privateKey);
    const emailEncrypted = await encryptData(heirData.email, privateKey);
    const phoneEncrypted = heirData.phone ? await encryptData(heirData.phone, privateKey) : null;
    const relationshipEncrypted = heirData.relationship ? await encryptData(heirData.relationship, privateKey) : null;

    const { data, error } = await supabase
      .from('heirs')
      .insert({
        user_id: userId,
        full_name_encrypted: nameEncrypted,
        email_encrypted: emailEncrypted,
        phone_encrypted: phoneEncrypted,
        relationship_encrypted: relationshipEncrypted,
        access_level: heirData.accessLevel as any,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating heir:', error);
    throw error;
  }
}

export async function getUserHeirs(userId: string) {
  try {
    const { data, error } = await supabase
      .from('heirs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching heirs:', error);
    throw error;
  }
}

export async function getDecryptedHeir(heir: Heir) {
  try {
    const privateKey = await getPrivateKey();
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    const fullName = await decryptData(heir.full_name_encrypted, privateKey);
    const email = await decryptData(heir.email_encrypted, privateKey);
    const phone = heir.phone_encrypted ? await decryptData(heir.phone_encrypted, privateKey) : null;
    const relationship = heir.relationship_encrypted ? await decryptData(heir.relationship_encrypted, privateKey) : null;

    return {
      ...heir,
      full_name: fullName,
      email,
      phone,
      relationship,
    };
  } catch (error) {
    console.error('Error decrypting heir:', error);
    throw error;
  }
}

// =====================================================
// AUDIT LOGGING
// =====================================================

export async function createAuditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, any>
) {
  try {
    await supabase.rpc('create_audit_log', {
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_new_values: metadata || null,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

// =====================================================
// HELPER: Check if Supabase is configured
// =====================================================

export function checkSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase is not configured. Using mock mode.');
    return false;
  }
  return true;
}
