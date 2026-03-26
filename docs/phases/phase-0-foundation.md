# Phase 0 — Foundation

**Timeline:** Week 1-2
**Goal:** Establish the monorepo structure, multi-tenant data model, auth system, and tenant isolation pattern. Nothing ships without this.

---

## 0.1 Monorepo Scaffold

### Why
A clean monorepo ensures shared types, consistent tooling, and independent deployability of frontend/backend.

### Tasks
- [ ] Initialize monorepo with `pnpm` workspaces
- [ ] Create `apps/web` — React 19 + Vite 6 + Tanstack Router + shadcn/ui + Tailwind CSS 4 (dark-first, primary #34D399)
- [ ] Create `apps/api` — Hono on Cloudflare Workers
- [ ] Create `packages/shared` — shared TypeScript types, validators (zod), constants
- [ ] Create `packages/db` — D1 schema definitions, migrations, seed scripts
- [ ] Configure `tsconfig` paths across workspaces
- [ ] Set up ESLint + Prettier with shared config
- [ ] Set up Vitest for unit tests across all packages
- [ ] Create `.dev.vars` template for local Cloudflare secrets
- [ ] Add `wrangler.toml` for Workers configuration
- [ ] Verify local dev: `pnpm dev` starts both web + api concurrently

### Deliverables
- Running React SPA at `localhost:5173`
- Running Hono API at `localhost:8787`
- Shared types importable from `@complerer/shared`

---

## 0.2 Multi-Tenant Data Model

### Why
Every table must be workspace-scoped from day one. Retrofitting tenant isolation is a full rewrite.

### Database Tables

#### `workspaces`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `name` | TEXT | Workspace display name |
| `slug` | TEXT UNIQUE | URL-safe identifier |
| `plan` | TEXT | free / pro / enterprise |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `workspace_members`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `user_id` | TEXT | FK → auth_users.id |
| `role` | TEXT | owner / admin / auditor / member / viewer |
| `invited_by` | TEXT | FK → auth_users.id |
| `joined_at` | TEXT (ISO 8601) | |

#### `auth_users`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `email` | TEXT UNIQUE | From SSO/CF Access |
| `name` | TEXT | Display name |
| `avatar_url` | TEXT | Optional |
| `last_login_at` | TEXT (ISO 8601) | |
| `created_at` | TEXT (ISO 8601) | |

#### `invitations`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `email` | TEXT | Invitee email |
| `role` | TEXT | Role to assign on accept |
| `invited_by` | TEXT | FK → auth_users.id |
| `status` | TEXT | pending / accepted / expired |
| `expires_at` | TEXT (ISO 8601) | 7-day TTL |
| `created_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0001_create_auth_users.sql`
- [ ] Create D1 migration: `0002_create_workspaces.sql`
- [ ] Create D1 migration: `0003_create_workspace_members.sql`
- [ ] Create D1 migration: `0004_create_invitations.sql`
- [ ] Add indexes: `workspace_members(workspace_id)`, `workspace_members(user_id)`, `invitations(email, status)`
- [ ] Create Zod schemas for all entities in `packages/shared`
- [ ] Write seed script for development (test workspace + 3 users with different roles)

### Deliverables
- All migrations run cleanly on local D1
- Seed data creates a usable dev environment

---

## 0.3 Authentication + Workspace Creation Flow

### Why
Users need to sign in via SSO (Cloudflare Access), land on a workspace selector, and either create or join a workspace.

### Auth Flow
```
CF Access (SSO) → JWT validated in Hono middleware → lookup/create auth_user
  → if 0 workspaces: redirect to /onboarding (create workspace)
  → if 1 workspace: redirect to /dashboard
  → if N workspaces: show workspace selector
```

### API Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/callback` | Validate CF Access JWT, upsert user |
| `GET` | `/api/auth/me` | Current user + workspaces list |
| `POST` | `/api/workspaces` | Create workspace (becomes owner) |
| `GET` | `/api/workspaces` | List user's workspaces |
| `GET` | `/api/workspaces/:id` | Get workspace details |
| `POST` | `/api/workspaces/:id/invitations` | Invite member by email |
| `POST` | `/api/invitations/:id/accept` | Accept invitation |
| `GET` | `/api/workspaces/:id/members` | List workspace members |
| `PATCH` | `/api/workspaces/:id/members/:memberId` | Change member role |
| `DELETE` | `/api/workspaces/:id/members/:memberId` | Remove member |

### Tasks
- [ ] Implement CF Access JWT validation middleware in Hono
- [ ] Create `POST /api/auth/callback` — upsert `auth_users` from JWT claims
- [ ] Create `GET /api/auth/me` — return user profile + workspace memberships
- [ ] Create `POST /api/workspaces` — create workspace + add creator as owner
- [ ] Create `GET /api/workspaces` — list workspaces for current user
- [ ] Create `POST /api/workspaces/:id/invitations` — send invite (admin+ only)
- [ ] Create `POST /api/invitations/:id/accept` — join workspace with assigned role
- [ ] Create member management endpoints (list, update role, remove)
- [ ] Build React pages: `/login`, `/onboarding`, `/workspaces` (selector), `/dashboard` (shell)
- [ ] Add workspace context to React — `useWorkspace()` hook that holds current workspace
- [ ] Persist workspace selection in cookie/localStorage for return visits
- [ ] Write integration tests for the full auth flow

### Deliverables
- User can sign in via CF Access, create a workspace, and invite others
- Workspace selector works for multi-workspace users
- All endpoints enforce authentication

---

## 0.4 Row-Level Tenant Isolation

### Why
D1 has no native RLS. You must enforce workspace isolation in application code. A single leaked cross-tenant query breaks trust forever.

### Pattern
```typescript
// Middleware: extract workspace_id from URL + verify membership
app.use('/api/workspaces/:workspaceId/*', async (c, next) => {
  const workspaceId = c.req.param('workspaceId')
  const userId = c.get('userId')
  const member = await db.query(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [workspaceId, userId]
  )
  if (!member) return c.json({ error: 'Forbidden' }, 403)
  c.set('workspaceId', workspaceId)
  c.set('memberRole', member.role)
  await next()
})

// Helper: every query function receives workspaceId
function withWorkspace(c: Context) {
  return {
    workspaceId: c.get('workspaceId'),
    role: c.get('memberRole'),
    db: c.env.DB,
  }
}
```

### Tasks
- [ ] Create `workspaceAuth` middleware — validates membership + sets `workspaceId` + `memberRole` on context
- [ ] Create `withWorkspace(c)` helper — returns `{ workspaceId, role, db }` for all downstream queries
- [ ] Create `requireRole(minRole)` middleware — checks `memberRole` against required level (owner > admin > auditor > member > viewer)
- [ ] Ensure ALL workspace-scoped queries include `WHERE workspace_id = ?` — add TypeScript utility that makes this impossible to forget
- [ ] Write a query builder wrapper that auto-injects `workspace_id` on SELECT/INSERT/UPDATE
- [ ] Create test: attempt cross-tenant access → expect 403
- [ ] Create test: query without workspace_id → expect TypeScript error or runtime guard
- [ ] Audit all existing endpoints to confirm workspace isolation

### Deliverables
- No endpoint can return data from another workspace
- TypeScript types make it hard to write un-scoped queries
- Integration tests prove isolation

---

## 0.5 Dev Tooling & CI

### Tasks
- [ ] Set up GitHub repo with branch protection on `main`
- [ ] Create GitHub Actions CI: lint + type-check + test on PR
- [ ] Add Wrangler deploy commands for staging + production
- [ ] Create `CONTRIBUTING.md` with setup instructions
- [ ] Set up Changesets for versioning (optional at this stage)

### Deliverables
- PRs are gated by CI
- One-command deploy to CF

---

## Phase 0 Completion Criteria

- [ ] Monorepo runs locally with hot reload (web + api)
- [ ] D1 schema has workspaces, members, users, invitations
- [ ] Auth flow works end-to-end (SSO → workspace → dashboard)
- [ ] Every API query is workspace-scoped with no exceptions
- [ ] At least 1 integration test per critical flow
- [ ] CI pipeline passes
