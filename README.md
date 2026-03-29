# Complerer

Compliance automation platform that helps organizations achieve and maintain security certifications (SOC 2, ISO 27001, ENS, PCI DSS, etc.) through project-based compliance management, automated evidence collection, cross-certification reuse, and continuous monitoring.

## Value Proposition

**The problem**: Getting certified is expensive, slow, and manual. Companies hire consultants, spend months collecting evidence in spreadsheets, and start from scratch for each new certification.

**Complerer solves this by**:
- Providing a **library of pre-built frameworks, controls, policies, baselines, and systems** so you never start from zero
- Organizing compliance into **projects** (one per certification effort) with progress tracking
- Enabling **cross-certification reuse** via control crosswalks (evidence for SOC 2 auto-maps to ISO 27001)
- Consolidating **access management** (who has access to what, at what cost) in one place
- Offering **AI-assisted compliance** (policy generation, gap analysis, chat assistant)
- Running on **serverless infrastructure** (Cloudflare) for low cost and global edge performance

## How It Works (Mental Model)

```
Frameworks (SOC 2, ISO 27001, ENS)
  --> Policies (what you commit to doing)
       --> Baselines (expected state -- technical or procedural)
            --> Integrations (pull real system data)
                 --> Events (real-time activity)
                 --> Evidence (proof -- auto or manual)
                      --> Gap Analysis (expected vs actual)
                           --> Risk Register (what could go wrong)

Access Register (orthogonal -- connects to everything)
  |-- People (employee directory)
  |-- Systems (tool/app inventory)
  |-- Access Records (who -> what -> role -> cost -> status)
  --> feeds into Policies, Baselines, Evidence, Risks
```

### End-to-End Example

1. **Policy**: "All users must have MFA enabled"
2. **Baseline**: MFA = enabled on identity provider
3. **Integration**: Connected to Okta
4. **Event**: New user created without MFA
5. **Baseline check**: FAIL
6. **Evidence**: Report showing users without MFA
7. **Gap**: 15 users non-compliant
8. **Risk**: Unauthorized access due to missing MFA
9. **Access Register**: Those users have access to sensitive production systems

## Architecture

```
complerer/
  apps/
    api/              Hono API on Cloudflare Workers (D1 + R2)
    web/              React SPA on Cloudflare Pages (Vite + TanStack Router)
  packages/
    db/               D1 migrations (49 SQL files)
    shared/           Shared types, validators, permissions (Zod)
    reports/          Report generator module (types, validators, API sub-app)
```

### Infrastructure

| Resource | Service | Purpose |
|----------|---------|---------|
| `complerer-api` | CF Worker | API backend (Hono framework) |
| `complerer` | CF Pages | Frontend SPA (React + Vite) |
| `complerer-db` | CF D1 | SQLite database |
| `complerer-evidence` | CF R2 | Evidence file storage |

### Request Flow

```
Browser --> dash.complerer.com (CF Pages)
  |-- Static assets served directly
  |-- /api/* --> functions/api/[[path]].js (CF Pages Function)
                  --> proxies to complerer-api.paulo-acb.workers.dev (CF Worker)
                       --> D1 (database) + R2 (files)
```

The Pages Function proxy (`apps/web/functions/api/[[path]].js`) forwards all API requests to the Worker. This keeps frontend and API on the same domain, avoiding CORS issues.

## Module Guide

### 1. Compliance Projects (`projects.ts`)

The central organizing unit. Each project represents one certification effort (e.g., "SOC 2 Type II -- 2025").

| Concept | Description |
|---------|-------------|
| **Project** | A certification effort with a framework, timeline, auditor, and status |
| **Project Controls** | All controls from the framework, with coverage status (gap vs covered) |
| **Project Evidence** | Evidence linked to specific controls within this project |
| **Project Gaps** | Controls without evidence -- auto-computed |
| **Cross-reuse** | Crosswalks auto-suggest evidence from other projects |

**Statuses**: `planning` -> `in_progress` -> `audit_ready` -> `in_audit` -> `completed` -> `archived`

**API endpoints**:
- `GET/POST /projects` -- List/create projects
- `GET/PUT/DELETE /projects/:id` -- CRUD
- `GET /projects/:id/controls` -- Controls with coverage
- `GET/POST/DELETE /projects/:id/evidence` -- Evidence linking
- `GET /projects/:id/gaps` -- Auto-computed gaps
- `GET /projects/:id/policies` -- Relevant policies
- `GET /projects/:id/baselines` -- Active baselines
- `GET /projects/:id/risks` -- Workspace risks

### 2. Frameworks (`frameworks.ts`)

Compliance frameworks are the standards you certify against.

| Concept | Description |
|---------|-------------|
| **Framework** | A standard (SOC 2, ISO 27001, ENS) |
| **Framework Version** | A specific version (e.g., "SOC 2 v2024") |
| **Controls** | Individual requirements within a version |
| **Crosswalks** | Mappings between controls across frameworks |
| **Adoption** | A workspace activating a framework version |

**Seeded frameworks**: SOC 2 v2024 (61 controls), ISO 27001:2022 (93 controls), ENS RD 311-2022 (75 controls), NIST CSF, GDPR, HIPAA, PCI DSS

**Crosswalk network** (138 mappings):
- SOC 2 <-> ISO 27001: 70 crosswalks
- ENS <-> ISO 27001: 41 crosswalks
- ENS <-> SOC 2: 27 crosswalks

### 3. Policies (`compliance.ts`)

High-level rules that define organizational commitments.

| Field | Description |
|-------|-------------|
| **Title** | Policy name (e.g., "Acceptable Use Policy") |
| **Category** | security, access, privacy, hr, incident, etc. |
| **Status** | draft, active, archived |
| **Control Links** | Which framework controls this policy satisfies |
| **Owner** | Who is responsible for maintaining it |

**Library**: Pre-built policy templates (seeded via admin) that workspaces can adopt.

### 4. Baselines (`compliance.ts`)

Expected state rules -- technical or procedural.

| Field | Description |
|-------|-------------|
| **Name** | Rule description (e.g., "MFA enabled on all accounts") |
| **Category** | identity_access, data_protection, network, endpoint, logging, etc. |
| **Severity** | critical, high, medium, low |
| **Rule Type** | automated (checkable via integration) or manual (requires attestation) |
| **Control Links** | Which framework controls this baseline maps to |

**Library**: ~50 pre-built baselines across 8 categories that workspaces can activate.

### 5. Evidence (`compliance.ts`)

Proof that controls are being met.

| Field | Description |
|-------|-------------|
| **Title** | Evidence description |
| **Source** | manual, integration, automated |
| **File** | Uploaded to R2 (screenshots, PDFs, exports) |
| **Control Links** | Which controls this evidence satisfies |
| **Expires** | When evidence needs refreshing |

Evidence can be linked to controls at two levels:
- **Workspace level**: `evidence_links` table (evidence <-> control)
- **Project level**: `project_evidence` table (evidence <-> control <-> project)

### 6. Access Register (`compliance.ts`)

Comprehensive inventory of who has access to what.

| Section | Description |
|---------|-------------|
| **People** | Employee directory with department, title, status (active/inactive/on_leave/terminated) |
| **Systems** | Tool/app inventory with classification, sensitivity, environment, MFA status |
| **Access Records** | Junction: person + system + role + license type + cost + status |

**Features**:
- CSV bulk import for people
- System library (200+ pre-built tools by category)
- Custom fields per entity type
- Cost tracking (USD/EUR/GBP with proper locale formatting)
- Grouped view by person (access count per employee)
- Access review workflow (requested -> approved -> active -> in_review -> revoked)

### 7. Risk Register (`compliance.ts`)

Structured risk tracking following ISO 31000 methodology.

| Field | Description |
|-------|-------------|
| **Title/Description** | What could go wrong |
| **Asset/Threat** | What's at risk and the threat vector |
| **Likelihood/Impact** | Risk assessment (1-5 scale) |
| **Inherent Risk** | Risk level before controls |
| **Residual Risk** | Risk level after controls |
| **Treatment** | accept, mitigate, transfer, avoid |
| **Status** | open, mitigated, accepted, closed |

### 8. Events (`compliance.ts`)

Audit trail of all compliance-relevant activities.

Auto-generated events for: evidence creation, policy changes, access grants/revocations, risk updates, framework adoptions, project milestones.

### 9. Trust Center (`trust.ts`)

Public-facing page showing compliance posture.

- Workspace configures via Settings (feature flag: `trustCenterEnabled`)
- Public URL: `complerer.com/trust/:slug`
- Shows: adopted frameworks, policy summaries, compliance status

### 10. AI Chat (`chat.ts`)

Compliance assistant powered by Claude/Gemini.

- Context-aware (knows workspace frameworks, controls, gaps)
- Can generate policy drafts, explain controls, suggest evidence
- Provider configurable in Settings (Anthropic or Google)

### 11. Settings (`compliance.ts`, `settings.tsx`)

Workspace configuration:

| Section | Description |
|---------|-------------|
| **General** | Name, slug, description, logo |
| **Libraries** | Browse and activate frameworks, systems, baselines, policies, employees |
| **Custom Fields** | Define custom fields per entity (system, person, access_record) |
| **Integrations** | Connect external tools |
| **Trust Center** | Public trust page settings |
| **Members** | Invite and manage workspace members |
| **Feature Flags** | Toggle features (trust center, AI, etc.) |

### 12. Super Admin (`admin.ts`)

Platform-wide management at `/admin`:

| Section | Description |
|---------|-------------|
| **Workspaces** | CRUD all workspaces |
| **Users** | Manage all users |
| **Libraries** | CRUD frameworks, controls, crosswalks, systems, baselines, policies, employees |
| **Email Templates** | Edit transactional email templates |
| **Seed** | Bulk seed data |

### 13. Reports (`packages/reports/`)

Certification-grade audit report system. Built as a **Package Library** — all code lives in `packages/reports/`, mounted by the host apps with minimal glue code.

**Architecture**: Self-contained package exporting types, Zod validators, and a Hono sub-app. The API mounts it with one `app.route()` call; the web app lazy-loads the reports page.

```
packages/reports/src/
  index.ts              Barrel exports (types, validators, API factory)
  types/                Report, Template, Finding, Approval, Export types
  validators/           Zod schemas for all report operations
  api/                  Hono sub-app factory (createReportsAPI)
  migrations/           Report-specific D1 migrations
  templates/            Pre-built report templates (SOC 2, ISO 27001, etc.)
```

**Mounting**:
```ts
// apps/api/src/index.ts — one line
app.route('/api/workspaces/:workspaceId/reports', createReportsAPI())

// apps/web/src/routes/index.tsx — lazy-loaded route
const ReportsPage = lazy(() => import('@/pages/reports'))
```

**Implementation Phases**:

| Phase | Feature | Description |
|-------|---------|-------------|
| 1 | Editor Foundation | TipTap rich editor with slash menu and custom blocks |
| 2 | Template System | Report templates per framework with variables and sections |
| 3 | Report Generation | Create reports from templates, variable resolution, versioning |
| 4 | AI Drafting | AI-assisted section drafting, summaries, finding narratives (SSE streaming) |
| 5 | PDF Export | Cloudflare Browser Rendering (Puppeteer) for audit-ready PDFs |
| 6 | Findings Management | Structured findings with lifecycle (open -> remediated -> validated) |
| 7 | Approval Workflow | Multi-role sign-off (draft -> review -> approved -> published) with locking |
| 8 | Advanced Blocks | Control matrices, risk heatmaps, charts, timelines, evidence galleries |
| 9 | Cross-Framework | Evidence reuse, report comparison, bulk generation, sharing, retention |

## Database Schema (Key Tables)

### Auth & Workspaces
- `auth_users` -- User accounts (email, OTP-based auth)
- `workspaces` -- Multi-tenant workspaces
- `workspace_members` -- User-workspace membership with roles

### Frameworks
- `frameworks` -- Framework definitions
- `framework_versions` -- Versioned releases
- `versioned_controls` -- Individual controls per version
- `control_crosswalks` -- Cross-framework control mappings
- `workspace_adoptions` -- Which frameworks a workspace has adopted

### Compliance
- `policies` -- Workspace policies
- `policy_controls` -- Policy-to-control links
- `baselines` -- Configuration rules
- `baseline_controls` -- Baseline-to-control links
- `evidence` -- Evidence artifacts
- `evidence_links` -- Evidence-to-control links
- `risk_entries` -- Risk register

### Access Register
- `directory_users` -- Employee directory
- `systems` -- Tool/app inventory
- `access_records` -- Access junction (person + system + role + cost)

### Projects
- `compliance_projects` -- Certification projects
- `project_evidence` -- Evidence linked per-project per-control
- `project_milestones` -- Project timeline milestones

### Libraries (seeded by admin, consumed by workspaces)
- `system_library` -- Pre-built systems/tools
- `employee_directory_library` -- Department/role templates
- `baseline_library` -- Pre-built baselines
- `policy_library` -- Pre-built policy templates

### Reports (planned -- `packages/reports/src/migrations/`)
- `report_templates` -- Report templates per framework
- `reports` -- Generated reports with lifecycle status
- `report_versions` -- Version history per report
- `report_findings` -- Structured audit findings
- `report_approvals` -- Sign-off audit trail
- `report_exports` -- PDF export records (R2 storage)

### Custom Fields
- `custom_field_definitions` -- Field definitions per workspace per entity type
- `custom_field_values` -- Field values per entity

## Prerequisites

- Node.js >= 20
- pnpm
- Wrangler CLI (`npm i -g wrangler`) authenticated via `wrangler login`

## Local Development

```bash
# Install dependencies
pnpm install

# Start both API + frontend
pnpm dev

# Or individually:
pnpm dev:api   # http://localhost:8787
pnpm dev:web   # http://localhost:5173
```

### Local Environment Variables

Create `apps/api/.dev.vars`:

```
BREVO_API_KEY=your-brevo-key
ANTHROPIC_API_KEY=your-anthropic-key
GEMINI_API_KEY=your-gemini-key
SUPER_ADMIN_EMAIL=admin@example.com
```

## Database

### Apply all migrations

```bash
# Local
for f in packages/db/src/migrations/*.sql; do
  npx wrangler d1 execute complerer-db --local --file "$f"
done

# Remote (production)
for f in packages/db/src/migrations/*.sql; do
  npx wrangler d1 execute complerer-db --remote --file "$f"
done
```

### Run a single migration

```bash
npx wrangler d1 execute complerer-db --remote --file packages/db/src/migrations/0049_nullable_template_fields.sql
```

### Query

```bash
npx wrangler d1 execute complerer-db --remote --command "SELECT COUNT(*) FROM frameworks"
```

## Deploy

### API Worker

```bash
cd apps/api
pnpm wrangler deploy

# First-time secrets:
wrangler secret put BREVO_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GEMINI_API_KEY
```

### Frontend

```bash
cd apps/web
pnpm build
npx wrangler pages deploy dist --project-name complerer
```

### Deploy Both (one-liner)

```bash
cd apps/api && pnpm wrangler deploy && cd ../web && pnpm build && npx wrangler pages deploy dist --project-name complerer
```

## Migrate to New Cloudflare Account

1. Update `account_id` in `apps/api/wrangler.toml`
2. Create resources:
   ```bash
   wrangler d1 create complerer-db
   wrangler r2 bucket create complerer-evidence
   wrangler pages project create complerer
   ```
3. Update `database_id` in `wrangler.toml` with the new D1 ID
4. Run all migrations
5. Seed data via admin panel or API
6. Set secrets
7. Update worker URL in `apps/web/functions/api/[[path]].js`
8. Deploy API + frontend
9. Configure custom domain DNS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TanStack Router, TanStack Query, Tailwind CSS 4, Hugeicons |
| **API** | Hono (TypeScript), Zod validation |
| **Database** | Cloudflare D1 (SQLite at edge) |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Hosting** | Cloudflare Workers + Pages |
| **Auth** | Email OTP via Brevo |
| **AI** | Claude (Anthropic) + Gemini (Google) |
| **Email** | Brevo transactional API |
