import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Aes from 'react-native-aes-crypto';

// Constants
const PRIVATE_KEY_STORAGE = 'user_private_key';
const PUBLIC_KEY_STORAGE = 'user_public_key';
const ENCRYPTION_ALGORITHM = Crypto.CryptoDigestAlgorithm.SHA256;

/**
 * PRODUCTION-READY ENCRYPTION
 * Using AES-256-CBC with PBKDF2 key derivation
 * 
 * Security features:
 * - AES-256-CBC encryption
 * - PBKDF2 key derivation (5000 iterations)
 * - Random IV for each encryption
 * - Secure key storage in device secure storage
 */

/**
 * Generate a cryptographic key pair
 * In production: Use proper RSA-4096 or at minimum AES-256
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  // Generate a random 256-bit master key
  const masterKeyBytes = await Crypto.getRandomBytesAsync(32);
  const masterKey = Buffer.from(masterKeyBytes).toString('base64');
  
  // Derive public key identifier (used for key lookup, not encryption)
  const publicKey = await Crypto.digestStringAsync(
    ENCRYPTION_ALGORITHM,
    masterKey + '_public_' + Date.now()
  );
  
  // Private key is the master key
  const privateKey = masterKey;
  
  return { publicKey, privateKey };
}

/**
 * Encrypt data using AES-256-CBC
 * 
 * PRODUCTION-READY: Uses react-native-aes-crypto
 * 
 * @param plaintext - Data to encrypt
 * @param key - Encryption key (base64 encoded)
 * @returns Encrypted data in format: iv:ciphertext (both base64)
 */
export async function encryptData(plaintext: string, key: string): Promise<string> {
  if (!plaintext) return '';
  
  try {
    // Generate a random salt for key derivation
    const salt = await Crypto.getRandomBytesAsync(16);
    const saltString = Buffer.from(salt).toString('hex');
    
    // Generate a random IV (Initialization Vector)
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivString = Buffer.from(iv).toString('hex');
    
    // Derive a 256-bit key using PBKDF2
    const derivedKey = await Aes.pbkdf2(key, saltString, 5000, 256, 'sha256');
    
    // Encrypt using AES-256-CBC
    const encrypted = await Aes.encrypt(plaintext, derivedKey, ivString, 'aes-256-cbc');
    
    // Combine salt, IV, and encrypted data
    return `${saltString}:${ivString}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-CBC
 * 
 * PRODUCTION-READY: Uses react-native-aes-crypto
 * 
 * @param encrypted - Encrypted data in format: salt:iv:ciphertext
 * @param key - Decryption key (base64 encoded)
 * @returns Decrypted plaintext
 */
export async function decryptData(encrypted: string, key: string): Promise<string> {
  if (!encrypted) return '';
  
  try {
    // Split salt, IV, and encrypted data
    const parts = encrypted.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected: salt:iv:ciphertext');
    }
    
    const [saltString, ivString, encryptedData] = parts;
    
    // Derive the same key used for encryption
    const derivedKey = await Aes.pbkdf2(key, saltString, 5000, 256, 'sha256');
    
    // Decrypt using AES-256-CBC
    const decrypted = await Aes.decrypt(encryptedData, derivedKey, ivString, 'aes-256-cbc');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. The data may be corrupted or the key is incorrect.');
  }
}

/**
 * Store private key securely in device secure storage
 */
export async function storePrivateKey(privateKey: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE, privateKey);
  } catch (error) {
    console.error('Failed to store private key:', error);
    throw new Error('Failed to store private key securely');
  }
}

/**
 * Retrieve private key from secure storage
 */
export async function getPrivateKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
  } catch (error) {
    console.error('Failed to retrieve private key:', error);
    return null;
  }
}

/**
 * Store public key
 */
export async function storePublicKey(publicKey: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE, publicKey);
  } catch (error) {
    console.error('Failed to store public key:', error);
    throw new Error('Failed to store public key');
  }
}

/**
 * Retrieve public key
 */
export async function getPublicKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
  } catch (error) {
    console.error('Failed to retrieve public key:', error);
    return null;
  }
}

/**
 * Delete all stored keys (for logout/account deletion)
 */
export async function deleteStoredKeys(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PRIVATE_KEY_STORAGE);
    await SecureStore.deleteItemAsync(PUBLIC_KEY_STORAGE);
  } catch (error) {
    console.error('Failed to delete stored keys:', error);
  }
}

/**
 * Encrypt private key with a recovery passphrase
 */
export async function encryptPrivateKeyWithPassphrase(
  privateKey: string,
  passphrase: string
): Promise<string> {
  // Hash the passphrase to create a key
  const keyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    passphrase
  );
  
  // Encrypt the private key with the hashed passphrase
  return encryptData(privateKey, keyHash);
}

/**
 * Decrypt private key with a recovery passphrase
 */
export async function decryptPrivateKeyWithPassphrase(
  encryptedPrivateKey: string,
  passphrase: string
): Promise<string> {
  // Hash the passphrase to create a key
  const keyHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    passphrase
  );
  
  // Decrypt the private key with the hashed passphrase
  return decryptData(encryptedPrivateKey, keyHash);
}

/**
 * Generate a hash of data (for password strength checking, etc.)
 */
export async function hashData(data: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
}

/**
 * Calculate password strength (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
  
  return Math.min(strength, 100);
}

/**
 * Generate a random secure password
 */
export async function generateSecurePassword(length: number = 16): Promise<string> {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}
