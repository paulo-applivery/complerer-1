# System Library Guide

> **For AI assistants**: This is the authoritative reference for adding new systems and categories to the platform library. Read this entire file before making any changes.

---

## What is the System Library?

The system library (`system_library` table) is the **platform-wide source of truth** for known software tools. Super admins manage it at `/admin/libraries → Systems`. Workspace users import from it when adding systems to their asset inventory.

Each entry has:
- A unique `id` (prefixed `sl_`)
- A `name`, `category`, `vendor`, `website`, `description`
- A `default_classification` (`critical` | `standard` | `low`)
- A `default_sensitivity` (`high` | `medium` | `low`)
- An `icon_hint` used by the frontend for icon lookup

---

## Current Categories

| Category | Description |
|----------|-------------|
| `identity` | IAM, SSO, password managers |
| `cloud` | Cloud infrastructure and hosting |
| `devops` | CI/CD, version control, containers |
| `communication` | Messaging, email, video, docs |
| `project` | Issue tracking, project management |
| `security` | EDR, SIEM, vulnerability management |
| `data` | Databases, warehouses, BI tools |
| `crm` | CRM, sales, customer support |
| `hr` | Payroll, HRIS, people management |
| `finance` | Accounting, payments, expense management |
| `marketing` | Email marketing, analytics, SEO |
| `design` | Design tools, prototyping, creative suites |
| `productivity` | Office suites, automation, note-taking |
| `business` | Document signing, file storage, forms |
| `monitoring` | Observability, APM, alerting, on-call |
| `support` | Help desks, ticketing, live chat |

---

## Files to Edit

| File | Purpose |
|------|---------|
| `packages/db/src/migrations/006N_*.sql` | **New migration** — adds rows to `system_library` |
| `apps/web/src/pages/admin/libraries.tsx` | **Edit** — add new category names to `SYSTEM_CATEGORIES` constant |

No API or backend changes are needed — the API query is `SELECT * FROM system_library` with no category whitelist.

---

## How to Add New Systems to an Existing Category

### Step 1 — Write the migration

Create `packages/db/src/migrations/006N_add_<topic>_systems.sql` (use the next available number):

```sql
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_newrelic', 'New Relic', 'monitoring', 'Full-stack observability platform', 'New Relic', 'newrelic.com', 'standard', 'medium', 'shield'),
('sl_grafana',  'Grafana',   'monitoring', 'Metrics visualization and alerting', 'Grafana',  'grafana.com',  'standard', 'medium', 'shield');
```

**Rules:**
- `id` must be globally unique — prefix `sl_` then a lowercase snake_case slug (e.g. `sl_new_relic`)
- Always use `INSERT OR IGNORE` so re-running the migration is safe
- `default_classification`: `critical` (security-sensitive), `standard` (most tools), `low` (public/read-only)
- `default_sensitivity`: `high` (stores PII/secrets), `medium` (business data), `low` (no sensitive data)
- `icon_hint` maps to frontend icons — use one of: `key`, `cloud`, `code`, `shield`, `database`, `users`, `message`, `task`

### Step 2 — Run the migration

```bash
cd apps/api

# Local dev
node_modules/.bin/wrangler d1 execute complerer-db --local \
  --file=../../packages/db/src/migrations/006N_add_<topic>_systems.sql

# Production
node_modules/.bin/wrangler d1 execute complerer-db --remote --env production \
  --file=../../packages/db/src/migrations/006N_add_<topic>_systems.sql
```

That's all — no deploy needed if the category already exists in `SYSTEM_CATEGORIES`.

---

## How to Add a Brand-New Category

A new category requires **both** a migration and a frontend change.

### Step 1 — Write the migration (same as above)

Use the new category slug in the `category` column:

```sql
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_ironclad',  'Ironclad',  'legal', 'Contract lifecycle management',  'Ironclad', 'ironcladapp.com', 'critical', 'high', 'task'),
('sl_clio',      'Clio',      'legal', 'Legal practice management',      'Clio',     'clio.com',         'standard', 'high', 'task');
```

### Step 2 — Add the category to `SYSTEM_CATEGORIES`

Edit `apps/web/src/pages/admin/libraries.tsx`, find the `SYSTEM_CATEGORIES` constant and append the new slug:

```ts
const SYSTEM_CATEGORIES = [
  'identity', 'cloud', 'devops', 'communication', 'project',
  'security', 'data', 'crm', 'hr',
  'finance', 'marketing', 'design', 'productivity', 'business',
  'monitoring', 'support',
  'legal',   // ← add here
]
```

This makes the new category appear as a filter pill in the admin table and as an option in the create/edit modal.

### Step 3 — Run migration + deploy web

```bash
# 1. Run migration (local + remote, as above)

# 2. Deploy web
cd apps/web && pnpm run deploy
```

---

## How to Recategorize Existing Systems

Use an `UPDATE` statement in the migration:

```sql
-- Move finance tools that were mistakenly placed under 'hr'
UPDATE system_library SET category = 'finance' WHERE id IN ('sl_quickbooks', 'sl_stripe', 'sl_brex');
```

---

## Existing Systems Reference

Run this query to see all current entries before adding duplicates:

```bash
cd apps/api
node_modules/.bin/wrangler d1 execute complerer-db --local \
  --command="SELECT id, name, category FROM system_library ORDER BY category, name"
```

Or remotely:
```bash
node_modules/.bin/wrangler d1 execute complerer-db --remote --env production \
  --command="SELECT id, name, category FROM system_library ORDER BY category, name"
```

---

## Classification & Sensitivity Guidelines

Use these as defaults — workspace admins can override per asset.

| Tool type | classification | sensitivity |
|-----------|---------------|-------------|
| IAM / SSO / secrets | `critical` | `high` |
| Cloud infra (AWS, GCP, Azure) | `critical` | `high` |
| Source control (GitHub, GitLab) | `critical` | `high` |
| Payments / finance | `critical` | `high` |
| SIEM / security tools | `critical` | `high` |
| HR / payroll | `critical` | `high` |
| CRM with PII | `standard` | `high` |
| Email / comms | `standard` | `high` |
| Business ops (DocuSign, Box) | `standard` | `medium` |
| Monitoring / observability | `standard` | `medium` |
| Project management | `standard` | `low` |
| Design tools | `standard` | `low` |
| Marketing analytics | `standard` | `low` |
| Public-facing / low-risk | `low` | `low` |

---

## Icon Hints Reference

| `icon_hint` value | Used for |
|-------------------|---------|
| `key` | Identity, auth, passwords |
| `cloud` | Cloud infrastructure |
| `code` | Dev tools, CI/CD, design IDEs |
| `shield` | Security, monitoring, compliance |
| `database` | Data, analytics, storage |
| `users` | HR, CRM, finance, people tools |
| `message` | Communication, email, support, chat |
| `task` | Project mgmt, business ops, forms |

---

## Quick Checklist

- [ ] Migration file named `packages/db/src/migrations/006N_*.sql` (next available number)
- [ ] All `id` values are unique and prefixed `sl_`
- [ ] Used `INSERT OR IGNORE` (idempotent)
- [ ] If new category: added slug to `SYSTEM_CATEGORIES` in `libraries.tsx`
- [ ] Migration run locally (`--local`)
- [ ] Migration run on production (`--remote --env production`)
- [ ] If `SYSTEM_CATEGORIES` was edited: `cd apps/web && pnpm run deploy`
