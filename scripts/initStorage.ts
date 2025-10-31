import { initializeStorageBucket } from '../lib/services/fileUploadService';

/**
 * Script to initialize Supabase Storage bucket
 * Run this once to create the vault-files bucket
 */
async function main() {
  console.log('Initializing Supabase Storage bucket...');
  
  const result = await initializeStorageBucket();
  
  if (result.success) {
    console.log('✅ Storage bucket initialized successfully!');
  } else {
    console.error('❌ Failed to initialize storage bucket:', result.error);
  }
}

main();
