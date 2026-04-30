-- ============================================================
-- Phase 3: ENS audit-instance layer.
--
-- Models a concrete ENS audit cycle on top of the framework layer:
-- system categorization (CITAD), per-control results, per-aspect
-- checked state, findings (NC mayor / NC menor / OBS / PM), and
-- the corrective action package (PAC).
--
-- An ENS audit binds to an existing compliance_projects row so all
-- the workspace evidence-linking machinery stays reusable.
-- ============================================================

-- ── CITAD valuation per ENS audit ───────────────────────────

CREATE TABLE IF NOT EXISTS ens_citad_valuations (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,                   -- references ens_audits(id) created below
  service_name TEXT NOT NULL,               -- name of the service or information asset valued
  service_kind TEXT NOT NULL,               -- 'service' | 'information'
  c_value TEXT,                              -- BAJO | MEDIO | ALTO | NULL
  i_value TEXT,
  t_value TEXT,
  a_value TEXT,
  d_value TEXT,
  derived_category TEXT,                    -- BASICA | MEDIA | ALTA (computed)
  justification TEXT,
  valued_by TEXT,                           -- name/role of the person who valued
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ens_citad_audit ON ens_citad_valuations(audit_id);

-- ── ENS Audit (one per cycle, hangs off a compliance project) ──

CREATE TABLE IF NOT EXISTS ens_audits (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  project_id TEXT NOT NULL REFERENCES compliance_projects(id) ON DELETE CASCADE,
  framework_version_id TEXT NOT NULL REFERENCES framework_versions(id),
  cycle_label TEXT NOT NULL,                -- e.g. "Auditoría 2026-Q1", "Certificación inicial"
  audit_type TEXT NOT NULL DEFAULT 'inicial', -- inicial | renovacion | seguimiento | interna
  scope_description TEXT,
  system_category TEXT NOT NULL DEFAULT 'BASICA', -- BASICA | MEDIA | ALTA (highest CITAD)
  is_aapp INTEGER NOT NULL DEFAULT 0,       -- 1 if entity is a Spanish public administration
  auditor_name TEXT,
  auditor_firm TEXT,
  auditor_qualification TEXT,
  auditor_independence_confirmed INTEGER NOT NULL DEFAULT 0,
  fieldwork_started_at TEXT,
  fieldwork_finished_at TEXT,
  report_issued_at TEXT,
  status TEXT NOT NULL DEFAULT 'planning',  -- planning | fieldwork | drafting | reported | closed
  overall_verdict TEXT,                     -- FAVORABLE | FAVORABLE_CON_NO_CONFORMIDADES | DESFAVORABLE | NULL
  verdict_reasoning TEXT,
  pac_required INTEGER NOT NULL DEFAULT 0,
  next_finding_seq_nc INTEGER NOT NULL DEFAULT 1,   -- counter for NC## display IDs
  next_finding_seq_obs INTEGER NOT NULL DEFAULT 1,  -- counter for OBS## display IDs
  next_finding_seq_pm INTEGER NOT NULL DEFAULT 1,   -- counter for PM## display IDs
  created_by TEXT NOT NULL REFERENCES auth_users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ens_audit_ws ON ens_audits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ens_audit_project ON ens_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_ens_audit_status ON ens_audits(workspace_id, status);

-- ── Per-control audit result ───────────────────────────────

CREATE TABLE IF NOT EXISTS ens_audit_results (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES ens_audits(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL REFERENCES versioned_controls(id),
  applies INTEGER NOT NULL DEFAULT 1,         -- ☒/☐ APLICA
  applies_justification TEXT,                  -- required when applies=0
  audited INTEGER NOT NULL DEFAULT 0,         -- ☒/☐ AUDITADA
  maturity_level TEXT,                         -- L0..L5 (CCN-STIC 804)
  required_maturity TEXT,                      -- L2 (BASICA) / L3 (MEDIA) / L4 (ALTA)
  implementation_notes TEXT,                   -- evidence narrative
  evidence_refs_json TEXT NOT NULL DEFAULT '[]', -- array of URIs/document IDs cited
  selected_reinforcements_json TEXT NOT NULL DEFAULT '[]', -- e.g. ["R1","R3"] when EXCLUSIVE_OR
  data_quality_flags_json TEXT NOT NULL DEFAULT '[]',
    -- array of strings: EXEC_SUMMARY_MISSING_PER_CONTROL_FINDING,
    -- PER_CONTROL_MISSING_EXEC_FINDING, SEVERITY_DISPLAY_MISMATCH,
    -- EXISTEN_FALSE_BUT_CATEGORY_CHECKED
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(audit_id, control_id)
);
CREATE INDEX IF NOT EXISTS idx_ens_result_audit ON ens_audit_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_ens_result_control ON ens_audit_results(control_id);

-- ── Per-aspect (checklist question) result ─────────────────

CREATE TABLE IF NOT EXISTS ens_aspect_results (
  id TEXT PRIMARY KEY,
  audit_result_id TEXT NOT NULL REFERENCES ens_audit_results(id) ON DELETE CASCADE,
  aspect_id TEXT NOT NULL,                    -- references control_evaluated_aspects.aspect_id
  checked INTEGER NOT NULL DEFAULT 0,         -- 1 if the aspect is evidenced
  evidence_note TEXT,                          -- short comment scoped to this question
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(audit_result_id, aspect_id)
);
CREATE INDEX IF NOT EXISTS idx_ens_aspect_result ON ens_aspect_results(audit_result_id);

-- ── Findings ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ens_findings (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL REFERENCES ens_audits(id) ON DELETE CASCADE,
  audit_result_id TEXT REFERENCES ens_audit_results(id) ON DELETE SET NULL,
  control_id TEXT REFERENCES versioned_controls(id),
  display_id TEXT NOT NULL,                   -- e.g. NC1, NC23, OBS4, PM2 (audit-local)
  global_finding_id TEXT NOT NULL UNIQUE,     -- UUID for cross-audit trend reporting
  severity TEXT NOT NULL,                     -- NO_CONFORMIDAD_MAYOR | NO_CONFORMIDAD_MENOR | OBSERVACION | PUNTO_DE_MEJORA
  exists_flag INTEGER NOT NULL DEFAULT 1,     -- ☒/☐ EXISTEN
  description TEXT NOT NULL,
  recommendation TEXT,
  pac_required INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open',        -- open | in_remediation | remediated | validated | accepted | closed
  surfaces_in_executive_summary INTEGER NOT NULL DEFAULT 1,
  raised_at TEXT NOT NULL,
  closed_at TEXT,
  created_by TEXT REFERENCES auth_users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ens_finding_audit ON ens_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_ens_finding_control ON ens_findings(control_id);
CREATE INDEX IF NOT EXISTS idx_ens_finding_status ON ens_findings(audit_id, status);

-- ── PAC: corrective action package ─────────────────────────

CREATE TABLE IF NOT EXISTS ens_pac (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL REFERENCES ens_findings(id) ON DELETE CASCADE,
  analysis TEXT,                              -- root cause analysis
  proposed_remediation TEXT,
  execution_evidence TEXT,
  effectiveness_check TEXT,
  responsible_party TEXT,
  due_date TEXT,
  completed_at TEXT,
  validated_at TEXT,
  validated_by TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',    -- proposed | in_progress | completed | validated | rejected
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(finding_id)
);
CREATE INDEX IF NOT EXISTS idx_ens_pac_finding ON ens_pac(finding_id);
