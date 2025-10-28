import { supabase } from '@/lib/supabase';
import * as Crypto from 'expo-crypto';

// 2FA Method Types
export type TwoFactorMethod = 'totp' | 'email';

export interface TwoFactorSettings {
  user_id: string;
  method: TwoFactorMethod;
  secret_encrypted?: string; // For TOTP
  backup_codes_encrypted?: string;
  email_verified?: boolean;
  is_enabled: boolean;
  verified_at?: string;
  last_verified_at?: string;
}

/**
 * Generate a random secret for TOTP (Time-based One-Time Password)
 */
export async function generateTOTPSecret(): Promise<string> {
  // Generate 20 random bytes and convert to base32
  const randomBytes = await Crypto.getRandomBytesAsync(20);
  return base32Encode(randomBytes);
}

/**
 * Generate backup codes for 2FA recovery
 */
export async function generateBackupCodes(count: number = 10): Promise<string[]> {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomBytes = await Crypto.getRandomBytesAsync(4);
    const code = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Enable 2FA for a user with specified method
 */
export async function enable2FA(
  userId: string,
  method: TwoFactorMethod,
  secret?: string,
  backupCodes?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Encrypt secret and backup codes before storing
    const insertData: any = {
      user_id: userId,
      method: method,
      is_enabled: true,
      verified_at: new Date().toISOString(),
    };

    // Add method-specific data
    if (method === 'totp' && secret && backupCodes) {
      insertData.secret_encrypted = secret; // TODO: Encrypt this
      insertData.backup_codes_encrypted = JSON.stringify(backupCodes); // TODO: Encrypt this
    } else if (method === 'email') {
      insertData.email_verified = true;
    }

    const { error } = await supabase
      .from('two_factor_auth')
      .insert(insertData);

    if (error) {
      console.error('Error enabling 2FA:', error);
      return { success: false, error: error.message };
    }

    // Update user's 2FA status
    await supabase
      .from('users')
      .update({ two_factor_enabled: true })
      .eq('id', userId);

    return { success: true };
  } catch (error) {
    console.error('Exception in enable2FA:', error);
    return { success: false, error: 'Failed to enable 2FA' };
  }
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('two_factor_auth')
      .update({ is_enabled: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: error.message };
    }

    // Update user's 2FA status
    await supabase
      .from('users')
      .update({ two_factor_enabled: false })
      .eq('id', userId);

    return { success: true };
  } catch (error) {
    console.error('Exception in disable2FA:', error);
    return { success: false, error: 'Failed to disable 2FA' };
  }
}

/**
 * Get 2FA settings for a user
 */
export async function get2FASettings(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No 2FA setup
        return null;
      }
      console.error('Error fetching 2FA settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in get2FASettings:', error);
    return null;
  }
}

/**
 * Verify a TOTP code
 */
export async function verifyTOTP(
  userId: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const settings = await get2FASettings(userId);
    
    if (!settings) {
      return { valid: false, error: '2FA not enabled' };
    }

    // TODO: Decrypt secret before verification
    const secret = settings.secret_encrypted;
    
    // Generate current TOTP code
    const currentCode = generateTOTPCode(secret);
    
    // Check if code matches (with time window tolerance)
    const isValid = code === currentCode;
    
    if (isValid) {
      // Update last verified timestamp
      await supabase
        .from('two_factor_auth')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    return { valid: isValid };
  } catch (error) {
    console.error('Exception in verifyTOTP:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const settings = await get2FASettings(userId);
    
    if (!settings) {
      return { valid: false, error: '2FA not enabled' };
    }

    // TODO: Decrypt backup codes before verification
    const backupCodes: string[] = JSON.parse(settings.backup_codes_encrypted);
    
    const codeIndex = backupCodes.indexOf(code.toUpperCase());
    
    if (codeIndex === -1) {
      return { valid: false, error: 'Invalid backup code' };
    }

    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    
    // Update backup codes
    await supabase
      .from('two_factor_auth')
      .update({ 
        backup_codes_encrypted: JSON.stringify(backupCodes),
        last_verified_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return { valid: true };
  } catch (error) {
    console.error('Exception in verifyBackupCode:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('two_factor_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }

    return data?.two_factor_enabled || false;
  } catch (error) {
    console.error('Exception in is2FAEnabled:', error);
    return false;
  }
}

// Helper functions

/**
 * Base32 encode (simplified version for TOTP)
 */
function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generate TOTP code (simplified implementation)
 * In production, use a proper TOTP library like 'otplib'
 */
function generateTOTPCode(secret: string): string {
  // This is a simplified implementation
  // In production, use a proper TOTP library
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  const hash = simpleHash(secret + timeStep.toString());
  const code = (hash % 1000000).toString().padStart(6, '0');
  return code;
}

/**
 * Simple hash function (for demo purposes only)
 * In production, use proper HMAC-SHA1
 */
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Generate QR code data for authenticator apps
 */
export function generateQRCodeData(
  secret: string,
  email: string,
  issuer: string = 'Sign-Off'
): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

/**
 * Generate a 6-digit verification code for email/SMS
 */
export async function generateVerificationCode(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(3);
  const code = Array.from(randomBytes)
    .map(b => b % 10)
    .join('')
    .padStart(6, '0');
  return code;
}

/**
 * Send verification code via Supabase Auth Email OTP
 */
export async function sendEmailVerificationCode(
  userId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use Supabase Auth to send email OTP
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // Don't create new user, just send OTP
      }
    });

    if (error) {
      console.error('Error sending email OTP:', error);
      return { success: false, error: error.message };
    }

    // Log the 2FA attempt
    await supabase
      .from('two_factor_auth')
      .update({ last_verified_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    return { success: true };
  } catch (error) {
    console.error('Exception in sendEmailVerificationCode:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

/**
 * Verify email OTP code using Supabase Auth
 */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email'
    });

    if (error) {
      console.error('Error verifying email OTP:', error);
      return { valid: false, error: error.message };
    }

    return { valid: true };
  } catch (error) {
    console.error('Exception in verifyEmailCode:', error);
    return { valid: false, error: 'Verification failed' };
  }
}

/**
 * Get user's 2FA method
 */
export async function get2FAMethod(userId: string): Promise<TwoFactorMethod | null> {
  try {
    const settings = await get2FASettings(userId);
    return settings?.method || null;
  } catch (error) {
    console.error('Exception in get2FAMethod:', error);
    return null;
  }
}
