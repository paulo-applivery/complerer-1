-- ============================================================
-- ENS framework layer extensions (Phase 1 of ENS adaptation).
--
-- Adds optional, framework-agnostic JSON columns to versioned_controls
-- so ENS-specific concepts (control type, group, applicability per
-- system category, AAPP-only flag, evaluated_aspects, reinforcements)
-- can ride on the existing table without disturbing other frameworks.
--
-- Phase 2 promotes reinforcements + evaluated_aspects to dedicated
-- relational tables; Phase 1 keeps them as embedded JSON for speed.
-- ============================================================

-- 1. Per-control extensions
ALTER TABLE versioned_controls ADD COLUMN control_type TEXT;
  -- ARTICULO | ADENDA | MEDIDA  (NULL for non-ENS frameworks)

ALTER TABLE versioned_controls ADD COLUMN control_group TEXT;
  -- ENS group code: org, op.pl, op.acc, op.exp, op.ext, op.nub,
  -- op.cont, op.mon, mp.if, mp.per, mp.eq, mp.com, mp.si, mp.sw,
  -- mp.info, mp.s.  NULL for non-ENS frameworks.

ALTER TABLE versioned_controls ADD COLUMN applicability_json TEXT;
  -- JSON: { "basica": "aplica" | "n.a." | "+R1+R2" | "+[R1 o R2]",
  --         "media":  "...",
  --         "alta":   "..." }

ALTER TABLE versioned_controls ADD COLUMN reinforcements_json TEXT NOT NULL DEFAULT '[]';
  -- JSON array of { id, description, required_at: ["BASICA"|"MEDIA"|"ALTA"], mode: "ADDITIVE"|"EXCLUSIVE_OR" }

ALTER TABLE versioned_controls ADD COLUMN evaluated_aspects_json TEXT NOT NULL DEFAULT '[]';
  -- JSON array of { id, question, reinforcement_ref: "R1"|null }

ALTER TABLE versioned_controls ADD COLUMN aapp_only INTEGER NOT NULL DEFAULT 0;
  -- 1 = restricted to Spanish public administrations.

CREATE INDEX IF NOT EXISTS idx_vc_control_type ON versioned_controls(control_type);
CREATE INDEX IF NOT EXISTS idx_vc_control_group ON versioned_controls(control_group);

-- 2. Framework-level metadata extensions for ENS-style frameworks
ALTER TABLE framework_versions ADD COLUMN system_categories_json TEXT;
  -- JSON array, e.g. ["BASICA","MEDIA","ALTA"].

ALTER TABLE framework_versions ADD COLUMN security_dimensions_json TEXT;
  -- JSON array, e.g. ["C","I","T","A","D"] (CITAD).

ALTER TABLE framework_versions ADD COLUMN authority TEXT;
  -- Issuing authority, e.g. "CCN — Centro Criptológico Nacional".

ALTER TABLE framework_versions ADD COLUMN jurisdiction TEXT;
  -- ISO country code, e.g. "ES".
