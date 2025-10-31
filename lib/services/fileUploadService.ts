import { supabase } from '@/lib/supabase';
import { cleanupOrphanedFiles } from './cleanupOrphanedFiles';

const BUCKET_NAME = 'vault-files';

/**
 * Initialize the storage bucket (run this once)
 */
export async function initializeStorageBucket() {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      // Create bucket with private access
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return { success: false, error };
      }

      console.log('Bucket created successfully');
      return { success: true, data };
    }

    return { success: true, message: 'Bucket already exists' };
  } catch (error) {
    console.error('Error initializing bucket:', error);
    return { success: false, error };
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  userId: string,
  vaultId: string,
  file: File | Blob,
  fileName: string
): Promise<{ success: boolean; url?: string; size?: number; error?: any }> {
  try {
    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${vaultId}/${timestamp}_${sanitizedFileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { success: false, error };
    }

    // Get public URL (signed URL for private bucket)
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 31536000); // 1 year expiry

    // Get file size
    const fileSize = file instanceof File ? file.size : (file as Blob).size;

    // Cleanup orphaned files in the background (don't wait for it)
    cleanupOrphanedFiles(userId).catch(err => {
      console.error('Background cleanup failed:', err);
    });

    return {
      success: true,
      url: urlData?.signedUrl,
      size: fileSize,
    };
  } catch (error) {
    console.error('Error in uploadFile:', error);
    return { success: false, error };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filePath: string, userId?: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return { success: false, error };
    }

    // Cleanup orphaned files in the background if userId is provided
    if (userId) {
      cleanupOrphanedFiles(userId).catch(err => {
        console.error('Background cleanup failed:', err);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteFile:', error);
    return { success: false, error };
  }
}

/**
 * Get a signed URL for a file (for viewing)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: any }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error getting signed URL:', error);
      return { success: false, error };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    return { success: false, error };
  }
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extract file path from URL
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    // Extract path from signed URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/object\/sign\/vault-files\/(.+)/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}
