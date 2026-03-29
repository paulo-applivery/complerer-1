-- Add explicit status column with full lifecycle
ALTER TABLE access_records ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Audit trail columns
ALTER TABLE access_records ADD COLUMN updated_at TEXT;
ALTER TABLE access_records ADD COLUMN updated_by TEXT;

-- Cost mapping columns
ALTER TABLE access_records ADD COLUMN license_type TEXT;
ALTER TABLE access_records ADD COLUMN cost_per_period REAL;
ALTER TABLE access_records ADD COLUMN cost_currency TEXT DEFAULT 'USD';
ALTER TABLE access_records ADD COLUMN cost_frequency TEXT;

-- Backfill status from revoked_at
UPDATE access_records SET status = 'revoked' WHERE revoked_at IS NOT NULL;
UPDATE access_records SET status = 'active' WHERE revoked_at IS NULL;

-- Index on new status column
CREATE INDEX idx_ar_ws_status ON access_records(workspace_id, status);
