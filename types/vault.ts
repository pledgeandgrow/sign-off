export type VaultItemType = 'password' | 'document' | 'video' | 'image' | 'note' | 'crypto' | 'bank' | 'other';

export type VaultCategory = 'delete_after_death' | 'share_after_death' | 'handle_after_death' | 'sign_off_after_death';

export type VaultEncryptionType = 'none' | 'password' | 'biometric' | 'both';

export interface BaseMetadata {
  [key: string]: any;
}

export interface PasswordMetadata extends BaseMetadata {
  username?: string;
  password?: string;
  url?: string;
}

export interface DocumentMetadata extends BaseMetadata {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface MediaMetadata extends BaseMetadata {
  fileName?: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // For videos
}

export type VaultItemMetadata = 
  | PasswordMetadata
  | DocumentMetadata
  | MediaMetadata;

export interface VaultItem {
  id: string;
  title: string;
  type: VaultItemType;
  createdAt: string;
  updatedAt: string;
  metadata: VaultItemMetadata;
  isEncrypted: boolean;
  encryptedFields?: string[];
  tags?: string[];
}

export interface Vault {
  id: string;
  name: string;
  description?: string;
  category: VaultCategory;
  icon?: string;
  color?: string;
  isEncrypted: boolean;
  encryptionType: VaultEncryptionType;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  items: VaultItem[];
  settings: {
    autoLock: boolean;
    autoLockTimeout: number; // in minutes
    maxFailedAttempts: number;
    allowedIps?: string[];
    twoFactorEnabled: boolean;
  };
  accessControl: {
    allowedUsers: string[]; // user IDs
    allowedHeirs: string[]; // heir IDs
    requireApproval: boolean;
  };
  deathSettings: {
    triggerAfterDays: number;
    notifyContacts: boolean;
    notifyEmail: string[];
    notifySMS: string[];
    instructions: string;
    executorId?: string; // ID of the heir or executor
  };
  tags?: string[];
}
