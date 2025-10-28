/**
 * Application Constants
 */

// Square Payment Configuration
export const SQUARE_CONFIG = {
  APPLICATION_ID: 'sq0idp-jpFZB2pxUF4-CyhKx02Kkg',
  PAYMENT_LINK: 'https://checkout.square.site/merchant/MLGQSKF7STJBT/checkout/73D46ODGSESZ6YTXMVZH3N3P',
  MERCHANT_ID: 'MLGQSKF7STJBT',
  CHECKOUT_ID: '73D46ODGSESZ6YTXMVZH3N3P',
} as const;

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
} as const;

// Subscription Pricing
export const SUBSCRIPTION_PRICING = {
  PREMIUM: {
    amount: 10.00,
    currency: 'EUR',
    interval: 'monthly',
  },
} as const;

// Free Tier Limits
export const FREE_TIER_LIMITS = {
  MAX_VAULTS: 3,
  MAX_HEIRS: 3,
  MAX_ITEMS_PER_VAULT: 50,
} as const;

// Premium Tier Features
export const PREMIUM_FEATURES = [
  'Unlimited vaults',
  'Unlimited heirs',
  'Unlimited items per vault',
  'Two-factor authentication',
  'Advanced sharing features',
  'Priority support',
  'Advanced security features',
] as const;

// App Colors
export const COLORS = {
  premium: '#FFD700', // Gold
  free: '#6B7280', // Gray
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
} as const;
