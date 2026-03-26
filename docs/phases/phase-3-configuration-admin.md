# Phase 3 — Configuration & Admin (with Compliance Snapshots)

**Timeline:** Week 7-8
**Depends on:** Phase 2 (access register, evidence links, compliance events)
**Goal:** Build the admin layer — baselines, risk register, policy vault, RBAC — plus the compliance snapshot system for tamper-evident, point-in-time audit artifacts.

---

## 3.1 Compliance Baselines

### Why
"Compliant" means different things to different orgs. Baselines are workspace-defined rules that the system evaluates continuously. They power the compliance posture score.

### Database Tables

#### `baselines`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `name` | TEXT | Human-readable name |
| `description` | TEXT | |
| `category` | TEXT | access / review / authentication / change_management |
| `rule_type` | TEXT | threshold / boolean / schedule |
| `rule_config` | TEXT (JSON) | Rule definition (see below) |
| `severity` | TEXT | critical / high / medium / low |
| `enabled` | BOOLEAN | |
| `created_by` | TEXT | FK → auth_users.id |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `baseline_violations`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `baseline_id` | TEXT | FK → baselines.id |
| `entity_type` | TEXT | access_record / system / user |
| `entity_id` | TEXT | ID of violating entity |
| `violation_detail` | TEXT (JSON) | What specifically violated |
| `status` | TEXT | open / acknowledged / resolved / exempted |
| `resolved_at` | TEXT (ISO 8601) | |
| `resolved_by` | TEXT | |
| `exemption_reason` | TEXT | |
| `detected_at` | TEXT (ISO 8601) | |

### Rule Config Examples
```json
// "All prod access requires 2 approvers"
{
  "field": "approved_by",
  "condition": "is_not_null",
  "scope": { "system_classification": "critical" }
}

// "Access reviewed quarterly"
{
  "field": "reviewed_at",
  "condition": "within_days",
  "value": 90,
  "scope": { "access_type": "permanent" }
}

// "MFA enforced for all external systems"
{
  "field": "mfa_required",
  "condition": "equals",
  "value": true,
  "scope": { "system_environment": "production" }
}
```

### Tasks
- [ ] Create D1 migration: `0017_create_baselines.sql`
- [ ] Create D1 migration: `0018_create_baseline_violations.sql`
- [ ] Implement baseline rule engine: evaluate rules against access records/systems
- [ ] Create default baseline templates (10 common rules) seeded on workspace creation
- [ ] Implement baseline CRUD API endpoints
- [ ] Implement violation detection: run baselines on data change or scheduled sweep
- [ ] Implement violation management: acknowledge, resolve, exempt
- [ ] Build baseline evaluation as a CF Queue consumer (runs async after data changes)
- [ ] Calculate compliance posture score: `(total_records - violations) / total_records` per baseline category
- [ ] Write tests: create baseline → create violating record → verify violation detected

### Deliverables
- Workspace-defined compliance rules
- Automatic violation detection
- Compliance posture score computation

---

## 3.2 Risk Register

### Why
Risk-based prioritization tells users what to fix first. Assets x threats x likelihood x impact = risk score.

### Database Tables

#### `risk_entries`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `title` | TEXT | Risk title |
| `description` | TEXT | |
| `asset` | TEXT | What's at risk |
| `asset_ref` | TEXT | FK → systems.id or other entity |
| `threat` | TEXT | Threat description |
| `vulnerability` | TEXT | Vulnerability description |
| `likelihood` | INTEGER | 1-5 scale |
| `impact` | INTEGER | 1-5 scale |
| `inherent_risk` | INTEGER | likelihood x impact (computed) |
| `controls_applied` | TEXT (JSON) | Array of control_ids mitigating this |
| `residual_likelihood` | INTEGER | After controls |
| `residual_impact` | INTEGER | After controls |
| `residual_risk` | INTEGER | Computed |
| `risk_owner` | TEXT | FK → directory_users.id |
| `treatment` | TEXT | mitigate / accept / transfer / avoid |
| `status` | TEXT | open / mitigated / accepted / closed |
| `review_date` | TEXT (ISO 8601) | Next review |
| `created_by` | TEXT | FK → auth_users.id |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0019_create_risk_entries.sql`
- [ ] Implement risk CRUD API endpoints
- [ ] Implement risk score computation (likelihood x impact)
- [ ] Link risks to controls: which controls mitigate which risks
- [ ] Create risk heatmap data endpoint (for dashboard visualization)
- [ ] Add risk review reminders (feed into notification system later)
- [ ] Write Zod schemas for risk entities

### Deliverables
- Full risk register with quantitative scoring
- Linkage between risks and mitigating controls

---

## 3.3 Policy Vault

### Why
Policies are the documented proof of intent. Auditors check policies against controls. Users need to upload, version, and map policies to controls.

### Database Tables

#### `policies`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `title` | TEXT | Policy title |
| `description` | TEXT | |
| `category` | TEXT | access / security / privacy / hr / incident / ... |
| `version` | TEXT | e.g. "2.1" |
| `status` | TEXT | draft / active / under_review / archived |
| `file_ref` | TEXT | R2 object key (PDF/MDX) |
| `file_name` | TEXT | |
| `content_text` | TEXT | Extracted text for AI analysis |
| `owner_id` | TEXT | FK → directory_users.id |
| `approved_by` | TEXT | FK → directory_users.id |
| `approved_at` | TEXT (ISO 8601) | |
| `review_cycle_days` | INTEGER | e.g. 365 for annual review |
| `next_review_at` | TEXT (ISO 8601) | |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `policy_controls`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `policy_id` | TEXT | FK → policies.id |
| `control_id` | TEXT | FK → versioned_controls.id (pinned to specific version) |
| `coverage` | TEXT | full / partial |
| `notes` | TEXT | |
| `created_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0020_create_policies.sql`
- [ ] Create D1 migration: `0021_create_policy_controls.sql`
- [ ] Implement policy upload flow (PDF → R2, extract text for AI analysis)
- [ ] Implement policy CRUD API endpoints
- [ ] Implement policy-to-control mapping API
- [ ] Track policy versions (new upload = new version, keep history)
- [ ] Flag policies past their review date
- [ ] Extract text from PDF on upload (use CF Workers AI or external service)
- [ ] Store extracted text in `content_text` for AI-powered policy validation (Phase 4)

### Deliverables
- Policy vault with upload, versioning, and control mapping
- Text extraction pipeline for AI analysis

---

## 3.4 RBAC Enforcement

### Why
Different users need different permissions. A member can register access changes but shouldn't delete systems. An auditor can read everything but shouldn't modify configuration.

### Permission Matrix
| Action | Owner | Admin | Auditor | Member | Viewer |
|---|---|---|---|---|---|
| Manage workspace settings | x | | | | |
| Manage members & invites | x | x | | | |
| Configure baselines | x | x | | | |
| Manage systems catalog | x | x | | | |
| Manage risk register | x | x | | | |
| Upload policies | x | x | | | |
| Register access changes | x | x | | x | |
| Upload evidence | x | x | | x | |
| Review access | x | x | x | x | |
| Read all data | x | x | x | x | |
| Export audit reports | x | x | x | | |
| View dashboards | x | x | x | x | x |
| Use AI chat | x | x | x | x | |

### Tasks
- [ ] Implement permission checking utility: `can(role, action) → boolean`
- [ ] Define all actions as typed constants in `packages/shared`
- [ ] Add `requirePermission(action)` middleware for API routes
- [ ] Audit all existing endpoints (Phases 0-2) to add proper permission checks
- [ ] Write tests: each role tries each action → verify correct allow/deny
- [ ] Log permission denials in audit log (security monitoring)

### Deliverables
- Granular RBAC enforced on all API endpoints
- Permission denials logged for security monitoring

---

## 3.5 Compliance Snapshots (Point-in-Time Freeze)

### Why
Before an audit, freeze the compliance state. A snapshot is a permanent, tamper-evident record of what compliance looked like at that exact moment. Unlike materialized views (which update), snapshots are immutable artifacts.

### Database Table

#### `compliance_snapshots` (immutable)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `name` | TEXT | "SOC 2 Type II - Q1 2026 Audit" |
| `snapshot_type` | TEXT | `audit` / `quarterly` / `board_report` / `manual` |
| `frameworks` | TEXT (JSON) | Array of framework_version_ids included |
| `captured_at` | TEXT (ISO 8601) | The moment of truth |
| `captured_by` | TEXT | FK → auth_users.id |
| `posture_score` | REAL | Overall score at capture time |
| `total_controls` | INTEGER | |
| `compliant_count` | INTEGER | |
| `partial_count` | INTEGER | |
| `gap_count` | INTEGER | |
| `not_applicable_count` | INTEGER | |
| `detail_ref` | TEXT | R2 key to full snapshot JSON |
| `detail_hash` | TEXT | SHA-256 of the snapshot file (tamper evidence) |
| `created_at` | TEXT (ISO 8601) | |
| — | — | **Immutable. No UPDATE. No DELETE.** |

### Snapshot Detail (stored in R2 as JSON)
```json
{
  "captured_at": "2026-03-25T10:00:00Z",
  "workspace": { "id": "...", "name": "Applivery" },
  "adoptions": [
    { "framework": "SOC 2", "version": "2024", "adopted_at": "2024-01-01" }
  ],
  "controls": [
    {
      "control_id": "CC6.1",
      "framework_version": "soc2-2024",
      "status": "compliant",
      "evidence_links": [
        { "id": "el-001", "evidence_title": "Okta access report", "linked_at": "2026-03-20", "link_type": "auto_integration" }
      ],
      "overrides_applied": { "risk_weight": 0.95 },
      "baselines_passing": ["prod-requires-approval"],
      "baselines_failing": [],
      "risk_score": 0.2
    }
  ],
  "violations": [...],
  "risk_summary": {...},
  "evidence_summary": { "total": 47, "fresh": 40, "expiring": 5, "expired": 2 }
}
```

### Tasks
- [ ] Create D1 migration: `0023_create_compliance_snapshots.sql` — immutable, no UPDATE/DELETE
- [ ] Implement snapshot capture: freeze all current state into a denormalized JSON document
- [ ] Include: adoptions, control statuses (from MV), evidence links, overrides, baselines, violations, risk scores
- [ ] Store snapshot JSON in R2 with SHA-256 hash for integrity verification
- [ ] Store hash in D1 `detail_hash` field — if R2 file is tampered, hash mismatch detected
- [ ] Emit `snapshot_captured` compliance event
- [ ] Create API: `POST /api/w/:id/snapshots` — capture a new snapshot
- [ ] Create API: `GET /api/w/:id/snapshots` — list all snapshots (never deleted)
- [ ] Create API: `GET /api/w/:id/snapshots/:snapshotId` — download snapshot detail (verify hash)
- [ ] Create API: `GET /api/w/:id/snapshots/:snapshotId/verify` — verify integrity (recompute hash vs. stored)
- [ ] Build snapshot comparison: diff two snapshots to show what changed between audit periods
- [ ] Schedule quarterly auto-snapshots via CF Cron Trigger
- [ ] Write test: capture snapshot → verify hash → tamper R2 file → verify hash mismatch detected
- [ ] Write test: snapshot is queryable forever, never deletable

### Deliverables
- Tamper-evident compliance snapshots stored permanently
- SHA-256 integrity verification
- Snapshot comparison between audit periods
- Quarterly auto-capture

---

## 3.6 Admin UI Pages

### Tasks
- [ ] Build `/settings` page layout with sidebar navigation
- [ ] Build `/settings/general` — workspace name, slug, plan
- [ ] Build `/settings/members` — list members, invite, change roles, remove
- [ ] Build `/settings/systems` — CRUD for system catalog
- [ ] Build `/settings/baselines` — configure compliance rules, view violations
- [ ] Build `/settings/risk-register` — risk CRUD with heatmap
- [ ] Build `/settings/policies` — upload, version, map to controls
- [ ] Build `/settings/audit-log` — searchable compliance events timeline viewer
- [ ] Build `/compliance/snapshots` — list snapshots, capture new, compare two, verify integrity
- [ ] Build `/compliance/adoptions` — manage framework version adoptions, view overlap periods, review evidence suggestions
- [ ] Use shadcn/ui components: DataTable, Dialog, Form, Select, Badge, Timeline

### Deliverables
- Complete admin UI for workspace configuration

---

## Phase 3 Completion Criteria

- [ ] Baselines engine evaluates rules and detects violations
- [ ] Risk register with quantitative scoring and control linkage
- [ ] Policy vault with upload, versioning, text extraction, control mapping
- [ ] Policy-to-control links use `versioned_controls.id` (pinned to specific framework versions)
- [ ] Compliance snapshots: tamper-evident, immutable, SHA-256 verified
- [ ] Snapshot comparison shows delta between audit periods
- [ ] RBAC enforced on all endpoints with 5-role permission matrix
- [ ] Admin UI pages for all configuration modules + snapshots + adoptions
- [ ] Compliance posture score computable from materialized views
- [ ] All mutations emit compliance events
- [ ] All new data workspace-scoped
