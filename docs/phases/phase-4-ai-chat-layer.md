# Phase 4 — AI / Chat Layer (Temporal-Aware)

**Timeline:** Week 9-11
**Depends on:** Phase 1 (versioned frameworks + RAG), Phase 2 (compliance events + materialized views), Phase 3 (baselines + snapshots)
**Goal:** Build the AI-native interface with temporal awareness — the chat agent understands framework versions, can query historical states, and the dashboard supports time-travel.

---

## 4.1 Intent Classification + Tool Router

### Why
The chat must understand what the user wants and route to the right tool. This is not a generic chatbot — it's a structured agent with specific capabilities.

### Supported Intents
| Intent | Example | Tool |
|---|---|---|
| `register` | "I gave João access to prod DB, approved by Ana" | Entity extraction → create access_record |
| `review` | "Show all access changes last 30 days with no approver" | SQL query builder |
| `audit_prep` | "What evidence do I need for SOC 2 CC6.1?" | RAG over controls + evidence store |
| `validate` | "Does our password policy meet ISO 27001?" | Policy text → RAG → gap analysis |
| `alert_triage` | "Why did this trigger a flag?" | Baseline rule explanation |
| `gap_analysis` | "What's our ISO 27001 gap?" | Cross-framework delta computation |
| `time_travel` | "What was our SOC 2 posture in January?" | Event replay + historical query |
| `version_compare` | "What changed between ISO 2013 and 2022?" | Framework version diff |
| `general` | "What is SOC 2?" | Free generation with framework context |

### Architecture
```
User message
  → Claude API with tool_use (intent classification is implicit via tools)
  → Tools available:
     - register_access(user, system, role, approved_by, ...)
     - query_access(filters)
     - search_controls(query, framework?, version?)
     - check_evidence_gaps(framework, version?, control_id?)
     - validate_policy(policy_id, framework?, version?)
     - explain_violation(violation_id)
     - compute_gap_analysis(source_framework, target_framework)
     - get_historical_posture(framework, as_of)        # NEW: time travel
     - compare_framework_versions(framework, v1, v2)   # NEW: version diff
  → Claude selects tool → executes → formats response
```

### Tasks
- [ ] Design Claude tool schemas for all 9 intents (JSON schema for each tool)
- [ ] Implement `register_access` tool: extract entities from natural language → create access_record → emit compliance event
- [ ] Implement `query_access` tool: convert natural language filters to D1 queries
- [ ] Implement `search_controls` tool: semantic search via Vectorize, scoped to workspace's active adoptions
- [ ] Implement `check_evidence_gaps` tool: compare required vs. linked evidence per control (from evidence_links, not MV)
- [ ] Implement `validate_policy` tool: embed policy text → search adopted controls → compare requirements → output gaps
- [ ] Implement `explain_violation` tool: load baseline rule + violating record → generate explanation
- [ ] Implement `compute_gap_analysis` tool: use crosswalk to find unmapped/uncovered controls across adopted versions
- [ ] Implement `get_historical_posture` tool: replay compliance_events up to `as_of` date → return posture at that point
- [ ] Implement `compare_framework_versions` tool: diff controls between two versions (added/modified/removed/superseded)
- [ ] Create tool execution layer: receives tool call from Claude → executes against workspace data → returns structured result
- [ ] Add confirmation step for write operations (register_access): show extracted data → user confirms → write
- [ ] All write tools emit compliance events

### Deliverables
- Claude API integration with 9 workspace-aware, version-aware tools
- Natural language → structured action pipeline with temporal queries

---

## 4.2 Chat API + Conversation Management

### Why
Users need persistent conversation history, and the system needs to maintain context across messages within a session.

### Database Tables

#### `conversations`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `user_id` | TEXT | FK → auth_users.id |
| `title` | TEXT | Auto-generated from first message |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `conversation_id` | TEXT | FK → conversations.id |
| `workspace_id` | TEXT | FK → workspaces.id |
| `role` | TEXT | user / assistant / tool |
| `content` | TEXT | Message text |
| `tool_calls` | TEXT (JSON) | Tool calls made by assistant |
| `tool_results` | TEXT (JSON) | Results from tool execution |
| `tokens_used` | INTEGER | Token count for billing tracking |
| `created_at` | TEXT (ISO 8601) | |

### API Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/w/:id/chat` | Send message (streaming response) |
| `GET` | `/api/w/:id/conversations` | List conversations |
| `GET` | `/api/w/:id/conversations/:convId` | Get conversation + messages |
| `DELETE` | `/api/w/:id/conversations/:convId` | Delete conversation |

### Tasks
- [ ] Create D1 migration: `0022_create_conversations.sql`
- [ ] Create D1 migration: `0023_create_messages.sql`
- [ ] Implement streaming chat endpoint using Claude API with `stream: true`
- [ ] Build conversation context: load last N messages + system prompt with workspace context
- [ ] Create system prompt template: includes workspace name, active adoptions (framework + version), recent baselines, role context, available framework versions
- [ ] Implement conversation CRUD API
- [ ] Handle tool execution loop: Claude calls tool → execute → return result → Claude continues
- [ ] Rate limiting: max messages per minute per user (prevent abuse)
- [ ] Token tracking: log tokens_used per message for future billing
- [ ] Audit log: every AI-initiated write operation (register_access) is logged

### Deliverables
- Streaming chat with persistent conversation history
- Multi-turn conversations with tool use
- Token tracking for billing

---

## 4.3 RAG Pipeline

### Why
When users ask about controls, the system needs to retrieve the most relevant controls as context for Claude's response. Pure LLM knowledge isn't enough — the system must ground answers in the actual framework data.

### Pipeline
```
1. User question: "What evidence do I need for access control?"
2. Embed question with Gemini → 768-dim vector
3. Determine workspace's active adoptions → filter Vectorize by adopted framework_version_ids
4. Search Vectorize index → top 10 controls (only from adopted versions)
5. Enrich: for each control, load evidence_links + overlay overrides + MV status
6. Build context: controls + evidence gaps + workspace baselines + adoption info
7. Send to Claude with structured context
8. Claude generates grounded, version-aware, workspace-specific answer
```

### Tasks
- [ ] Implement RAG utility: `ragSearch(workspaceId, query, options?)` → scoped to active adoptions
- [ ] Build context assembly: merge versioned control data + workspace overrides + evidence_links + baseline violations
- [ ] Filter Vectorize by `framework_version_id` matching workspace's active adoptions
- [ ] Add framework + version filter: "only search ISO 27001:2022 controls"
- [ ] Add metadata filter to Vectorize queries (domain, framework_slug, framework_version_id)
- [ ] Implement context window management: truncate if context exceeds token limit
- [ ] Test RAG accuracy: create test suite with 20 questions → verify controls returned from correct adopted versions
- [ ] Optimize: cache Vectorize results for identical queries within 5 minutes

### Deliverables
- RAG pipeline that grounds AI answers in actual framework + workspace data
- >80% relevance on test query suite

---

## 4.4 Chat UI

### Why
The chat is the primary interface for non-technical users. It must feel fast, show tool execution transparently, and handle confirmations for write operations.

### Tasks
- [ ] Build chat UI component with shadcn/ui
- [ ] Implement streaming message display (token-by-token rendering)
- [ ] Show tool execution inline: "Searching controls..." → "Found 5 relevant controls" → answer
- [ ] Build confirmation dialog for write operations: show extracted data → confirm/edit/cancel
- [ ] Show referenced controls/evidence as clickable cards in responses
- [ ] Add conversation sidebar: list past conversations, create new
- [ ] Add suggested prompts for new users: "What evidence do I need for SOC 2?", "Register an access change", etc.
- [ ] Mobile-responsive chat layout
- [ ] Keyboard shortcuts: Enter to send, Shift+Enter for newline

### Deliverables
- Production-quality chat UI with streaming, tool transparency, and confirmations

---

## 4.5 Compliance Dashboard

### Why
The dashboard is the at-a-glance view of compliance posture. It answers: "Are we compliant? Where are the gaps? What needs attention?"

### Dashboard Widgets
| Widget | Data Source |
|---|---|
| **Compliance posture score** | mv_posture_score per adopted framework version |
| **Framework coverage** | mv_control_status aggregated per adopted framework (pie/bar) |
| **Evidence freshness** | Evidence expiry status (fresh/expiring/expired counts) |
| **Open violations** | baseline_violations with status=open, grouped by severity |
| **Risk heatmap** | risk_entries plotted on likelihood x impact grid |
| **Recent compliance events** | Last 20 compliance_events (richer than just access changes) |
| **Upcoming reviews** | access_reviews with status=pending, sorted by deadline |
| **Adoption timeline** | Visual timeline of framework adoptions with overlap periods |
| **Posture trend** | Posture score over time (computed from snapshots or event replay) |
| **Snapshot history** | List of compliance snapshots with integrity status |

### Tasks
- [ ] Create dashboard API: `GET /api/w/:id/dashboard` → returns all widget data in one call
- [ ] Add `?as_of=` parameter to dashboard API → returns historical posture (event replay)
- [ ] Implement posture score from mv_posture_score (per adopted framework version)
- [ ] Implement framework coverage stats per adopted version
- [ ] Implement evidence freshness stats
- [ ] Implement violation summary (by severity, category)
- [ ] Implement risk heatmap data
- [ ] Implement compliance events timeline (last 20 events, filterable)
- [ ] Implement posture trend chart: plot posture_score from snapshots over time
- [ ] Implement adoption timeline visualization (overlapping bars showing active periods)
- [ ] Build dashboard page with responsive grid layout
- [ ] Build each widget component using shadcn/ui + chart library (Chart.js or similar)
- [ ] Add time-travel date picker: select a past date → dashboard shows posture at that point
- [ ] Add time-range selector (7d / 30d / 90d / 1y) for trend charts
- [ ] Auto-refresh dashboard every 60 seconds

### Deliverables
- Comprehensive compliance dashboard with 10 widgets
- Time-travel: select any past date and see posture at that moment
- Adoption timeline shows framework version lifecycle
- Single API call populates all widgets
- Auto-refreshing, responsive layout

---

## Phase 4 Completion Criteria

- [ ] AI chat works with 9 tools (register, query, search, gaps, validate, explain, gap analysis, historical posture, version compare)
- [ ] All tools are version-aware (scoped to workspace's active adoptions)
- [ ] Streaming responses with tool execution transparency
- [ ] Write operations require user confirmation and emit compliance events
- [ ] Conversation history persisted and loadable
- [ ] RAG pipeline returns controls from adopted versions only, with >80% accuracy
- [ ] Dashboard shows compliance posture with 10 widgets
- [ ] Dashboard supports time-travel via `?as_of=` date picker
- [ ] Posture trend chart shows compliance trajectory over time
- [ ] Adoption timeline visualizes framework version lifecycle
- [ ] Token usage tracked per message
- [ ] All AI operations emit compliance events
