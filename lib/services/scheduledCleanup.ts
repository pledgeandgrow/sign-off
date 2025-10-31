import { supabase } from '../supabase';

/**
 * SOLUTION POUR MILLIONS D'UTILISATEURS
 * 
 * Au lieu de nettoyer à chaque upload/suppression :
 * - Exécuter ce script via un CRON job (ex: une fois par jour à 3h du matin)
 * - Utiliser Supabase Edge Functions ou un service externe (Vercel Cron, AWS Lambda)
 * - Traiter les utilisateurs par batch pour éviter la saturation
 */

const BATCH_SIZE = 100; // Traiter 100 utilisateurs à la fois
const MAX_FILES_PER_USER = 1000; // Limite de fichiers par utilisateur

/**
 * Clean up orphaned files for all users (batch processing)
 * Should be run as a scheduled job (e.g., daily at 3 AM)
 */
export async function scheduledCleanupAllUsers(): Promise<{
  success: boolean;
  processedUsers: number;
  totalDeleted: number;
  errors: string[];
}> {
  console.log('🕐 Starting scheduled cleanup for all users...');
  
  let processedUsers = 0;
  let totalDeleted = 0;
  const errors: string[] = [];
  
  try {
    // Get all unique user IDs from vault_items
    const { data: users, error: usersError } = await supabase
      .from('vault_items')
      .select('user_id')
      .limit(10000); // Adjust based on your user count

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, processedUsers: 0, totalDeleted: 0, errors: [usersError.message] };
    }

    if (!users || users.length === 0) {
      console.log('No users to process');
      return { success: true, processedUsers: 0, totalDeleted: 0, errors: [] };
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(users.map(u => (u as any).user_id))];
    console.log(`Found ${uniqueUserIds.length} unique users to process`);

    // Process users in batches
    for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
      const batch = uniqueUserIds.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uniqueUserIds.length / BATCH_SIZE)}`);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(userId => cleanupUserFiles(userId as string))
      );

      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          processedUsers++;
          totalDeleted += result.value.deletedCount;
        } else {
          errors.push(result.reason?.message || 'Unknown error');
        }
      }

      // Small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Cleanup complete: ${processedUsers} users processed, ${totalDeleted} files deleted`);
    return { success: true, processedUsers, totalDeleted, errors };

  } catch (error) {
    console.error('Scheduled cleanup error:', error);
    return {
      success: false,
      processedUsers,
      totalDeleted,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Clean up orphaned files for a single user (optimized)
 */
async function cleanupUserFiles(userId: string): Promise<{
  deletedCount: number;
}> {
  try {
    // Get files from storage
    const { data: files, error: listError } = await supabase.storage
      .from('vault-files')
      .list(`${userId}`, {
        limit: MAX_FILES_PER_USER,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError || !files || files.length === 0) {
      return { deletedCount: 0 };
    }

    // Get referenced files from database (optimized query)
    const { data: vaultItems, error: dbError } = await supabase
      .from('vault_items')
      .select('metadata')
      .eq('user_id', userId)
      .not('metadata->fileUrl', 'is', null); // Only get items with files

    if (dbError) {
      console.error(`Error fetching items for user ${userId}:`, dbError);
      return { deletedCount: 0 };
    }

    // Extract referenced paths
    const referencedPaths = new Set<string>();
    if (vaultItems && vaultItems.length > 0) {
      for (const item of vaultItems as any[]) {
        if (item.metadata && item.metadata.fileUrl) {
          try {
            const url = item.metadata.fileUrl;
            const urlParts = url.split('/');
            const pathIndex = urlParts.findIndex((part: string) => part === 'vault-files');
            
            if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
              const pathParts = urlParts.slice(pathIndex + 1);
              const fullPath = pathParts.join('/').split('?')[0];
              referencedPaths.add(fullPath);
            }
          } catch (err) {
            // Skip invalid URLs
          }
        }
      }
    }

    // Find orphaned files
    const orphanedFiles: string[] = [];
    for (const file of files) {
      const filePath = `${userId}/${file.name}`;
      if (!referencedPaths.has(filePath)) {
        orphanedFiles.push(filePath);
      }
    }

    // Delete orphaned files in batches of 100
    let deletedCount = 0;
    if (orphanedFiles.length > 0) {
      for (let i = 0; i < orphanedFiles.length; i += 100) {
        const batch = orphanedFiles.slice(i, i + 100);
        const { error: deleteError } = await supabase.storage
          .from('vault-files')
          .remove(batch);

        if (!deleteError) {
          deletedCount += batch.length;
        }
      }
    }

    return { deletedCount };

  } catch (error) {
    console.error(`Error cleaning up user ${userId}:`, error);
    return { deletedCount: 0 };
  }
}

/**
 * Clean up orphaned files for a specific user (on-demand)
 * Use this for manual cleanup or when a user requests it
 */
export async function cleanupUserOrphanedFiles(userId: string): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    const result = await cleanupUserFiles(userId);
    return { success: true, deletedCount: result.deletedCount };
  } catch (error) {
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
