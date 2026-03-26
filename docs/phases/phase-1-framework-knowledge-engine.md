# Phase 1 — Framework Knowledge Engine (Temporal Ledger)

**Timeline:** Week 3-4
**Depends on:** Phase 0 (multi-tenant schema, workspace isolation)
**Goal:** Build a living, versioned, append-only framework knowledge system with cross-framework crosswalk, workspace overlays, and vector embeddings. Nothing is ever deleted — all versions coexist permanently.

---

## 1.1 Temporal Framework Schema

### Why
Frameworks evolve (ISO 27001:2013 → 2022, NIST CSF 1.1 → 2.0). The schema must support multiple coexisting versions, permanent history, and point-in-time queries. Nothing migrates, everything coexists.

### Design Principle
```
IMMUTABLE LAYER — framework_versions, versioned_controls, control_crosswalks
  → Never updated, never deleted. New versions are additive.

DECISION LAYER — workspace_adoptions, workspace_control_overrides, custom_controls
  → Human choices. Also append-only. Superseded, not deleted.

COMPUTED LAYER — mv_control_status, vectorize embeddings
  → Disposable cache. Rebuilt from the layers above.
```

### Database Tables

#### `frameworks`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `slug` | TEXT UNIQUE | `soc2`, `iso27001`, `nist_csf`, `cis_v8`, `pci_dss` |
| `name` | TEXT | Display name |
| `description` | TEXT | |
| `source_org` | TEXT | AICPA, ISO, NIST, CIS, PCI SSC |
| `source_url` | TEXT | Official URL |
| `created_at` | TEXT (ISO 8601) | |

#### `framework_versions` (immutable)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `framework_id` | TEXT | FK → frameworks.id |
| `version` | TEXT | e.g. `2022`, `v4.0.1`, `2.0` |
| `status` | TEXT | `current` / `superseded` / `draft` (informational only — superseded versions remain fully queryable) |
| `total_controls` | INTEGER | |
| `published_at` | TEXT (ISO 8601) | When this version was officially released |
| `changelog` | TEXT | What changed from previous version |
| `source_url` | TEXT | Link to official version document |
| `checksum` | TEXT | SHA-256 of the control data for integrity proof |
| `previous_version_id` | TEXT | FK → framework_versions.id (forms a version chain) |
| `created_at` | TEXT (ISO 8601) | |

#### `versioned_controls` (immutable)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `framework_version_id` | TEXT | FK → framework_versions.id |
| `control_id` | TEXT | Original ID (e.g. `CC6.1`, `A.8.3`) |
| `domain` | TEXT | Grouping (e.g. `Access Control`) |
| `subdomain` | TEXT | Optional sub-grouping |
| `title` | TEXT | Short title |
| `requirement_text` | TEXT | Full requirement description |
| `guidance` | TEXT | Implementation guidance |
| `evidence_requirements` | TEXT (JSON) | Array of evidence types needed |
| `risk_weight` | REAL | 0.0-1.0, default prioritization |
| `implementation_group` | TEXT | CIS-specific: IG1/IG2/IG3, null for others |
| `supersedes` | TEXT | FK → versioned_controls.id (control in previous version this replaces) |
| `deprecated` | BOOLEAN | true if removed in this version |
| `deprecation_note` | TEXT | Why it was removed/merged |
| `created_at` | TEXT (ISO 8601) | |
| UNIQUE | | `(framework_version_id, control_id)` |

#### `control_crosswalks` (immutable)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `source_control_id` | TEXT | FK → versioned_controls.id |
| `target_control_id` | TEXT | FK → versioned_controls.id |
| `mapping_type` | TEXT | `equivalent` / `partial` / `related` |
| `confidence` | REAL | 0.0-1.0 (how strong the equivalence is) |
| `notes` | TEXT | Explanation of mapping relationship |
| `created_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0005_create_frameworks.sql`
- [ ] Create D1 migration: `0006_create_framework_versions.sql`
- [ ] Create D1 migration: `0007_create_versioned_controls.sql`
- [ ] Create D1 migration: `0008_create_control_crosswalks.sql`
- [ ] Add indexes: `versioned_controls(framework_version_id)`, `versioned_controls(control_id)`, `crosswalks(source_control_id)`, `crosswalks(target_control_id)`
- [ ] Add UNIQUE constraint: `framework_versions(framework_id, version)`
- [ ] Add UNIQUE constraint: `versioned_controls(framework_version_id, control_id)`
- [ ] Create Zod schemas in `packages/shared` for all entities
- [ ] Create TypeScript interfaces for the JSON seed format
- [ ] Enforce immutability: no UPDATE/DELETE API endpoints for these tables

### Deliverables
- Immutable, versioned schema that can hold all frameworks across all their versions permanently

---

## 1.2 Workspace Adoption + Overlay System

### Why
Workspaces don't "subscribe" to a framework — they **adopt** a specific version at a point in time. That adoption is a permanent historical fact. Workspaces can customize controls via overlays without modifying the canonical data.

### Database Tables

#### `workspace_adoptions` (append-only)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `framework_version_id` | TEXT | FK → framework_versions.id |
| `adopted_at` | TEXT (ISO 8601) | When the decision was made |
| `adopted_by` | TEXT | FK → auth_users.id |
| `reason` | TEXT | "Annual framework review", "Auditor requirement", etc. |
| `effective_from` | TEXT (ISO 8601) | When compliance evaluation starts |
| `effective_until` | TEXT (ISO 8601) | NULL = still active. Set when superseded. |
| `superseded_by` | TEXT | FK → workspace_adoptions.id (the adoption that replaced this one) |
| `auto_update_minor` | BOOLEAN | Auto-adopt minor revisions (e.g. 4.0 → 4.0.1)? |
| `created_at` | TEXT (ISO 8601) | |

**Key behaviors:**
- A workspace CAN have multiple active adoptions of the same framework (dual evaluation during transitions)
- Setting `effective_until` does NOT delete the adoption — it remains queryable forever
- "What was our ISO posture in March 2024?" → find adoption active at that date → query its controls

#### `workspace_control_overrides`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `control_id` | TEXT | FK → versioned_controls.id |
| `risk_weight` | REAL | Override default risk weight (null = use default) |
| `evidence_requirements` | TEXT (JSON) | Additional or replacement evidence requirements |
| `guidance` | TEXT | Org-specific implementation guidance |
| `notes` | TEXT | Internal notes |
| `override_type` | TEXT | `extend` (merge with base) / `replace` (full override) |
| `created_by` | TEXT | FK → auth_users.id |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `workspace_custom_controls`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `framework_version_id` | TEXT | Optional: attach to a framework version |
| `control_id` | TEXT | Org-defined ID like `CUSTOM-001` |
| `domain` | TEXT | |
| `title` | TEXT | |
| `requirement_text` | TEXT | |
| `evidence_requirements` | TEXT (JSON) | |
| `risk_weight` | REAL | Default 0.5 |
| `created_by` | TEXT | FK → auth_users.id |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

### Merged Read Path
```typescript
async function getControl(workspaceId: string, controlId: string) {
  // Layer 1: canonical control from versioned_controls
  const base = await db.get(
    'SELECT * FROM versioned_controls WHERE id = ?', controlId
  )

  // Layer 2: workspace override (if any)
  const override = await db.get(
    'SELECT * FROM workspace_control_overrides WHERE workspace_id = ? AND control_id = ?',
    [workspaceId, controlId]
  )

  if (!override) return base

  // Merge: override wins for non-null fields
  return override.override_type === 'replace'
    ? { ...base, ...stripNulls(override) }
    : {
        ...base,
        risk_weight: override.risk_weight ?? base.risk_weight,
        guidance: override.guidance ?? base.guidance,
        evidence_requirements: mergeEvidence(
          JSON.parse(base.evidence_requirements),
          JSON.parse(override.evidence_requirements ?? '[]')
        ),
      }
}
```

### Tasks
- [ ] Create D1 migration: `0009_create_workspace_adoptions.sql`
- [ ] Create D1 migration: `0010_create_workspace_control_overrides.sql`
- [ ] Create D1 migration: `0011_create_workspace_custom_controls.sql`
- [ ] Implement adoption API: `POST /api/w/:id/adoptions` — adopt a framework version
- [ ] Implement adoption listing: `GET /api/w/:id/adoptions` — with `?active=true` and `?as_of=2024-03-15` filters
- [ ] Implement overlay merge read path: `getControl()` merges base + override
- [ ] Implement override CRUD API
- [ ] Implement custom control CRUD API
- [ ] Build workspace provisioning: new workspace auto-adopts latest `current` versions of all 5 frameworks
- [ ] Write test: adopt ISO 2013, then adopt ISO 2022 → both coexist during overlap period
- [ ] Write test: override risk_weight → merged read returns override value
- [ ] Write test: query adoptions `as_of=2024-06-01` → returns correct active versions at that date

### Deliverables
- Workspaces adopt framework versions without destroying history
- Overlays customize without modifying canonical data
- Point-in-time adoption queries work

---

## 1.3 Seed the Top 5 Frameworks

### Why
System-provided framework data is what makes the product immediately useful. Each framework is seeded as an immutable `framework_version` with its controls.

### Framework Data to Seed

| Framework | Version | Controls | Key Structure |
|---|---|---|---|
| **SOC 2** | 2024 | ~60 criteria | 5 TSC categories (CC1-CC9, A1, C1, PI1, P1) |
| **ISO 27001** | 2022 | 93 controls | 4 themes (Organizational, People, Physical, Technological) |
| **NIST CSF** | 2.0 | ~106 subcategories | 6 functions (Govern, Identify, Protect, Detect, Respond, Recover) |
| **CIS v8** | 8.1 | 153 safeguards | 18 control groups, 3 implementation groups |
| **PCI DSS** | 4.0.1 | ~250 requirements | 12 principal requirements |

### Seed Data Format
```json
{
  "framework": { "slug": "soc2", "name": "SOC 2", "source_org": "AICPA" },
  "version": {
    "version": "2024",
    "status": "current",
    "published_at": "2024-01-01",
    "source_url": "https://us.aicpa.org/..."
  },
  "controls": [
    {
      "control_id": "CC6.1",
      "domain": "Logical and Physical Access Controls",
      "title": "Logical Access Security",
      "requirement_text": "The entity implements logical access security...",
      "evidence_requirements": ["Access control policy", "Provisioning records", "Access review logs"],
      "risk_weight": 0.9
    }
  ]
}
```

### Tasks
- [ ] Research and compile SOC 2 TSC criteria into `seeds/soc2-2024.json`
- [ ] Research and compile ISO 27001:2022 Annex A controls into `seeds/iso27001-2022.json`
- [ ] Research and compile NIST CSF 2.0 subcategories into `seeds/nist-csf-2.0.json`
- [ ] Research and compile CIS v8.1 safeguards into `seeds/cis-v8.1.json`
- [ ] Research and compile PCI DSS v4.0.1 requirements into `seeds/pci-dss-4.0.1.json`
- [ ] Create seed runner: reads JSON → inserts framework + version + controls into D1
- [ ] Compute SHA-256 checksum of each seed file → store in `framework_versions.checksum`
- [ ] Validate: no duplicate control_ids per version, all required fields present
- [ ] Create workspace provisioning hook: new workspace auto-adopts all `current` versions

### Deliverables
- 5 immutable framework versions seeded with complete control data
- Checksum integrity verification
- Auto-adoption on workspace creation

---

## 1.4 Cross-Framework Crosswalk

### Why
Map evidence to one control → automatically satisfy equivalent controls across all frameworks. The crosswalk links controls across versions.

### Key Mappings to Build

| SOC 2 | ISO 27001 | NIST CSF | CIS v8 | PCI DSS |
|---|---|---|---|---|
| CC6.1 (Access) | A.8.3, A.8.5 | PR.AC-1 | CIS 5, 6 | Req 7, 8 |
| CC6.2 (Auth) | A.8.5 | PR.AC-7 | CIS 5.2 | Req 8.3 |
| CC6.3 (Provisioning) | A.5.15, A.5.18 | PR.AC-1 | CIS 5.3 | Req 7.1 |
| CC7.2 (Monitoring) | A.8.15, A.8.16 | DE.CM-1 | CIS 8 | Req 10 |
| CC8.1 (Change mgmt) | A.8.32 | PR.IP-3 | CIS 2.7 | Req 6.5 |

### Cross-Version Supersedes
When a new framework version is published, `supersedes` links old → new controls:
```
ISO 27001:2013 A.9.4.2 → superseded_by → ISO 27001:2022 A.8.5
```
This allows the system to suggest evidence carry-forward without migrating anything.

### Tasks
- [ ] Create crosswalk seed file: `seeds/crosswalks.json` with all cross-framework mappings
- [ ] Map SOC 2 ↔ ISO 27001 (~60 mappings with confidence scores)
- [ ] Map SOC 2 ↔ NIST CSF (~50 mappings)
- [ ] Map SOC 2 ↔ CIS v8 (~40 mappings)
- [ ] Map SOC 2 ↔ PCI DSS (~30 mappings)
- [ ] Map ISO 27001 ↔ NIST CSF (secondary crosswalk)
- [ ] Classify each mapping: `equivalent` (1.0), `partial` (0.5-0.9), `related` (0.1-0.4)
- [ ] Create seed runner for crosswalks (immutable inserts)
- [ ] Build API: `GET /api/w/:id/controls/:controlId/crosswalks` — returns all mapped controls with confidence
- [ ] Build API: `GET /api/w/:id/controls/:controlId/supersedes-chain` — returns full version lineage
- [ ] Write test: evidence linked to CC6.1 → crosswalk query → returns equivalent controls in all frameworks

### Deliverables
- 200+ immutable cross-framework mappings with confidence scores
- Supersedes chain for version lineage queries
- Evidence satisfaction propagates via crosswalk

---

## 1.5 Upstream Change Monitor

### Why
Frameworks update on their own schedule. The system must detect upstream changes, analyze impact, and create draft versions for human review. Never auto-push changes.

### Architecture
```
CF Cron Trigger (weekly)
  → Check each framework source for changes (page hash, API diff)
    → Change detected?
      → AI analyzes impact (what changed, crosswalk implications, workspace gaps)
        → Create draft framework_version (status='draft')
          → Notify Complerer admins for review
            → Admin publishes → workspaces notified of available update
```

### Source Monitors
| Framework | Detection Method |
|---|---|
| NIST CSF | csf.tools API / nist.gov page hash |
| CIS v8 | CIS website page hash / RSS |
| PCI DSS | pcisecuritystandards.org document listing |
| ISO 27001 | iso.org publication page |
| SOC 2 | aicpa.org TSC criteria page |

### Tasks
- [ ] Create `apps/monitor` CF Worker with weekly cron trigger
- [ ] Implement hash-based change detection per framework source
- [ ] Store last-known hashes in KV: `framework:{slug}:last_hash`
- [ ] On change detected: parse new control data → diff against current version
- [ ] AI change analysis: Claude summarizes what changed, identifies crosswalk impacts, rates urgency
- [ ] Create draft `framework_version` with new controls + `previous_version_id` link
- [ ] Auto-generate `supersedes` mappings between old and new controls (AI-assisted)
- [ ] Auto-suggest new crosswalk mappings for added/modified controls
- [ ] Notify Complerer admins via email/Slack with impact summary
- [ ] Build admin review UI: see diff, approve/reject, publish draft → `current`
- [ ] On publish: notify all workspaces that have adopted the previous version

### Deliverables
- Automated upstream monitoring with AI-powered change analysis
- Draft versions for human review before publication
- No auto-push of changes

---

## 1.6 Workspace Version Adoption Flow

### Why
When a new framework version is published, workspaces need to adopt it on their own timeline. This is not a migration — it's adding a new adoption alongside the existing one.

### Flow
```
1. Complerer publishes ISO 27001:2025 (framework_version status='current', old='superseded')
2. Workspace "Applivery" currently has adoption of ISO 27001:2022 (effective_until=NULL)
3. System generates evidence_suggestions:
   For each evidence_link on 2022 controls:
     → Find superseding control in 2025 via `supersedes` field
     → Find crosswalk matches
     → Run semantic similarity
     → Create evidence_suggestion with confidence score
4. Workspace admin sees notification:
   "ISO 27001:2025 is available. You have 47 evidence items on ISO 2022.
    43 apply to 2025 controls (12 high-confidence, 31 need review).
    4 new controls have no prior evidence."
5. Admin clicks "Adopt ISO 2025":
   → New workspace_adoption created (effective_from=today)
   → Old adoption gets effective_until=admin-chosen date (overlap period)
   → Admin reviews evidence_suggestions → accept/reject each
   → Accepted suggestions create NEW evidence_links (original links untouched)
6. During overlap: workspace evaluates against BOTH versions simultaneously
7. After overlap expires: only 2025 is active. 2022 adoption remains in history forever.
```

### Database Tables

#### `evidence_suggestions` (for version transitions)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `evidence_id` | TEXT | FK → evidence.id |
| `target_control_id` | TEXT | FK → versioned_controls.id (control in new version) |
| `source_link_id` | TEXT | FK → evidence_links.id (original link that inspired this) |
| `reason` | TEXT | `supersedes_control` / `crosswalk_match` / `semantic_similarity` |
| `confidence` | REAL | 0.0-1.0 |
| `status` | TEXT | `pending` / `accepted` / `rejected` |
| `reviewed_by` | TEXT | FK → auth_users.id |
| `reviewed_at` | TEXT (ISO 8601) | |
| `created_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0012_create_evidence_suggestions.sql`
- [ ] Build evidence suggestion engine: given old adoption + new version → generate suggestions
- [ ] Use `supersedes` field for direct control lineage matching
- [ ] Use crosswalk for indirect matching across frameworks
- [ ] Use Vectorize semantic similarity as fallback (embed evidence title+description, compare to new control text)
- [ ] Build adoption flow API: `POST /api/w/:id/adoptions` with overlap period configuration
- [ ] Build suggestion review API: `PATCH /api/w/:id/evidence-suggestions/:id` (accept/reject)
- [ ] Build batch accept: `POST /api/w/:id/evidence-suggestions/batch-accept` for high-confidence suggestions
- [ ] Build adoption UI: shows diff between versions, evidence suggestions, overlap timeline
- [ ] Write test: adopt new version → evidence suggestions created → accept → new evidence_links created → old links unchanged

### Deliverables
- Non-destructive version adoption with evidence carry-forward
- AI-powered evidence suggestions with confidence scoring
- Dual-version evaluation during transition periods
- Full history preserved permanently

---

## 1.7 Vector Embeddings for RAG

### Why
Semantic search over controls powers the chat agent. Embeddings must include version metadata for filtering.

### Architecture
```
versioned_controls.requirement_text + title + domain + annotations
  → Gemini text-embedding-004 → 768-dim vector
  → Cloudflare Vectorize index (metadata: framework_slug, version, domain, control_id)

User question → same embedding → cosine similarity
  → Filter by workspace's active adoptions (only search controls in adopted versions)
  → top-K controls → feed to Claude as context
```

### Tasks
- [ ] Create Cloudflare Vectorize index: `complerer-controls` with 768 dimensions, cosine metric
- [ ] Write embedding pipeline: iterate all versioned_controls → embed → upsert into Vectorize
- [ ] Store metadata: `framework_slug`, `version`, `domain`, `control_id`, `framework_version_id`
- [ ] Create API utility: `searchControls(workspaceId, query, options?)` — filters by workspace's active adoptions
- [ ] Test: "password complexity" → returns relevant controls only from workspace's adopted versions
- [ ] Test: "incident response plan" → returns IR controls across adopted frameworks
- [ ] Re-embedding trigger: when new framework_version is published, embed its controls
- [ ] Re-embedding trigger: when workspace_custom_controls are created, embed them with workspace-scoped metadata

### Deliverables
- Vectorize index with all controls embedded (version-aware)
- Semantic search scoped to workspace's active adoptions
- Auto-embed on new version publication

---

## 1.8 Framework API Endpoints

### Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/w/:id/frameworks` | List all frameworks |
| `GET` | `/api/w/:id/frameworks/:slug/versions` | List all versions of a framework |
| `GET` | `/api/w/:id/frameworks/:slug/versions/:version` | Get specific version + stats |
| `GET` | `/api/w/:id/frameworks/:slug/versions/:version/controls` | List controls (paginated, filterable) |
| `GET` | `/api/w/:id/controls/:controlId` | Get control details + crosswalks + overrides (merged read) |
| `GET` | `/api/w/:id/controls/:controlId/supersedes-chain` | Full version lineage |
| `GET` | `/api/w/:id/controls/search` | Semantic search via Vectorize |
| `POST` | `/api/w/:id/adoptions` | Adopt a framework version |
| `GET` | `/api/w/:id/adoptions` | List adoptions (`?active=true`, `?as_of=date`) |
| `POST` | `/api/w/:id/overrides` | Create control override |
| `PATCH` | `/api/w/:id/overrides/:id` | Update override |
| `POST` | `/api/w/:id/custom-controls` | Create workspace custom control |

### Tasks
- [ ] Implement all framework + version API endpoints
- [ ] Implement adoption endpoints with temporal queries
- [ ] Implement override CRUD endpoints
- [ ] Implement custom control CRUD endpoints
- [ ] Implement merged read path (base + override)
- [ ] Add `?as_of=` parameter to adoption queries for point-in-time lookups
- [ ] Add cursor-based pagination to control lists
- [ ] Add domain filter to control lists
- [ ] Write integration tests for each endpoint
- [ ] Ensure all endpoints are workspace-scoped

### Deliverables
- Full API for versioned frameworks, temporal adoptions, and overlays
- Point-in-time queries work via `?as_of=` parameter

---

## Phase 1 Completion Criteria

- [ ] 5 frameworks seeded as immutable versioned packages
- [ ] 200+ crosswalk mappings with confidence scores
- [ ] Workspace adoption model: adopt, overlap, supersede — never delete
- [ ] Overlay system: workspace overrides merge with base controls
- [ ] Evidence suggestion engine for version transitions
- [ ] Upstream change monitor (weekly cron) with AI analysis
- [ ] Vectorize index with all controls (version-aware, adoption-scoped)
- [ ] Semantic search scoped to workspace's active adoptions
- [ ] Point-in-time adoption queries (`?as_of=`)
- [ ] All framework data immutable (no UPDATE/DELETE on core tables)
- [ ] Integration tests passing
