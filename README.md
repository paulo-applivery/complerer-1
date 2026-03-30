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
    db/               D1 migrations (59 SQL files)
    shared/           Shared types, validators, permissions (Zod)
    reports/          Report generator module (types, validators, API sub-app)
```

### Infrastructure

| Resource | Service | Purpose |
|----------|---------|---------|
| `complerer-api-production` | CF Worker | API backend (Hono framework) |
| `complerer` | CF Pages | Frontend SPA (React + Vite) |
| `complerer-db` | CF D1 | SQLite database |
| `complerer-evidence` | CF R2 | Evidence file storage |

### Request Flow

```
Browser --> dash.complerer.com (CF Pages)
  |-- Static assets served directly from Pages
  |-- /api/* --> functions/api/[[path]].ts (CF Pages Function)
                  --> proxies to complerer-api-production.paulo-acb.workers.dev
                       --> D1 (database) + R2 (files)
```

The Pages Function proxy (`apps/web/functions/api/[[path]].ts`) forwards all API requests — including POST/PUT/PATCH with bodies — to the Worker. This keeps frontend and API on the same domain, avoiding CORS issues.

> ⚠️ **Important**: The Pages Function is only included when the web deploy runs from `apps/web/`. Running `wrangler pages deploy` from any other directory silently skips the function bundle and breaks all API calls (405 errors). Always use `pnpm run deploy` from `apps/web/`.

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

### 11. Integrations (`integrations.ts`)

Connect external tools to automate evidence collection and anomaly detection.

**Auth types**:

| Type | Providers | How it works |
|------|-----------|-------------|
| `oauth_global` | GitHub, Google Workspace, Jira, Linear | One-click OAuth popup. Credentials managed by Complerer admin at `/admin/providers` |
| `oauth_custom` | Okta, Azure AD | Workspace admin provides their own OAuth app credentials |
| `api_key` | AWS, Applivery | Workspace admin provides API key/secret |

**OAuth flow** (for `oauth_global` providers):
1. User clicks "Connect with OAuth" → frontend calls `/api/integrations/oauth/:provider/init`
2. API reads `client_id` from `platform_provider_configs`, generates a CSRF state token (10 min expiry), returns authorization URL
3. Frontend opens a popup to the authorization URL
4. Provider redirects to `/api/oauth/callback` — API validates state, exchanges code for tokens
5. Tokens encrypted with AES-GCM (Web Crypto API) before storage
6. Popup posts `OAUTH_SUCCESS` message to parent and closes

**Token security**:
- Tokens stored as AES-GCM 256-bit encrypted blobs in `integrations.access_token_enc`
- `ENCRYPTION_KEY` secret must be set (32+ char string, never committed)
- Token columns are never returned in API list/get responses

**Activating OAuth providers** (super admin only):
1. Go to `/admin/providers` → **Integration** tab
2. Click **Show config** on a provider (e.g., GitHub)
3. See setup guide link + copyable OAuth callback URL to register in the provider's app settings
4. Fill in `client_id` and `client_secret`
5. Toggle the provider **enabled**

OAuth callback URL to register in each provider:
```
https://complerer-api-production.paulo-acb.workers.dev/api/oauth/callback
```

### 12. Reports (`packages/reports/`)

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

### 13. Settings (`compliance.ts`, `settings.tsx`)

Workspace configuration:

| Section | Description |
|---------|-------------|
| **General** | Name, slug, description, logo |
| **Organization** | Address, industry, size, website, registration ID, security officer, DPO, legal rep |
| **Libraries** | Browse and activate frameworks, systems, baselines, policies, employees |
| **Custom Fields** | Define custom fields per entity (system, person, access_record) |
| **Integrations** | Connect external tools |
| **Trust Center** | Public trust page settings |
| **Members** | Invite and manage workspace members |
| **Feature Flags** | Toggle features (trust center, AI, etc.) |

### 14. Super Admin (`admin.ts`)

Platform-wide management at `/admin` (requires `is_super_admin = 1`):

| Section | Description |
|---------|-------------|
| **Workspaces** | CRUD all workspaces |
| **Users** | Manage all users, grant/revoke super admin |
| **Libraries** | CRUD frameworks, controls, crosswalks, systems, baselines, policies, employees |
| **Providers** | Configure AI, email, and OAuth integration credentials |
| **Email Templates** | Edit transactional email templates |
| **Feature Flags** | Platform-wide feature toggles |
| **Seed** | Bulk seed data |

## Database Schema (Key Tables)

### Auth & Workspaces
- `auth_users` -- User accounts (email, OTP-based auth)
- `workspaces` -- Multi-tenant workspaces (+ org metadata fields)
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
- `compliance_projects` -- Certification projects (+ auditor/firm metadata fields)
- `project_evidence` -- Evidence linked per-project per-control
- `project_milestones` -- Project timeline milestones

### Libraries (seeded by admin, consumed by workspaces)
- `system_library` -- Pre-built systems/tools
- `employee_directory_library` -- Department/role templates
- `baseline_library` -- Pre-built baselines
- `policy_library` -- Pre-built policy templates
- `report_template_library` -- Pre-built report templates (admin-managed)

### Reports
- `report_templates` -- Workspace report templates (adopted from library)
- `reports` -- Generated reports with lifecycle status
- `report_versions` -- Version history per report
- `report_findings` -- Structured audit findings
- `report_approvals` -- Sign-off audit trail
- `report_exports` -- PDF export records (R2 storage)

### Integrations
- `integrations` -- Connected integrations (encrypted token columns: `access_token_enc`, `refresh_token_enc`)
- `integration_sync_logs` -- Sync history
- `anomalies` -- Detected anomalies with severity and resolution lifecycle
- `oauth_states` -- CSRF state tokens for OAuth popup flow (10 min expiry, single-use)

### Platform (admin-managed)
- `platform_providers` -- Provider definitions (AI, email, integration)
- `platform_provider_configs` -- Key/value config per provider (secrets stored masked)

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
GEMINI_API_KEY=your-gemini-key
SUPER_ADMIN_EMAIL=admin@example.com
ENCRYPTION_KEY=any-32-char-string-for-local-dev
```

## Database

### Apply all migrations

```bash
# Local
cd apps/api
for f in ../../packages/db/src/migrations/*.sql; do
  node_modules/.bin/wrangler d1 execute complerer-db --local --file "$f"
done

# Remote (production)
for f in ../../packages/db/src/migrations/*.sql; do
  node_modules/.bin/wrangler d1 execute complerer-db --remote --env production --file "$f"
done
```

### Run a single migration

```bash
cd apps/api
node_modules/.bin/wrangler d1 execute complerer-db --remote --env production \
  --file=../../packages/db/src/migrations/0059_seed_integration_providers.sql
```

### Query the DB

```bash
cd apps/api
node_modules/.bin/wrangler d1 execute complerer-db --remote --env production \
  --command "SELECT COUNT(*) FROM frameworks"
```

## Deploy

> ⚠️ Always deploy the web from **`apps/web/`**. Running the Pages deploy from any other directory silently drops the `functions/` bundle, breaking all `/api/*` calls with 405 errors.

### API Worker

```bash
cd apps/api
node_modules/.bin/wrangler deploy --env production
```

### Frontend (Pages + Function)

```bash
# Must run from apps/web so wrangler picks up functions/api/[[path]].ts
cd apps/web
pnpm run deploy   # builds + deploys in one command
```

The `deploy` script in `apps/web/package.json` is:
```
pnpm run build && ../api/node_modules/.bin/wrangler pages deploy dist --project-name complerer --commit-dirty=true
```

### Deploy Both

```bash
cd apps/api && node_modules/.bin/wrangler deploy --env production
cd ../web && pnpm run deploy
```

## Secrets

Set these once via Wrangler. They are never committed.

```bash
cd apps/api

# Required for all environments
wrangler secret put BREVO_API_KEY --env production
wrangler secret put ANTHROPIC_API_KEY --env production
wrangler secret put GEMINI_API_KEY --env production
wrangler secret put SUPER_ADMIN_EMAIL --env production

# Required for token encryption (integrations OAuth)
# Use any random 32+ character string
wrangler secret put ENCRYPTION_KEY --env production
```

OAuth provider credentials (GitHub, Google, Jira, Linear) are **not** set as Wrangler secrets. They are managed via the admin UI at `/admin/providers` → Integration tab and stored in `platform_provider_configs`.

## Activating OAuth Integrations

1. Register an OAuth application with the provider:
   - **GitHub**: github.com/settings/applications/new
   - **Google Workspace**: console.cloud.google.com → APIs & Services → Credentials
   - **Jira**: developer.atlassian.com → OAuth 2.0 apps
   - **Linear**: linear.app/settings/api → OAuth applications

2. Set the **callback URL** in each provider's app to:
   ```
   https://complerer-api-production.paulo-acb.workers.dev/api/oauth/callback
   ```

3. In Complerer, go to **`/admin/providers`** → **Integration** tab → find the provider → **Show config**

4. Paste `client_id` (public) and `client_secret` (masked/secret)

5. Toggle the provider **enabled**

Workspace admins can now click "Connect with OAuth" on the Integrations page.

## Migrate to New Cloudflare Account

1. Update `account_id` in `apps/api/wrangler.toml`
2. Create resources:
   ```bash
   wrangler d1 create complerer-db
   wrangler r2 bucket create complerer-evidence
   wrangler pages project create complerer
   ```
3. Update `database_id` in `wrangler.toml` with the new D1 ID
4. Run all migrations (see Database section above)
5. Seed data via admin panel or API
6. Set all secrets (see Secrets section above)
7. Update the worker URL in `apps/web/functions/api/[[path]].ts`
8. Deploy API: `cd apps/api && node_modules/.bin/wrangler deploy --env production`
9. Deploy web: `cd apps/web && pnpm run deploy`
10. Configure custom domain DNS

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
| **Token Encryption** | AES-GCM 256-bit via Web Crypto API (native to CF Workers) |
