-- Add metadata column to vault_items table
ALTER TABLE vault_items 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index on metadata for better query performance
CREATE INDEX IF NOT EXISTS idx_vault_items_metadata ON vault_items USING gin(metadata);

-- Add comment
COMMENT ON COLUMN vault_items.metadata IS 'Stores item-specific metadata like file URLs, passwords, notes, etc.';
