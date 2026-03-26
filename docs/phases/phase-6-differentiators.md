# Phase 6 — Differentiators (Temporal-Native)

**Timeline:** Week 15+
**Depends on:** All previous phases
**Goal:** Build differentiating features leveraging the temporal ledger — historical gap analysis, version-aware policy validation, event-sourced risk scoring, MCP tools, and audit narration with full provenance.

---

## 6.1 Cross-Framework Gap Analysis

### Why
The killer question: "We're SOC 2 compliant. What's our gap vs. ISO 27001?" No competitor answers this well. The crosswalk engine makes it trivial.

### How It Works
```
1. User selects source framework version (SOC 2 v2024) and target (ISO 27001:2022)
2. Engine loads workspace adoptions → verifies source is adopted, target may or may not be
3. For each target control:
   a. Check if directly marked as compliant in mv_control_status → ✅
   b. Check crosswalk: is an equivalent source control compliant? → ✅ (auto-satisfied)
   c. Check crosswalk: partial mapping? → ⚠️ (partial coverage, with confidence score)
   d. No mapping and not assessed → ❌ (gap)
4. Check evidence_links: which evidence from source controls can be reused for target?
5. Output: gaps + partial coverage + effort estimate + evidence reuse + suggested evidence_links
```

### Temporal Gap Analysis
```
"What was our ISO 27001 gap 6 months ago vs. today?"
  → Replay compliance_events to compute posture at both dates
  → Diff the two posture states → show progress/regression per control
  → This is impossible without event sourcing
```

### Tasks
- [ ] Implement gap analysis engine: `computeGap(workspaceId, sourceVersion, targetVersion, asOf?)`
- [ ] Support `asOf` parameter: compute gap as it would have been at a historical date (via event replay)
- [ ] Calculate coverage stats: % compliant, % partial, % gap, % not applicable
- [ ] Estimate effort per gap: based on evidence requirements + similar controls' average time-to-close
- [ ] Identify evidence reuse: find evidence_links on source controls that could apply to target via crosswalk
- [ ] Generate evidence_suggestions for reusable evidence (same engine as version adoption flow)
- [ ] Support gap trend: compare gap analysis at two different dates → show progress
- [ ] Build gap analysis API: `POST /api/w/:id/gap-analysis` (with optional `as_of` and `compare_to` dates)
- [ ] Build gap analysis UI: side-by-side framework comparison with color-coded status
- [ ] Build gap trend view: progress chart showing gap closure over time
- [ ] Generate gap analysis PDF report for executive consumption (with snapshot reference)
- [ ] Integrate with AI chat: "What's our ISO 27001 gap?" and "How has our gap changed since January?"

### Deliverables
- One-click cross-framework gap analysis pinned to specific versions
- Historical gap analysis ("what was our gap 6 months ago?")
- Gap trend showing progress over time
- Evidence reuse suggestions via crosswalk
- PDF export with snapshot references

---

## 6.2 Policy-to-Control Validator

### Why
Users upload a policy document and want to know: "Does this satisfy the relevant controls?" The AI reads the policy, extracts structured requirements, maps them to controls, and flags gaps.

### Pipeline
```
1. User uploads policy (e.g. Password Policy PDF)
2. Extract text (done in Phase 3)
3. Claude analyzes text → extracts structured requirements:
   [{ "requirement": "Minimum 12 characters", "strength": "strong" },
    { "requirement": "90-day rotation", "strength": "medium" }]
4. For each requirement, embed + search Vectorize for matching controls
5. Compare policy requirements vs. control requirements:
   - Control says "complexity requirements" → policy says "12 chars + special" → ✅ covered
   - Control says "account lockout" → policy silent → ❌ gap
6. Output: coverage matrix + suggested language to add for gaps
```

### Tasks
- [ ] Implement policy analysis tool for Claude: `validate_policy(policy_id, framework?, version?)`
- [ ] Scope validation to workspace's adopted version of the specified framework
- [ ] Build requirement extraction prompt: Claude extracts structured requirements from policy text
- [ ] Build requirement-to-control matcher: embed requirements → Vectorize search (scoped to adopted versions) → match
- [ ] Build gap detection: compare extracted requirements vs. versioned control requirements
- [ ] Generate suggested policy language for gaps (Claude generates compliant wording citing specific control IDs + versions)
- [ ] Build validation UI: show policy → matched controls (with version) → coverage → gaps → suggested additions
- [ ] Store validation results as compliance events (event_type=`policy_validated`, immutable record)
- [ ] Support re-validation when workspace adopts a new framework version: "Does our policy still pass under ISO 2025?"
- [ ] Integrate with AI chat: "Does our password policy meet ISO 27001?" triggers validation against adopted version

### Deliverables
- AI-powered policy validation with gap detection
- Suggested language generation for policy gaps

---

## 6.3 Conversation-Driven Access Reviews

### Why
Traditional access reviews = emailing spreadsheets. Modern approach: send structured messages (Slack/email) that managers respond to directly, feeding back into the register.

### Flow
```
1. System triggers access review (scheduled or manual)
2. For each reviewer (manager), compile their scope:
   "You have 12 direct reports with prod access. Review each:"
   - João → prod-db (admin) — granted 6 months ago — [Confirm] [Revoke]
   - Ana → aws-console (read) — granted 2 months ago — [Confirm] [Revoke]
3. Send via Slack DM or email with action buttons/links
4. Reviewer clicks Confirm/Revoke per record
5. Each response creates an audit log entry with timestamp
6. System marks access_review as completed when all records reviewed
```

### Tasks
- [ ] Build review campaign creator: select scope (system/team/all), generate review tasks per reviewer
- [ ] Implement review notification templates (Slack + email)
- [ ] Build review response handler: webhook endpoint for Slack interactions / email link clicks
- [ ] Create unique, time-limited review tokens per reviewer (no auth required to respond)
- [ ] Build review landing page: `/review/:token` — shows records to review with Confirm/Revoke buttons
- [ ] Auto-update access_records: set `reviewed_at` + `reviewed_by` on confirm, trigger revocation flow on revoke
- [ ] Track review completion: `reviewed_count / total_records` with deadline reminders
- [ ] Escalation: if reviewer doesn't respond within X days, notify their manager
- [ ] Build review campaign dashboard: completion rates, outstanding reviews, overdue

### Deliverables
- Automated access review campaigns via Slack/email
- One-click confirm/revoke with audit trail
- Review completion tracking with escalation

---

## 6.4 Risk Scoring Engine

### Why
Not all access records are equal. A stale admin account on the production database with no MFA is 100x riskier than a fresh read-only account on staging. The dashboard should sort by risk, not alphabetically.

### Risk Score Formula
```
risk_score = (
  system_data_sensitivity * 0.3 +    // high=1.0, medium=0.6, low=0.3
  privilege_level * 0.25 +             // admin=1.0, write=0.7, read=0.3
  staleness * 0.2 +                    // days since last review / 365, capped at 1.0
  mfa_factor * 0.15 +                  // no MFA on critical system = 1.0, else 0.0
  approval_completeness * 0.1          // no approver = 1.0, has approver = 0.0
)
```

### Tasks
- [ ] Implement risk scoring function with configurable weights
- [ ] Compute risk score on access record creation and update
- [ ] Batch re-compute: scheduled job to recalculate all scores (staleness changes daily)
- [ ] Add risk score to access register API responses
- [ ] Add risk-based sorting to dashboard and access list UI
- [ ] Build risk trend chart: average risk score over time
- [ ] Allow workspace admins to customize weight factors
- [ ] Flag high-risk records (>0.8) as requiring immediate attention

### Deliverables
- Automatic risk scoring on every access record
- Risk-sorted views across the application

---

## 6.5 MCP Tool Layer

### Why
Expose Complerer as MCP tools so Claude Code, n8n, or any agent can call it. This turns the platform into a compliance operating system that external automation can interact with.

### MCP Tools to Expose
| Tool | Description |
|---|---|
| `register_access_change` | Create an access record (emits compliance event) |
| `get_open_gaps` | List controls with gap status for an adopted framework version |
| `mark_control_evidenced` | Create immutable evidence_link to a versioned control |
| `run_access_review` | Trigger an access review campaign |
| `get_compliance_posture` | Return posture score + top violations (supports `as_of` for historical) |
| `search_controls` | Semantic search scoped to workspace's active adoptions |
| `get_anomalies` | List open anomalies from integrations |
| `validate_policy` | Run policy-to-control validation against adopted version |
| `capture_snapshot` | Create a tamper-evident compliance snapshot |
| `get_compliance_events` | Query the compliance event timeline |

### Tasks
- [ ] Design MCP tool schemas (JSON schema for inputs/outputs)
- [ ] Implement MCP server as a separate CF Worker
- [ ] Authentication: workspace API keys with scoped permissions
- [ ] Rate limiting per API key
- [ ] Create API key management UI in workspace settings
- [ ] Write MCP tool documentation
- [ ] Test with Claude Code: configure MCP server → use tools in conversation
- [ ] Test with n8n: HTTP request node → call MCP tools

### Deliverables
- MCP server with 8 compliance tools
- API key authentication + rate limiting
- Documentation for external integration

---

## 6.6 LLM-Powered Audit Narrator

### Why
Before an audit, generate a narrative document that explains how the organization satisfies each control. Auditors love this — it saves them time and signals maturity.

### Output Format
```markdown
# SOC 2 Type II Compliance Narrative
## Applivery — March 2026

### CC6.1 — Logical Access Security
**Status:** Compliant
**How we satisfy this control:**
Applivery enforces role-based access control across all production systems.
Access is provisioned through Okta with mandatory MFA and requires manager
approval via Jira ticket (baseline: "all prod access requires approval").

**Evidence:**
- [E-001] Okta access report (auto-collected 2026-03-20)
- [E-002] Jira approval workflow export (auto-collected 2026-03-20)
- [E-003] Access review campaign results Q1 2026 (completed 2026-03-15)

**Last reviewed:** 2026-03-15 by Ana Silva
```

### Tasks
- [ ] Build narrative generation pipeline: capture a compliance snapshot first, then generate from snapshot data (ensures narrative matches frozen state)
- [ ] For each control in the snapshot: gather status + evidence_links + overrides + baselines + policy mappings
- [ ] Include evidence provenance: show `link_type` (manual vs auto_crosswalk vs inherited) and `confidence` for each evidence link
- [ ] Include adoption context: "Applivery adopted SOC 2 v2024 on 2024-01-01" — proves the framework version in use
- [ ] Include evidence lineage: if evidence was `inherited_from` a previous version, show the chain
- [ ] Create Claude prompt template: generates auditor-friendly prose per control with full provenance
- [ ] Batch generation: generate all controls in parallel (Claude batch API or concurrent calls)
- [ ] Output as structured Markdown → convert to PDF
- [ ] Include table of contents, executive summary, appendices, snapshot integrity hash
- [ ] Reference the compliance snapshot ID + hash in the report footer (tamper-evident)
- [ ] Allow workspace admin to review + edit generated narrative before finalizing
- [ ] Store generated reports as compliance events (event_type=`audit_report_generated`, immutable)
- [ ] Build report generation UI: select framework version → select snapshot (or capture new) → generate → review → export

### Deliverables
- One-click audit narrative built from tamper-evident snapshots
- Full evidence provenance (manual, crosswalk, inherited, with confidence)
- Adoption timeline included for auditor context
- PDF export with snapshot hash for integrity verification
- Editable before finalization, then frozen as compliance event

---

## 6.7 HR / HRIS Offboarding Integration

### Why
When an employee leaves, all their access must be revoked. HRIS integration triggers automatic offboarding workflows.

### Tasks
- [ ] Build HRIS webhook receiver: employee status changed → trigger offboarding
- [ ] Offboarding workflow: list all active access → flag for revocation → notify system owners → track completion
- [ ] Auto-revoke after grace period if system owner doesn't respond
- [ ] Evidence: capture offboarding completion report, link to access controls
- [ ] Support BambooHR, Workday, Personio via webhook (architecture only, implement top 1 first)

### Deliverables
- Automated offboarding triggered by HRIS
- Complete revocation tracking with evidence

---

## Phase 6 Completion Criteria

- [ ] Cross-framework gap analysis pinned to specific adopted versions
- [ ] Historical gap analysis with `as_of` support
- [ ] Gap trend showing progress/regression over time
- [ ] Policy-to-control validator scoped to adopted versions, with re-validation on version change
- [ ] Conversation-driven access reviews via Slack/email
- [ ] Risk scoring on every access record with configurable weights
- [ ] MCP server with 10 tools + API key auth (including snapshot capture and event queries)
- [ ] Audit narrative built from tamper-evident snapshots with full evidence provenance
- [ ] Audit report references snapshot hash for integrity verification
- [ ] HR offboarding integration (at least 1 HRIS provider)
- [ ] All features workspace-scoped
- [ ] All write operations emit compliance events
- [ ] No feature destroys or modifies historical data
