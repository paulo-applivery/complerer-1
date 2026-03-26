# Phase 2 — Core Data Model (Temporal Compliance Ledger)

**Timeline:** Week 5-6
**Depends on:** Phase 0 (tenant isolation), Phase 1 (versioned frameworks + adoptions)
**Goal:** Build the compliance register with append-only evidence links, event-sourced compliance timeline, and materialized views. Every state change is a permanent fact. Nothing is ever deleted.

---

## 2.1 Access Register

### Why
The access register is the heart of compliance. It tracks who has access to what, who approved it, and when it was last reviewed. Every auditor asks for this first.

### Database Tables

#### `systems`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `name` | TEXT | System name (e.g. "Production DB", "AWS Console") |
| `description` | TEXT | |
| `classification` | TEXT | critical / standard / low |
| `data_sensitivity` | TEXT | high / medium / low |
| `owner_id` | TEXT | FK → directory_users.id |
| `mfa_required` | BOOLEAN | |
| `environment` | TEXT | production / staging / development |
| `integration_ref` | TEXT | External system ID (Okta app ID, AWS account, etc.) |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `directory_users`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `email` | TEXT | |
| `name` | TEXT | |
| `department` | TEXT | |
| `title` | TEXT | |
| `manager_id` | TEXT | FK → directory_users.id (self-ref) |
| `employment_status` | TEXT | active / inactive / contractor / terminated |
| `source` | TEXT | manual / okta / azure_ad / google_ws |
| `external_id` | TEXT | ID in source system |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `access_records`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `user_id` | TEXT | FK → directory_users.id |
| `system_id` | TEXT | FK → systems.id |
| `role` | TEXT | admin / write / read / custom |
| `access_type` | TEXT | permanent / temporary / emergency |
| `granted_at` | TEXT (ISO 8601) | |
| `granted_by` | TEXT | FK → directory_users.id |
| `approved_by` | TEXT | FK → directory_users.id |
| `approval_method` | TEXT | manual / ticket / automated |
| `ticket_ref` | TEXT | Jira/Linear ticket ID |
| `reviewed_at` | TEXT (ISO 8601) | Last review date |
| `reviewed_by` | TEXT | FK → directory_users.id |
| `revoked_at` | TEXT (ISO 8601) | Null = still active |
| `revoked_by` | TEXT | FK → directory_users.id |
| `revocation_reason` | TEXT | |
| `risk_score` | REAL | Computed: 0.0-1.0 |
| `source` | TEXT | manual / integration / ai_extracted |
| `created_at` | TEXT (ISO 8601) | |

#### `role_changes`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `user_id` | TEXT | FK → directory_users.id |
| `system_id` | TEXT | FK → systems.id |
| `old_role` | TEXT | |
| `new_role` | TEXT | |
| `changed_by` | TEXT | FK → directory_users.id |
| `approved_by` | TEXT | FK → directory_users.id |
| `ticket_ref` | TEXT | |
| `reason` | TEXT | |
| `created_at` | TEXT (ISO 8601) | |

#### `access_reviews`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `reviewer_id` | TEXT | FK → directory_users.id |
| `scope` | TEXT | system / team / all |
| `scope_ref` | TEXT | system_id or department name |
| `period_start` | TEXT (ISO 8601) | Review period |
| `period_end` | TEXT (ISO 8601) | |
| `status` | TEXT | pending / in_progress / completed / overdue |
| `total_records` | INTEGER | Records to review |
| `reviewed_count` | INTEGER | Records reviewed |
| `evidence_ref` | TEXT | FK → evidence.id |
| `completed_at` | TEXT (ISO 8601) | |
| `created_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0013_create_systems.sql`
- [ ] Create D1 migration: `0014_create_directory_users.sql`
- [ ] Create D1 migration: `0015_create_access_records.sql`
- [ ] Create D1 migration: `0016_create_role_changes.sql`
- [ ] Create D1 migration: `0017_create_access_reviews.sql`
- [ ] Add indexes: `access_records(workspace_id, system_id)`, `access_records(workspace_id, user_id)`, `access_records(workspace_id, revoked_at)`
- [ ] Create Zod schemas for all entities
- [ ] Implement soft delete pattern (never hard delete compliance data)
- [ ] Write seed script with realistic sample data (20 users, 5 systems, 50 access records)

### Deliverables
- Complete access register schema with all relationships
- Sample data for development

---

## 2.2 Evidence Store (Append-Only Links)

### Why
Evidence proves compliance. The critical change from the original design: **evidence links are permanent facts, not mutable relationships.** When you link evidence to a control, that's a timestamped historical record that can never be deleted or moved.

### Database Tables

#### `evidence`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `title` | TEXT | Human-readable title |
| `description` | TEXT | |
| `file_ref` | TEXT | R2 object key |
| `file_name` | TEXT | Original filename |
| `file_size` | INTEGER | Bytes |
| `file_hash` | TEXT | SHA-256 for integrity verification |
| `mime_type` | TEXT | |
| `source` | TEXT | manual / auto_integration / auto_agent / screenshot |
| `source_integration` | TEXT | Which integration captured it |
| `captured_at` | TEXT (ISO 8601) | When the evidence was captured |
| `expires_at` | TEXT (ISO 8601) | When evidence becomes stale |
| `uploaded_by` | TEXT | FK → auth_users.id |
| `created_at` | TEXT (ISO 8601) | |

#### `evidence_links` (append-only — replaces old `control_evidence`)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `evidence_id` | TEXT | FK → evidence.id |
| `control_id` | TEXT | FK → versioned_controls.id |
| `framework_version_id` | TEXT | Explicitly pinned to a specific version |
| `linked_at` | TEXT (ISO 8601) | When this link was created |
| `linked_by` | TEXT | FK → auth_users.id |
| `link_type` | TEXT | `manual` / `auto_crosswalk` / `auto_suggested` / `inherited` |
| `confidence` | REAL | For auto-links: 0.0-1.0 (null for manual) |
| `inherited_from` | TEXT | FK → evidence_links.id (if carried forward from previous version) |
| `notes` | TEXT | How this evidence satisfies the control |
| `created_at` | TEXT (ISO 8601) | |
| — | — | **NO `updated_at`. NO soft delete. Immutable.** |

**Key behaviors:**
- Evidence linked to SOC 2 CC6.1 creates an `evidence_link` pinned to that specific `framework_version_id`
- Auto-crosswalk: system also creates `evidence_links` for equivalent controls (link_type=`auto_crosswalk`, with confidence)
- When workspace adopts a new version, accepted `evidence_suggestions` create NEW `evidence_links` with `inherited_from` pointing to the original link
- Original links are **never modified or deleted**
- "What evidence covered CC6.1 in March 2024?" → query `evidence_links WHERE created_at <= '2024-03-31'`

### Tasks
- [ ] Create D1 migration: `0018_create_evidence.sql`
- [ ] Create D1 migration: `0019_create_evidence_links.sql` (append-only, no UPDATE/DELETE)
- [ ] Configure R2 bucket: `complerer-evidence` with appropriate CORS
- [ ] Implement file upload flow: client → presigned URL → R2, then confirm with API
- [ ] Compute SHA-256 hash on upload, store in `file_hash` column
- [ ] Generate signed download URLs (15-min expiry, never expose R2 directly)
- [ ] Implement evidence linking API: `POST /api/w/:id/evidence/:evidenceId/link` → creates evidence_link
- [ ] Auto-crosswalk linking: when evidence is linked to control X, create additional evidence_links for equivalent controls via crosswalk (link_type=`auto_crosswalk`)
- [ ] Ensure evidence_links have NO update or delete API endpoints
- [ ] Add evidence expiry check: flag evidence older than `expires_at`
- [ ] Create Zod schemas for all entities
- [ ] Write test: link evidence to CC6.1 → verify auto_crosswalk links created for ISO A.8.3 etc.
- [ ] Write test: attempt to DELETE evidence_link → expect 405

### Deliverables
- Upload evidence files to R2 with integrity verification
- Append-only evidence links pinned to specific framework versions
- Auto-crosswalk creates propagated links with confidence scores
- Signed URLs for secure downloads

---

## 2.3 Compliance Events (Event-Sourced Timeline)

### Why
Instead of a generic audit log, build a **compliance event stream** — an append-only timeline of every compliance-relevant state change. This is the source of truth. Materialized views are rebuilt from events.

### Database Table

#### `compliance_events` (append-only)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key (ULID = chronologically sortable) |
| `workspace_id` | TEXT | FK → workspaces.id |
| `event_type` | TEXT | See event types below |
| `entity_type` | TEXT | access_record / evidence / evidence_link / control / system / user / adoption / baseline / anomaly |
| `entity_id` | TEXT | ID of the affected entity |
| `data` | TEXT (JSON) | Full event payload (contains before/after state for mutations) |
| `actor_id` | TEXT | FK → auth_users.id (null for system events) |
| `actor_type` | TEXT | `user` / `system` / `integration` / `ai_agent` |
| `metadata` | TEXT (JSON) | Additional context (IP, user agent, integration name) |
| `created_at` | TEXT (ISO 8601) | Immutable timestamp |
| — | — | **Append-only. No UPDATE. No DELETE. Ever.** |

### Event Types
```
# Framework lifecycle
framework_version_published
framework_adopted
framework_adoption_superseded

# Evidence lifecycle
evidence_uploaded
evidence_linked          # evidence_link created
evidence_crosswalk_linked # auto-crosswalk link created
evidence_suggestion_created
evidence_suggestion_accepted
evidence_suggestion_rejected
evidence_expired

# Control status
control_assessed         # workspace_control status changed
control_override_created
control_override_updated

# Access register
access_granted
access_revoked
access_reviewed
role_changed

# Baselines
violation_detected
violation_acknowledged
violation_resolved
violation_exempted

# Integrations
anomaly_detected
anomaly_resolved
integration_synced

# Snapshots
snapshot_captured

# System
system_created
system_updated
user_created
user_updated
```

### Tasks
- [ ] Create D1 migration: `0020_create_compliance_events.sql` — append-only, NO update/delete
- [ ] Add index: `compliance_events(workspace_id, entity_type, created_at)`
- [ ] Add index: `compliance_events(workspace_id, event_type, created_at)`
- [ ] Add index: `compliance_events(workspace_id, entity_id, created_at)`
- [ ] Create event emitter middleware: all workspace-scoped mutations auto-emit compliance events
- [ ] Implement `emitEvent(workspaceId, eventType, entityType, entityId, data, actor)` utility
- [ ] For mutations: compute diff (before/after) and include in `data` payload
- [ ] Ensure compliance_events have NO update or delete API endpoints
- [ ] Create API: `GET /api/w/:id/events` — paginated, filterable by event_type, entity_type, actor, date range
- [ ] Create API: `GET /api/w/:id/events/entity/:entityId` — all events for a specific entity (its complete history)
- [ ] Create API: `GET /api/w/:id/events/timeline` — aggregated timeline view (grouped by day/week)
- [ ] Write test: create access record → verify `access_granted` event emitted with full data
- [ ] Write test: link evidence → verify both `evidence_linked` and `evidence_crosswalk_linked` events
- [ ] Write test: attempt to DELETE compliance_event → expect 405

### Deliverables
- Every compliance-relevant action creates a permanent event
- Events are queryable by type, entity, actor, and date
- Complete entity history via event replay
- No event can ever be modified or deleted

---

## 2.4 Materialized Views (Computed from Events)

### Why
Events are truth, but queries need fast reads. Materialized views cache the current state, rebuilt from events. They're disposable — if corrupted, replay events to rebuild.

### Database Tables

#### `mv_control_status` (rebuildable cache)
| Column | Type | Notes |
|---|---|---|
| `workspace_id` | TEXT | |
| `control_id` | TEXT | FK → versioned_controls.id |
| `framework_version_id` | TEXT | |
| `status` | TEXT | compliant / partial / gap / not_applicable / not_assessed |
| `evidence_count` | INTEGER | Number of evidence_links for this control |
| `last_evidence_at` | TEXT | Most recent evidence_link created_at |
| `risk_score` | REAL | |
| `last_assessed_at` | TEXT | |
| `computed_at` | TEXT (ISO 8601) | When this view was last rebuilt |
| PRIMARY KEY | | `(workspace_id, control_id)` |

#### `mv_posture_score` (rebuildable cache)
| Column | Type | Notes |
|---|---|---|
| `workspace_id` | TEXT | |
| `framework_version_id` | TEXT | |
| `total_controls` | INTEGER | |
| `compliant_count` | INTEGER | |
| `partial_count` | INTEGER | |
| `gap_count` | INTEGER | |
| `not_applicable_count` | INTEGER | |
| `not_assessed_count` | INTEGER | |
| `posture_score` | REAL | 0.0-1.0 |
| `computed_at` | TEXT (ISO 8601) | |
| PRIMARY KEY | | `(workspace_id, framework_version_id)` |

### Point-in-Time Queries
```typescript
// Current state: read from materialized view
async function getControlStatus(workspaceId: string, controlId: string) {
  return db.get(
    'SELECT * FROM mv_control_status WHERE workspace_id = ? AND control_id = ?',
    [workspaceId, controlId]
  )
}

// Historical state: replay events up to a date
async function getControlStatusAt(workspaceId: string, controlId: string, asOf: string) {
  const events = await db.all(
    `SELECT * FROM compliance_events
     WHERE workspace_id = ? AND entity_id = ? AND created_at <= ?
     ORDER BY created_at ASC`,
    [workspaceId, controlId, asOf]
  )
  return replayControlEvents(events)
}
```

### Tasks
- [ ] Create D1 migration: `0021_create_mv_control_status.sql`
- [ ] Create D1 migration: `0022_create_mv_posture_score.sql`
- [ ] Implement materialized view refresh: on relevant event → update affected views
- [ ] Use CF Queue for async view updates (event emitted → queue → consumer rebuilds view)
- [ ] Implement full rebuild utility: `rebuildAllViews(workspaceId)` — replays all events
- [ ] Implement point-in-time query: `getControlStatusAt(workspaceId, controlId, asOf)` — replays events up to date
- [ ] Implement posture score computation from `mv_control_status` aggregation
- [ ] Add `computed_at` staleness check: warn if view is >5 minutes old
- [ ] Write test: emit events → verify materialized view updated correctly
- [ ] Write test: point-in-time query returns correct historical state

### Deliverables
- Fast reads via materialized views
- Views are disposable and rebuildable from events
- Point-in-time queries via event replay

---

## 2.5 Access Register API

### Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/w/:id/systems` | List systems |
| `POST` | `/api/w/:id/systems` | Create system |
| `PATCH` | `/api/w/:id/systems/:systemId` | Update system |
| `GET` | `/api/w/:id/directory` | List directory users |
| `POST` | `/api/w/:id/directory` | Create directory user |
| `GET` | `/api/w/:id/access` | List access records (filterable) |
| `POST` | `/api/w/:id/access` | Create access record |
| `PATCH` | `/api/w/:id/access/:recordId` | Update (e.g. mark reviewed) |
| `POST` | `/api/w/:id/access/:recordId/revoke` | Revoke access |
| `GET` | `/api/w/:id/access/active` | Active access only |
| `GET` | `/api/w/:id/access/unreviewed` | Access needing review |
| `POST` | `/api/w/:id/access-reviews` | Start an access review campaign |
| `POST` | `/api/w/:id/evidence` | Upload evidence |
| `GET` | `/api/w/:id/evidence` | List evidence |
| `POST` | `/api/w/:id/evidence/:evidenceId/link` | Link evidence to control (creates immutable evidence_link) |
| `GET` | `/api/w/:id/evidence-links` | List evidence links (filterable by control, framework_version) |
| `GET` | `/api/w/:id/events` | Query compliance events timeline |
| `GET` | `/api/w/:id/events/entity/:entityId` | Full history of an entity |
| `GET` | `/api/w/:id/controls/:controlId/status` | Current control status (from MV) |
| `GET` | `/api/w/:id/controls/:controlId/status?as_of=` | Historical control status (event replay) |
| `GET` | `/api/w/:id/posture` | Current posture scores per framework (from MV) |
| `GET` | `/api/w/:id/posture?as_of=` | Historical posture at a specific date |

### Tasks
- [ ] Implement all system CRUD endpoints (emit compliance_events on mutation)
- [ ] Implement directory user CRUD endpoints (emit compliance_events)
- [ ] Implement access record CRUD + revoke endpoints (emit compliance_events)
- [ ] Implement access review campaign endpoints
- [ ] Implement evidence upload + immutable link endpoints
- [ ] Implement compliance events query endpoint
- [ ] Implement point-in-time status and posture endpoints (`?as_of=`)
- [ ] Add filters: by system, user, date range, status, risk score
- [ ] Add sorting: by risk_score desc, created_at desc, reviewed_at asc
- [ ] Add cursor-based pagination to all list endpoints
- [ ] Enforce RBAC: member can create records, auditor can read all, admin can configure
- [ ] Write integration tests for all endpoints

### Deliverables
- Complete REST API for the compliance register
- All mutations emit compliance events
- Point-in-time queries via `?as_of=` parameter
- RBAC enforced on every endpoint

---

## Phase 2 Completion Criteria

- [ ] Access register schema deployed with all tables
- [ ] Evidence files stored in R2 with SHA-256 integrity
- [ ] Evidence links are append-only, pinned to framework versions
- [ ] Auto-crosswalk creates propagated evidence links
- [ ] Compliance events capture every mutation (append-only, no delete)
- [ ] Materialized views compute current state from events
- [ ] Point-in-time queries work via event replay (`?as_of=`)
- [ ] All API endpoints implemented, tested, workspace-scoped
- [ ] RBAC enforced (member / auditor / admin roles)
- [ ] Seed data creates realistic compliance scenario
