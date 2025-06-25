export interface SignOffSettings {
  // How to determine if user has passed away
  inactivityCheck: {
    enabled: boolean;
    daysOfInactivity: number;
    checkFrequency: 'daily' | 'weekly' | 'monthly';
  };
  
  // Notification methods
  notifications: {
    email: {
      enabled: boolean;
      recipients: string[];
      message: string;
    };
    sms: {
      enabled: boolean;
      phoneNumbers: string[];
      message: string;
    };
    socialMedia: {
      enabled: boolean;
      platforms: Array<{
        name: string;
        enabled: boolean;
        message: string;
      }>;
    };
  };

  // Digital legacy
  digitalLegacy: {
    dataHandling: 'delete' | 'transfer' | 'archive';
    recipients: Array<{
      name: string;
      email: string;
      relationship: string;
      accessLevel: 'full' | 'partial' | 'view';
    }>;
    messageToHeirs: string;
  };

  // Posthumous messages
  posthumousMessages: Array<{
    id: string;
    recipient: string;
    deliveryMethod: 'email' | 'letter' | 'video';
    deliveryTrigger: 'immediately' | 'after_x_days' | 'specific_date';
    deliveryDate?: string;
    daysAfterDeath?: number;
    message: string;
    isScheduled: boolean;
  }>;

  // Account actions
  accountActions: {
    closeAccounts: boolean;
    accountsToClose: string[];
    donation: {
      enabled: boolean;
      organizations: Array<{
        name: string;
        website: string;
        amount?: number;
      }>;
    };
  };

  // Verification settings
  verification: {
    required: boolean;
    method: 'email' | 'sms' | 'trustedContact';
    trustedContacts: string[];
    verificationWindowDays: number;
  };

  // Legal documents
  legalDocuments: {
    willAttached: boolean;
    poaAttached: boolean;
    livingWillAttached: boolean;
  };

  // Last updated timestamp
  lastUpdated: string;
}
