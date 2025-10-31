-- Add In-App Purchase fields to subscriptions table
-- This migration adds support for mobile IAP (Google Play & App Store)

-- Add new columns for IAP
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS store_transaction_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS store_product_id TEXT,
ADD COLUMN IF NOT EXISTS store_platform TEXT CHECK (store_platform IN ('ios', 'android', 'web')),
ADD COLUMN IF NOT EXISTS receipt_data TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction 
ON subscriptions(store_transaction_id) 
WHERE store_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_platform 
ON subscriptions(store_platform) 
WHERE store_platform IS NOT NULL;

-- Add comment
COMMENT ON COLUMN subscriptions.store_transaction_id IS 'Transaction ID from App Store or Google Play';
COMMENT ON COLUMN subscriptions.store_product_id IS 'Product ID (e.g., premium_monthly, com.signoff.premium.yearly)';
COMMENT ON COLUMN subscriptions.store_platform IS 'Platform where purchase was made (ios, android, web)';
COMMENT ON COLUMN subscriptions.receipt_data IS 'Receipt data for verification (encrypted)';
