-- Add mode column to groups table
ALTER TABLE groups ADD COLUMN mode VARCHAR(20) DEFAULT 'classic';

-- Add a check constraint to ensure mode is either 'classic' or 'party'
ALTER TABLE groups ADD CONSTRAINT groups_mode_check CHECK (mode IN ('classic', 'party'));

-- Update existing groups to have 'classic' mode by default
UPDATE groups SET mode = 'classic' WHERE mode IS NULL;
