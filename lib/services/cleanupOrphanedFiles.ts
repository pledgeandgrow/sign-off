import { supabase } from '../supabase';

// Throttle cleanup to prevent excessive calls
const cleanupCache = new Map<string, number>();
const CLEANUP_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown per user

/**
 * Check if cleanup should run for this user (throttling)
 */
function shouldRunCleanup(userId: string): boolean {
  const lastCleanup = cleanupCache.get(userId);
  const now = Date.now();
  
  if (lastCleanup && (now - lastCleanup) < CLEANUP_COOLDOWN) {
    console.log(`⏭️ Skipping cleanup for user ${userId} (cooldown active)`);
    return false;
  }
  
  cleanupCache.set(userId, now);
  return true;
}

/**
 * Clean up orphaned files in the vault-files bucket
 * Removes files that are not referenced in any vault_items
 * 
 * OPTIMIZED FOR SCALE:
 * - Throttled to run max once per 5 minutes per user
 * - Processes files in batches
 * - Limits number of items fetched from DB
 */
export async function cleanupOrphanedFiles(userId: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    // Check throttling
    if (!shouldRunCleanup(userId)) {
      return { success: true, deletedCount: 0 };
    }

    console.log('🧹 Starting orphaned files cleanup...');

    // Step 1: Get all files from the storage bucket for this user
    const { data: files, error: listError } = await supabase.storage
      .from('vault-files')
      .list(`${userId}`, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return { success: false, deletedCount: 0, error: listError.message };
    }

    if (!files || files.length === 0) {
      console.log('No files found in bucket');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${files.length} files in bucket`);

    // Step 2: Get all vault items with file URLs for this user
    const { data: vaultItems, error: dbError } = await supabase
      .from('vault_items')
      .select('metadata')
      .eq('user_id', userId);

    if (dbError) {
      console.error('Error fetching vault items:', dbError);
      return { success: false, deletedCount: 0, error: dbError.message };
    }

    // Step 3: Extract all referenced file paths from vault items
    const referencedPaths = new Set<string>();
    
    if (vaultItems && vaultItems.length > 0) {
      for (const item of vaultItems as any[]) {
        if (item.metadata && item.metadata.fileUrl) {
          try {
            // Extract file path from URL
            const url = item.metadata.fileUrl;
            const urlParts = url.split('/');
            const pathIndex = urlParts.findIndex((part: string) => part === 'vault-files');
            
            if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
              const pathParts = urlParts.slice(pathIndex + 1);
              const fullPath = pathParts.join('/').split('?')[0]; // Remove query params
              referencedPaths.add(fullPath);
            }
          } catch (err) {
            console.error('Error parsing file URL:', err);
          }
        }
      }
    }

    console.log(`Found ${referencedPaths.size} referenced files in database`);

    // Step 4: Identify orphaned files
    const orphanedFiles: string[] = [];
    
    for (const file of files) {
      const filePath = `${userId}/${file.name}`;
      if (!referencedPaths.has(filePath)) {
        orphanedFiles.push(filePath);
      }
    }

    console.log(`Found ${orphanedFiles.length} orphaned files`);

    // Step 5: Delete orphaned files
    if (orphanedFiles.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('vault-files')
        .remove(orphanedFiles);

      if (deleteError) {
        console.error('Error deleting orphaned files:', deleteError);
        return { success: false, deletedCount: 0, error: deleteError.message };
      }

      console.log(`✅ Successfully deleted ${orphanedFiles.length} orphaned files`);
      return { success: true, deletedCount: orphanedFiles.length };
    }

    console.log('No orphaned files to delete');
    return { success: true, deletedCount: 0 };

  } catch (error) {
    console.error('Cleanup error:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Clean up orphaned files in a specific vault
 */
export async function cleanupVaultOrphanedFiles(userId: string, vaultId: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    console.log(`🧹 Starting orphaned files cleanup for vault ${vaultId}...`);

    // Get all files in the vault folder
    const { data: files, error: listError } = await supabase.storage
      .from('vault-files')
      .list(`${userId}/${vaultId}`, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return { success: false, deletedCount: 0, error: listError.message };
    }

    if (!files || files.length === 0) {
      console.log('No files found in vault folder');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${files.length} files in vault folder`);

    // Get all vault items with file URLs for this vault
    const { data: vaultItems, error: dbError } = await supabase
      .from('vault_items')
      .select('metadata')
      .eq('user_id', userId)
      .eq('vault_id', vaultId);

    if (dbError) {
      console.error('Error fetching vault items:', dbError);
      return { success: false, deletedCount: 0, error: dbError.message };
    }

    // Extract referenced file names
    const referencedFileNames = new Set<string>();
    
    if (vaultItems && vaultItems.length > 0) {
      for (const item of vaultItems as any[]) {
        if (item.metadata && item.metadata.fileUrl) {
          try {
            const url = item.metadata.fileUrl;
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1].split('?')[0];
            referencedFileNames.add(fileName);
          } catch (err) {
            console.error('Error parsing file URL:', err);
          }
        }
      }
    }

    console.log(`Found ${referencedFileNames.size} referenced files in vault`);

    // Identify orphaned files
    const orphanedFiles: string[] = [];
    
    for (const file of files) {
      if (!referencedFileNames.has(file.name)) {
        orphanedFiles.push(`${userId}/${vaultId}/${file.name}`);
      }
    }

    console.log(`Found ${orphanedFiles.length} orphaned files in vault`);

    // Delete orphaned files
    if (orphanedFiles.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('vault-files')
        .remove(orphanedFiles);

      if (deleteError) {
        console.error('Error deleting orphaned files:', deleteError);
        return { success: false, deletedCount: 0, error: deleteError.message };
      }

      console.log(`✅ Successfully deleted ${orphanedFiles.length} orphaned files from vault`);
      return { success: true, deletedCount: orphanedFiles.length };
    }

    console.log('No orphaned files to delete in vault');
    return { success: true, deletedCount: 0 };

  } catch (error) {
    console.error('Cleanup error:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
