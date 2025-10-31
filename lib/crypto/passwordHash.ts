import * as Crypto from 'expo-crypto';

/**
 * Hash a password using SHA-256 with a salt
 * @param password - The plain text password
 * @param salt - Optional salt (will be generated if not provided)
 * @returns Object containing the hash and salt
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  // Generate salt if not provided (16 bytes = 32 hex characters)
  const passwordSalt = salt || Array.from(
    { length: 32 },
    () => Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Combine password and salt
  const saltedPassword = password + passwordSalt;
  
  // Hash the salted password using SHA-256
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPassword
  );
  
  return {
    hash,
    salt: passwordSalt,
  };
}

/**
 * Verify a password against a stored hash
 * @param password - The plain text password to verify
 * @param storedHash - The stored hash to compare against
 * @param salt - The salt used when creating the hash
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): Promise<boolean> {
  // Hash the provided password with the same salt
  const { hash } = await hashPassword(password, salt);
  
  // Compare the hashes
  return hash === storedHash;
}

/**
 * Generate a random salt
 * @returns A random salt string
 */
export function generateSalt(): string {
  return Array.from(
    { length: 32 },
    () => Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
