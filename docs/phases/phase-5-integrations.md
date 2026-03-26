# Phase 5 — Integrations

**Timeline:** Week 12-14
**Depends on:** Phase 2 (access register, directory users, systems), Phase 3 (baselines for drift detection)
**Goal:** Connect external systems (identity, MDM, cloud, ticketing, HR) to auto-populate the access register, collect evidence, and detect drift in real time.

---

## 5.1 Integration Architecture

### Why
Manual compliance is what makes teams hate audits. Integrations auto-populate data, collect evidence, and flag anomalies — turning compliance from a periodic pain into a continuous background process.

### Architecture
```
External System (Okta, AWS, Applivery, Jira)
  → Integration Worker (CF Worker per connector)
    → Standard interface: pullAccessData(), pullEvidence(), getInventory()
      → CF Queue → Consumer Worker
        → Normalize data → Write to D1 (access_records, directory_users, evidence)
          → Run baselines → Flag violations
```

### Database Tables

#### `integrations`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `type` | TEXT | okta / azure_ad / google_ws / applivery / aws / jira / linear / servicenow |
| `name` | TEXT | Display name |
| `status` | TEXT | active / paused / error / disconnected |
| `config` | TEXT (JSON, encrypted) | Connection config (tenant URL, etc.) |
| `credentials_ref` | TEXT | Reference to encrypted credentials in KV |
| `last_sync_at` | TEXT (ISO 8601) | |
| `last_sync_status` | TEXT | success / partial / error |
| `last_sync_error` | TEXT | Error message if failed |
| `sync_interval_minutes` | INTEGER | How often to sync (default 60) |
| `created_by` | TEXT | FK → auth_users.id |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `integration_sync_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `integration_id` | TEXT | FK → integrations.id |
| `sync_type` | TEXT | full / incremental / evidence |
| `status` | TEXT | running / success / partial / error |
| `records_pulled` | INTEGER | |
| `records_created` | INTEGER | |
| `records_updated` | INTEGER | |
| `anomalies_detected` | INTEGER | |
| `error_message` | TEXT | |
| `started_at` | TEXT (ISO 8601) | |
| `completed_at` | TEXT (ISO 8601) | |

#### `anomalies`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `integration_id` | TEXT | FK → integrations.id |
| `type` | TEXT | new_admin / unreviewed_access / no_ticket / mfa_disabled / unknown_user |
| `severity` | TEXT | critical / high / medium / low |
| `title` | TEXT | Human-readable summary |
| `detail` | TEXT (JSON) | Full anomaly data |
| `entity_type` | TEXT | access_record / directory_user / system |
| `entity_id` | TEXT | |
| `status` | TEXT | open / investigating / resolved / dismissed |
| `resolved_by` | TEXT | |
| `resolved_at` | TEXT (ISO 8601) | |
| `created_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0024_create_integrations.sql`
- [ ] Create D1 migration: `0025_create_integration_sync_logs.sql`
- [ ] Create D1 migration: `0026_create_anomalies.sql`
- [ ] Design standard connector interface in `packages/shared`:
  ```typescript
  interface Connector {
    pullUsers(): Promise<DirectoryUser[]>
    pullAccessGrants(): Promise<AccessRecord[]>
    pullEvidence(): Promise<Evidence[]>
    getSystemInventory(): Promise<System[]>
    testConnection(): Promise<{ ok: boolean; error?: string }>
  }
  ```
- [ ] Implement credential encryption: store OAuth tokens / API keys in CF KV with encryption
- [ ] Create integration CRUD API endpoints
- [ ] Implement sync orchestrator: CF Cron Trigger → checks due integrations → enqueues sync jobs
- [ ] Implement sync consumer: CF Queue consumer → runs connector → writes data → detects anomalies
- [ ] Build anomaly detection engine: diff current state vs. last sync, flag changes matching anomaly rules
- [ ] Create anomaly management API (list, investigate, resolve, dismiss)

### Deliverables
- Standard connector interface
- Sync orchestration via CF Queues + Cron
- Anomaly detection and management

---

## 5.2 Identity Connectors (Okta, Azure AD, Google Workspace)

### Why
Identity providers are the source of truth for who exists and what they can access. They auto-populate the directory and detect provisioning changes.

### Data Pulled
| Data | Maps To |
|---|---|
| Users list | `directory_users` |
| Group memberships | `access_records` (group = role on system) |
| App assignments | `access_records` |
| MFA status | `directory_users.mfa_enabled` |
| Login events | Evidence (last login timestamps) |

### Tasks
- [ ] **Okta connector**: OAuth 2.0 setup, pull users via `/api/v1/users`, groups via `/api/v1/groups`, app assignments
- [ ] **Azure AD connector**: Microsoft Graph API, pull users, groups, app role assignments, MFA registration status
- [ ] **Google Workspace connector**: Admin SDK, pull users, groups, org units
- [ ] Normalize all identity data to `DirectoryUser` + `AccessRecord` format
- [ ] Detect anomalies: new admin added, user deactivated but still has access, MFA disabled
- [ ] Capture evidence: export user list + access grants as PDF/CSV, store in R2, link to relevant controls
- [ ] Write integration tests with mocked API responses

### Deliverables
- 3 identity connectors pulling users + access data
- Anomaly detection for identity drift

---

## 5.3 MDM / UEM Connector (Applivery)

### Why
Device management proves endpoint compliance — encryption, OS updates, MDM enrollment. Critical for SOC 2 CC6.7 and CIS controls.

### Data Pulled
| Data | Maps To |
|---|---|
| Device inventory | `systems` (type=endpoint) |
| Device compliance status | Evidence for endpoint controls |
| Installed apps | Evidence for software inventory controls |
| Encryption status | Evidence for data protection controls |
| OS version | Evidence for patch management controls |

### Tasks
- [ ] **Applivery connector**: Use Applivery MCP tools or REST API to pull device list, compliance status, apps
- [ ] Map device data to systems + evidence
- [ ] Detect anomalies: non-compliant device, unencrypted device, outdated OS
- [ ] Auto-evidence: capture device compliance snapshot, store in R2, link to controls (CIS 1.1, SOC 2 CC6.7)
- [ ] Support other MDM providers via same interface: Intune, Jamf (future)

### Deliverables
- Applivery MDM connector with device compliance data
- Auto-evidence collection for endpoint controls

---

## 5.4 Cloud Infrastructure Connector (AWS IAM)

### Why
Cloud IAM is the most common source of access sprawl. Auto-pulling IAM users, roles, and policies catches misconfigurations early.

### Data Pulled
| Data | Maps To |
|---|---|
| IAM users | `directory_users` |
| IAM roles + policies | `access_records` |
| MFA status | Evidence for auth controls |
| Access keys age | Anomaly if >90 days |
| S3 bucket policies | Evidence for data access controls |

### Tasks
- [ ] **AWS connector**: IAM API to pull users, roles, policies, MFA status, access key metadata
- [ ] Normalize AWS IAM data to standard format
- [ ] Detect anomalies: root account usage, access keys >90 days, overly permissive policies, no MFA
- [ ] Auto-evidence: IAM credential report export, store in R2
- [ ] GCP + Azure cloud connectors (architecture only, implement in Phase 6+)

### Deliverables
- AWS IAM connector with user + role + policy data
- Security anomaly detection for cloud misconfigurations

---

## 5.5 Ticketing Connector (Jira / Linear)

### Why
Tickets prove that access changes went through an approval workflow. When an access record has a `ticket_ref`, the system can validate the ticket exists, was approved, and matches.

### Data Pulled
| Data | Maps To |
|---|---|
| Ticket ID + status | `access_records.ticket_ref` validation |
| Approval workflow | Evidence for change management controls |
| Ticket assignee/reporter | Cross-reference with `granted_by` / `approved_by` |

### Tasks
- [ ] **Jira connector**: REST API v3, search tickets by project/label, pull status + approval data
- [ ] **Linear connector**: GraphQL API, pull issues with labels, status, assignees
- [ ] Validate `ticket_ref` on access records: does the ticket exist? Was it approved? Does it match?
- [ ] Detect anomalies: access granted with invalid ticket, ticket rejected but access still active
- [ ] ServiceNow connector (architecture only, implement later)

### Deliverables
- Jira + Linear connectors validating change management trails

---

## 5.6 Integration Management UI

### Tasks
- [ ] Build `/settings/integrations` page
- [ ] Integration catalog: show available connectors with setup instructions
- [ ] OAuth flow UI: connect → authorize → callback → store credentials
- [ ] Integration status dashboard: last sync, records pulled, errors
- [ ] Sync log viewer: detailed sync history per integration
- [ ] Anomaly feed: list anomalies across all integrations, filter by severity/status
- [ ] Manual sync trigger: "Sync now" button per integration
- [ ] Anomaly detail view: what happened, affected entity, suggested action

### Deliverables
- Complete integration management UI with monitoring

---

## Phase 5 Completion Criteria

- [ ] Standard connector interface implemented and documented
- [ ] Identity connectors (Okta + Azure AD + Google WS) pulling users + access
- [ ] Applivery MDM connector pulling device compliance
- [ ] AWS IAM connector pulling users + roles + policies
- [ ] Jira + Linear connectors validating ticket references
- [ ] Anomaly detection engine flags drift across all connectors
- [ ] Sync orchestration runs on schedule via CF Cron + Queues
- [ ] Credentials encrypted at rest in CF KV
- [ ] Integration management UI with status monitoring
- [ ] Auto-evidence collection stores proof in R2 + links to controls
- [ ] All integration data workspace-scoped and audit-logged
