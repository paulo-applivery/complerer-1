# Phase 7 — Community & Growth Engine

**Timeline:** Week 18-24
**Depends on:** Phase 4 (dashboard, chat), Phase 6 (snapshots, gap analysis, audit narrator)
**Goal:** Build the community-powered flywheel — compliance playbooks, trust score badges, anonymous benchmarking, implementation marketplace, and auditor intelligence network. Each feature creates network effects where every new workspace makes the platform more valuable for everyone.

---

## 7.1 Compliance Playbooks

### Why
Every company solving SOC 2 CC6.1 is doing the same research independently. Playbooks collectivize that knowledge — anonymized evidence blueprints showing exactly what auditors accepted, contributed by workspaces that passed audits.

### Design Principle
```
Workspaces never share actual evidence. They share:
  1. Evidence TYPE (what kind of document/export)
  2. Evidence SOURCE (which tool/integration produced it)
  3. Auditor REACTION (accepted, questioned, required additional)
  4. TIPS (what they wish they knew before the audit)

All contributions are anonymous. No workspace name, no company name, no PII.
```

### Database Tables

#### `playbooks`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `control_id` | TEXT | FK → versioned_controls.id |
| `framework_version_id` | TEXT | FK → framework_versions.id |
| `title` | TEXT | Auto-generated: "Satisfying {control_id} — {control_title}" |
| `summary` | TEXT | AI-generated summary from aggregated contributions |
| `contributor_count` | INTEGER | How many workspaces contributed |
| `avg_audit_pass_rate` | REAL | % of contributors that passed audit for this control |
| `estimated_effort_hours` | REAL | Median from contributors |
| `difficulty_rating` | REAL | 1.0-5.0 average |
| `last_updated_at` | TEXT (ISO 8601) | Last time a contribution was aggregated |
| `created_at` | TEXT (ISO 8601) | |

#### `playbook_evidence_patterns`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `playbook_id` | TEXT | FK → playbooks.id |
| `evidence_type` | TEXT | "User access report", "Approval workflow export", etc. |
| `evidence_source_tool` | TEXT | okta / azure_ad / jira / manual / aws / etc. |
| `usage_percentage` | REAL | % of contributors that used this pattern |
| `auditor_acceptance_rate` | REAL | % of times auditors accepted this |
| `collection_frequency` | TEXT | monthly / quarterly / annually / on_change |
| `automation_available` | BOOLEAN | Can Complerer auto-collect this? |
| `effort_minutes` | INTEGER | Estimated time to collect manually |
| `created_at` | TEXT (ISO 8601) | |

#### `playbook_tips`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `playbook_id` | TEXT | FK → playbooks.id |
| `tip_type` | TEXT | `pro_tip` / `common_pitfall` / `auditor_expectation` / `tool_recommendation` |
| `content` | TEXT | The tip text |
| `source_segment` | TEXT | Anonymized: "SaaS, 50-200 employees" |
| `upvotes` | INTEGER | Community votes |
| `status` | TEXT | pending_review / published / flagged |
| `created_at` | TEXT (ISO 8601) | |

#### `playbook_contributions` (append-only, anonymized)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `playbook_id` | TEXT | FK → playbooks.id |
| `workspace_hash` | TEXT | SHA-256 of workspace_id (anonymous, but prevents duplicates) |
| `evidence_patterns` | TEXT (JSON) | What evidence types they used |
| `tools_used` | TEXT (JSON) | Which tools produced evidence |
| `audit_passed` | BOOLEAN | Did they pass audit for this control? |
| `auditor_firm_hash` | TEXT | Anonymized auditor firm (optional) |
| `effort_hours` | REAL | How long it took |
| `difficulty_rating` | INTEGER | 1-5 |
| `tips` | TEXT (JSON) | Array of tips they want to share |
| `company_segment` | TEXT | industry + size band (anonymized) |
| `contributed_at` | TEXT (ISO 8601) | |

### Contribution Flow
```
1. Workspace passes audit (captures compliance snapshot)
2. System prompts: "Help the community — share what worked for you?"
3. User reviews pre-filled contribution form:
   - Evidence patterns auto-extracted from their evidence_links
   - Tools auto-detected from integration types
   - Effort estimated from compliance_events timestamps
4. User adds tips, rates difficulty, confirms
5. Contribution stored with workspace_hash (anonymous, deduplicated)
6. AI aggregation job runs:
   - Merges new contribution into playbook stats
   - Regenerates playbook summary
   - Recalculates usage percentages, acceptance rates
   - Surfaces new tips for moderation
```

### AI-Seeded Playbooks (Day 1 Value)
Before any community contributions exist, seed playbooks with AI-generated content:
```
For each control in each framework:
  → Claude generates evidence patterns based on framework requirements
  → Claude generates common tools and collection methods
  → Claude generates tips based on publicly known audit practices
  → Mark as "AI-generated" until community contributions replace them
```

### Tasks
- [ ] Create D1 migrations: `0030_create_playbooks.sql`, `0031_create_playbook_evidence_patterns.sql`, `0032_create_playbook_tips.sql`, `0033_create_playbook_contributions.sql`
- [ ] Implement anonymization layer: workspace_id → SHA-256 hash, company details → segment only
- [ ] Build contribution extraction: auto-populate form from workspace's evidence_links + integrations + events
- [ ] Implement contribution API: `POST /api/community/contributions` (anonymous, append-only)
- [ ] Build AI aggregation pipeline: on new contribution → update playbook stats + regenerate summary
- [ ] Implement playbook read API: `GET /api/w/:id/playbooks/:controlId` (returns aggregated playbook)
- [ ] Seed all controls with AI-generated playbooks on platform launch
- [ ] Build contribution prompt: after snapshot capture, offer to contribute
- [ ] Build playbook UI: show evidence patterns with usage %, tips sorted by upvotes, difficulty rating
- [ ] Build playbook integration in chat: "How do I satisfy CC6.1?" → returns playbook data + framework requirements
- [ ] Implement tip voting: upvote/downvote (one vote per workspace per tip)
- [ ] Implement tip moderation queue: flag inappropriate content, admin review
- [ ] Add playbook data to RAG pipeline: embed playbook summaries for richer chat answers
- [ ] Write test: contribute anonymously → verify workspace_id not stored → verify playbook stats updated
- [ ] Write test: same workspace contributes twice → verify deduplication via workspace_hash

### Deliverables
- AI-seeded playbooks for every control (day 1 value)
- Anonymous contribution flow after audit completion
- Aggregated community intelligence with usage percentages
- Playbook data enriches chat and RAG answers

---

## 7.2 Complerer Trust Score (Embeddable Badge)

### Why
Viral growth mechanism. Companies embed a live compliance badge on their website → prospects see it → ask "How do I get one?" → sign up. This is the Stripe verified badge playbook applied to compliance.

### Design Principle
```
The badge shows CONTINUOUS compliance, not a point-in-time certificate.
It reads from the latest compliance snapshot + live materialized views.
Prospects can click through to a public verification page.
The workspace controls exactly what's visible.
```

### Database Tables

#### `trust_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `slug` | TEXT UNIQUE | URL slug: `complerer.com/trust/{slug}` |
| `company_name` | TEXT | Public display name |
| `company_logo_ref` | TEXT | R2 key for logo |
| `enabled` | BOOLEAN | Profile is publicly visible |
| `show_frameworks` | TEXT (JSON) | Which adopted frameworks to display |
| `show_posture_score` | BOOLEAN | Show numeric score? |
| `show_evidence_freshness` | BOOLEAN | |
| `show_last_snapshot` | BOOLEAN | |
| `show_control_count` | BOOLEAN | |
| `custom_message` | TEXT | Optional message ("We take security seriously") |
| `badge_style` | TEXT | minimal / standard / detailed |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `trust_score_history` (append-only)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `score` | REAL | 0-100 |
| `grade` | TEXT | A+ / A / B+ / B / C / D / F |
| `frameworks_active` | INTEGER | Count of active adoptions |
| `controls_satisfied` | INTEGER | |
| `controls_total` | INTEGER | |
| `evidence_freshness` | REAL | % of evidence not expired |
| `open_violations` | INTEGER | |
| `snapshot_ref` | TEXT | FK → compliance_snapshots.id |
| `computed_at` | TEXT (ISO 8601) | |

### Trust Score Formula
```
trust_score = (
  framework_coverage * 0.35 +        // % of adopted controls satisfied
  evidence_freshness * 0.25 +         // % of evidence not expired
  violation_ratio * 0.20 +            // (1 - open_violations/total_baselines)
  review_completeness * 0.10 +        // % of access reviews completed on time
  snapshot_recency * 0.10             // days since last snapshot, capped
)

Grade mapping:
  95-100: A+    85-94: A    75-84: B+
  65-74:  B     55-64: C    below: D/F
```

### Public Verification Page
```
complerer.com/trust/applivery

┌────────────────────────────────────────────────────┐
│  🛡️ Applivery                                     │
│  Trust Score: A+ (97/100)                          │
│  Continuously monitored by Complerer               │
│                                                    │
│  Active Frameworks:                                │
│  ✅ SOC 2 Type II (v2024)      — 100% coverage    │
│  ✅ ISO 27001:2022             — 98% coverage     │
│  ✅ CIS v8.1                   — 89% coverage     │
│                                                    │
│  📊 47 controls satisfied · 0 open gaps            │
│  📁 Evidence freshness: 98% current               │
│  📸 Last audit snapshot: 2026-03-15               │
│  🔄 Last verified: 2 minutes ago                  │
│                                                    │
│  Powered by Complerer — Get your Trust Score →     │
└────────────────────────────────────────────────────┘
```

### Embeddable Badge (JavaScript Widget)
```html
<!-- Minimal badge -->
<script src="https://complerer.com/trust/badge.js"
        data-workspace="applivery"
        data-style="minimal">
</script>

<!-- Renders as: -->
<a href="https://complerer.com/trust/applivery">
  🛡️ Complerer Trust Score: A+ | Continuously Verified
</a>
```

### Tasks
- [ ] Create D1 migrations: `0034_create_trust_profiles.sql`, `0035_create_trust_score_history.sql`
- [ ] Implement trust score computation (runs after every snapshot and on schedule)
- [ ] Store score history (append-only) for trend display
- [ ] Build trust profile management API (workspace admin configures what's visible)
- [ ] Build public verification page: `GET /trust/:slug` — server-rendered, no auth required
- [ ] Build embeddable JavaScript widget: `badge.js` — loads asynchronously, renders badge
- [ ] Build badge styles: minimal (one-line), standard (card), detailed (full breakdown)
- [ ] Implement score recalculation: CF Cron Trigger every 15 minutes
- [ ] Build trust profile UI in workspace settings: enable/disable, configure visibility, preview badge
- [ ] Build embed code generator: copy-paste snippet with style options
- [ ] SEO: public verification pages are indexable (drives organic traffic)
- [ ] Add "Powered by Complerer — Get your Trust Score" CTA on all public pages
- [ ] Write test: trust score computed correctly from posture + evidence + violations
- [ ] Write test: disabled profile returns 404 on public page
- [ ] Write test: score history is append-only, never modified

### Deliverables
- Embeddable trust badge with 3 styles
- Public verification page (SEO-indexed)
- Score recomputed every 15 minutes
- Full control over what's publicly visible
- CTA drives acquisition from badge → signup

---

## 7.3 Anonymous Compliance Benchmarking

### Why
CISOs can't answer "Are we good enough?" without peer comparison. Benchmarks require scale — the more workspaces, the more accurate. This data is impossible to replicate without the platform.

### Design Principle
```
All benchmarking data is aggregated and anonymized.
Minimum 10 workspaces per segment before showing benchmarks.
No individual workspace data is ever exposed.
Workspaces opt-in to benchmarking (default: on, can disable).
```

### Database Tables

#### `benchmark_opt_ins`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `opted_in` | BOOLEAN | |
| `industry` | TEXT | saas / fintech / healthcare / ecommerce / enterprise / government / other |
| `company_size` | TEXT | 1-50 / 50-200 / 200-1000 / 1000+ |
| `region` | TEXT | us / eu / latam / apac / other |
| `maturity` | TEXT | first_audit / second_year / established (3+) |
| `updated_at` | TEXT (ISO 8601) | |

#### `benchmark_snapshots` (periodic aggregation, append-only)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `segment` | TEXT (JSON) | `{ industry, company_size, region, maturity }` |
| `framework_slug` | TEXT | Which framework |
| `workspace_count` | INTEGER | How many workspaces in this segment |
| `metrics` | TEXT (JSON) | See metrics below |
| `computed_at` | TEXT (ISO 8601) | |

### Benchmark Metrics (per segment per framework)
```json
{
  "posture_score": {
    "p10": 42, "p25": 58, "median": 72, "p75": 89, "p90": 95
  },
  "evidence_freshness": {
    "p10": 45, "p25": 62, "median": 78, "p75": 91, "p90": 98
  },
  "time_to_first_audit": {
    "p25_days": 45, "median_days": 90, "p75_days": 150
  },
  "controls_by_status": {
    "compliant_pct": { "median": 72, "p75": 85 },
    "gap_pct": { "median": 15, "p75": 8 }
  },
  "top_gap_controls": [
    { "control_id": "CC3.1", "gap_pct": 45 },
    { "control_id": "CC7.2", "gap_pct": 38 }
  ],
  "most_used_tools": [
    { "tool": "okta", "pct": 67 },
    { "tool": "jira", "pct": 58 }
  ]
}
```

### Benchmark Report in Dashboard
```
📊 Your SOC 2 Posture vs. SaaS Companies (50-200 employees)

Your score: 78% ───────────────●────────
                 p25: 58%    median: 72%    p75: 89%

You're in the top 35% for your segment.

🟢 Where you lead:
  • Access Controls (CC6): 92% — top 15%
  • Change Management (CC8): 88% — top 20%

🔴 Where you lag:
  • Risk Assessment (CC3): 45% — bottom 40%  [View playbook →]
  • Monitoring (CC7): 52% — bottom 35%       [View playbook →]

📈 Trend: +12% in 90 days (industry avg: +3%)
```

### Tasks
- [ ] Create D1 migrations: `0036_create_benchmark_opt_ins.sql`, `0037_create_benchmark_snapshots.sql`
- [ ] Build opt-in flow: workspace settings → industry, size, region, maturity selection
- [ ] Implement benchmark aggregation job: CF Cron Trigger (daily), compute percentiles per segment
- [ ] Enforce minimum 10 workspaces per segment before showing benchmarks (privacy threshold)
- [ ] Build benchmark API: `GET /api/w/:id/benchmarks` → returns workspace position vs. segment
- [ ] Build per-control benchmarks: "45% of workspaces in your segment have a gap on CC3.1"
- [ ] Link gap benchmarks to playbooks: "You're behind on CC3.1 — here's how others solved it"
- [ ] Build benchmark dashboard widget: percentile chart with workspace's position
- [ ] Build benchmark trends: track workspace's position in segment over time
- [ ] Integrate with chat: "How do we compare on access controls?" → benchmark data + recommendations
- [ ] Write test: workspace opts out → excluded from aggregation
- [ ] Write test: segment with <10 workspaces → benchmarks not shown
- [ ] Write test: no individual workspace data exposed in benchmark response

### Deliverables
- Anonymous, aggregated benchmarking by industry/size/region/maturity
- Per-control gap benchmarks linked to playbooks
- Workspace position tracking over time
- Privacy-safe (minimum 10 per segment, no individual data)

---

## 7.4 Control Implementation Marketplace

### Why
Playbooks tell you WHAT to do. The marketplace gives you HOW — one-click installable packages of baseline rules, integration configs, policy templates, and evidence automation, all pre-mapped to controls.

### Database Tables

#### `marketplace_packages`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `slug` | TEXT UNIQUE | URL identifier |
| `title` | TEXT | "Okta + Jira Access Provisioning Workflow" |
| `description` | TEXT | |
| `author_hash` | TEXT | Anonymous author identifier |
| `author_segment` | TEXT | "SaaS, 50-200 employees" |
| `category` | TEXT | access_control / monitoring / change_mgmt / data_protection / incident / risk |
| `controls_satisfied` | TEXT (JSON) | Array of versioned_control IDs this satisfies |
| `frameworks_applicable` | TEXT (JSON) | Which frameworks this helps with |
| `tools_required` | TEXT (JSON) | ["okta", "jira"] |
| `install_count` | INTEGER | |
| `rating_avg` | REAL | 1.0-5.0 |
| `rating_count` | INTEGER | |
| `status` | TEXT | draft / published / featured / deprecated |
| `verified` | BOOLEAN | Reviewed by Complerer team |
| `created_at` | TEXT (ISO 8601) | |
| `updated_at` | TEXT (ISO 8601) | |

#### `marketplace_package_contents`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `package_id` | TEXT | FK → marketplace_packages.id |
| `content_type` | TEXT | `baseline_rule` / `policy_template` / `integration_config` / `evidence_schedule` / `review_template` |
| `content_data` | TEXT (JSON) | The actual installable content |
| `description` | TEXT | What this piece does |
| `order` | INTEGER | Installation order |

#### `marketplace_installs`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_id` | TEXT | FK → workspaces.id |
| `package_id` | TEXT | FK → marketplace_packages.id |
| `installed_by` | TEXT | FK → auth_users.id |
| `installed_at` | TEXT (ISO 8601) | |
| `status` | TEXT | active / uninstalled |
| `items_created` | TEXT (JSON) | IDs of baselines, policies, configs created by install |

#### `marketplace_reviews`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `package_id` | TEXT | FK → marketplace_packages.id |
| `workspace_hash` | TEXT | Anonymous reviewer |
| `rating` | INTEGER | 1-5 |
| `review_text` | TEXT | |
| `audit_passed_with` | BOOLEAN | Did they pass audit using this package? |
| `created_at` | TEXT (ISO 8601) | |

### Package Content Examples

**Baseline rule:**
```json
{
  "content_type": "baseline_rule",
  "content_data": {
    "name": "Prod access requires Jira approval",
    "category": "access",
    "rule_type": "boolean",
    "severity": "critical",
    "rule_config": {
      "field": "ticket_ref",
      "condition": "is_not_null",
      "scope": { "system_classification": "critical" }
    }
  }
}
```

**Policy template:**
```json
{
  "content_type": "policy_template",
  "content_data": {
    "title": "Access Control Policy",
    "category": "access",
    "content_markdown": "## 1. Purpose\nThis policy defines...",
    "control_mappings": ["CC6.1", "CC6.2", "A.8.3", "A.8.5"],
    "review_cycle_days": 365
  }
}
```

**Evidence collection schedule:**
```json
{
  "content_type": "evidence_schedule",
  "content_data": {
    "title": "Monthly Okta Access Report",
    "integration_type": "okta",
    "frequency": "monthly",
    "evidence_type": "User access report export",
    "auto_link_controls": ["CC6.1", "CC6.3"],
    "description": "Automatically exports Okta user/app assignments monthly"
  }
}
```

### Installation Flow
```
1. User browses marketplace → finds "Okta + Jira Access Provisioning"
2. Preview: see what will be created (3 baselines, 1 policy, 2 evidence schedules)
3. Compatibility check: workspace has Okta integration? ✅ Has Jira? ✅
4. User clicks "Install" → confirm dialog shows exact items
5. System creates:
   - 3 baseline rules in workspace
   - 1 policy template imported to Policy Vault
   - 2 evidence collection schedules configured
   - All items linked to relevant adopted controls
6. Emit compliance events for each created item
7. Track install in marketplace_installs
```

### Contribution Flow
```
1. Workspace admin goes to "Contribute to Marketplace"
2. System auto-detects: "You have 5 baselines, 3 policies, 2 evidence schedules
   that satisfy CC6.1-CC6.3. Want to share them as a package?"
3. Admin reviews, edits descriptions, removes sensitive content
4. Package submitted for review (anonymized automatically)
5. Complerer team verifies → published
6. Author gets "Contributor" badge (reputation system)
```

### Tasks
- [ ] Create D1 migrations: `0038_create_marketplace_packages.sql`, `0039_create_package_contents.sql`, `0040_create_marketplace_installs.sql`, `0041_create_marketplace_reviews.sql`
- [ ] Build package listing API: search, filter by category/framework/tools, sort by rating/installs
- [ ] Build package detail API: contents preview, compatibility check against workspace
- [ ] Build installation engine: parse package contents → create items in workspace → link to controls
- [ ] Build uninstall: remove items created by install (tracked in `items_created`)
- [ ] Build contribution flow: auto-detect shareable items → anonymize → package → submit
- [ ] Build review/rating API (one per workspace per package, anonymous)
- [ ] Build marketplace browse UI: grid/list view, filters, search
- [ ] Build package detail page: description, contents preview, reviews, install button
- [ ] Build "My Installed Packages" page in workspace settings
- [ ] Build contribution wizard UI
- [ ] AI-generate starter packages for common stacks (Okta+Jira, AWS+GitHub, Google WS+Linear)
- [ ] Implement "verified" badge for Complerer-reviewed packages
- [ ] Compatibility engine: warn if workspace lacks required integrations
- [ ] Emit compliance events for all marketplace actions
- [ ] Write test: install package → verify items created → verify control mappings
- [ ] Write test: uninstall → verify items removed → compliance event emitted

### Deliverables
- Browsable marketplace with search and filters
- One-click install/uninstall of compliance packages
- Community contribution flow with anonymization
- AI-seeded starter packages for common stacks
- Rating and review system

---

## 7.5 Auditor Intelligence Network

### Why
Every auditor interprets controls differently. What Deloitte expects is different from what EY expects. This knowledge is tribal — locked in consultants' heads. Crowdsourcing it levels the playing field.

### Design Principle
```
Auditor firms are identified only by anonymized hash.
Workspaces report AFTER their audit (not before/during).
Reports are aggregated — individual experiences are never shown alone.
Minimum 5 reports per auditor firm before showing profile.
Complerer team moderates for accuracy and professionalism.
```

### Database Tables

#### `auditor_firms`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `name_hash` | TEXT | SHA-256 of normalized firm name |
| `display_name` | TEXT | Public name (only shown after 5+ reports) |
| `report_count` | INTEGER | |
| `avg_difficulty` | REAL | 1-10 |
| `created_at` | TEXT (ISO 8601) | |

#### `audit_reports` (append-only, anonymized)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_hash` | TEXT | Anonymous workspace identifier |
| `auditor_firm_id` | TEXT | FK → auditor_firms.id |
| `framework_slug` | TEXT | Which framework was audited |
| `audit_type` | TEXT | type_1 / type_2 / recertification / surveillance |
| `company_segment` | TEXT | industry + size band |
| `audit_year` | INTEGER | |
| `overall_difficulty` | INTEGER | 1-10 |
| `duration_weeks` | INTEGER | |
| `findings_count` | INTEGER | Number of observations/findings |
| `passed` | BOOLEAN | |
| `controls_scrutinized` | TEXT (JSON) | Which controls got extra attention |
| `extra_evidence_requested` | TEXT (JSON) | Evidence beyond standard requirements |
| `tips` | TEXT (JSON) | Array of tips |
| `common_questions` | TEXT (JSON) | Questions the auditor asked |
| `created_at` | TEXT (ISO 8601) | |

#### `auditor_control_insights` (aggregated per auditor per control)
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `auditor_firm_id` | TEXT | FK → auditor_firms.id |
| `control_id` | TEXT | FK → versioned_controls.id |
| `scrutiny_rate` | REAL | % of audits where this control got extra scrutiny |
| `extra_evidence_patterns` | TEXT (JSON) | What extra evidence was commonly requested |
| `common_questions` | TEXT (JSON) | Aggregated questions asked about this control |
| `report_count` | INTEGER | |
| `last_updated_at` | TEXT (ISO 8601) | |

### Auditor Profile View
```
🔍 Auditor Profile: [Firm A]

   Based on 23 anonymous workspace reports (2024-2026)

   Overall difficulty: ███████░░░ 7/10
   Avg audit duration: 4-6 weeks
   Avg findings (first audit): 3-5
   Pass rate on first attempt: 87%

   Controls they scrutinize most:
   1. CC6.1 (Access Controls) — extra scrutiny in 91% of audits
      Common extra requests:
      • Quarterly access reviews (not just annual)
      • PAM evidence for admin accounts

   2. CC7.2 (Monitoring) — extra scrutiny in 78% of audits
      Common extra requests:
      • Real-time alerting evidence, not just log review
      • Specific incident examples with response timeline

   Common questions they ask:
   • "Walk me through your access provisioning workflow"
   • "Show me a recent access revocation for a terminated employee"
   • "How do you ensure separation of duties for deployments?"

   💡 Community tips:
   • "Prepare a control narrative document before audit — they praised it" (↑42)
   • "They accept screenshots but prefer automated exports" (↑38)
   • "First audit: schedule a pre-audit call to align expectations" (↑31)
```

### Report Submission Flow
```
1. After audit completion (detected via snapshot or manual trigger)
2. System prompts: "How did your audit go? Help others prepare."
3. User fills:
   - Auditor firm name (hashed immediately)
   - Framework audited
   - Difficulty, duration, findings count, pass/fail
   - Which controls got extra scrutiny (pre-populated from their framework)
   - Any extra evidence requested (pre-populated options from evidence patterns)
   - Tips and advice
4. Submission anonymized and stored
5. Aggregation job updates auditor profiles + control insights
```

### Tasks
- [ ] Create D1 migrations: `0042_create_auditor_firms.sql`, `0043_create_audit_reports.sql`, `0044_create_auditor_control_insights.sql`
- [ ] Implement firm name normalization + hashing (handle "Deloitte", "Deloitte & Touche", "Deloitte LLP" → same hash)
- [ ] Build report submission API (anonymized, append-only)
- [ ] Build aggregation pipeline: on new report → update auditor profile + control insights
- [ ] Enforce minimum 5 reports before showing auditor profile
- [ ] Build moderation queue for tips and content
- [ ] Build auditor profile page: difficulty, common scrutiny areas, tips
- [ ] Build per-control auditor insights: "For CC6.1, Firm A asks for X" integrated into playbooks
- [ ] Integrate with chat: "What should I expect from my Deloitte SOC 2 audit?" → auditor profile + tips
- [ ] Integrate with audit narrator: include auditor-specific recommendations in narrative
- [ ] Build report submission UI (post-audit prompt)
- [ ] Write test: firm name variations normalize to same hash
- [ ] Write test: <5 reports → profile not visible
- [ ] Write test: no individual workspace data exposed

### Deliverables
- Anonymized auditor profiles with difficulty ratings and scrutiny patterns
- Per-control auditor insights integrated into playbooks
- Post-audit report submission flow
- Chat integration for audit preparation

---

## 7.6 Reputation & Gamification

### Why
Contributions need incentives. A reputation system rewards the workspaces and individuals that make the community valuable, driving sustained engagement.

### Reputation Mechanisms

#### Workspace Badges
| Badge | Criteria | Benefit |
|---|---|---|
| **Contributor** | Shared 1+ playbook contributions | Shown on trust profile |
| **Builder** | Published 1+ marketplace package | Shown on trust profile + package listings |
| **Mentor** | 5+ tips with 10+ upvotes | "Recommended by Mentors" label on tips |
| **Audit Veteran** | 3+ audit reports submitted | Access to premium auditor insights |
| **Community Champion** | 10+ contributions across all types | Featured workspace (optional, opt-in) |

#### Individual Contributor Points
| Action | Points |
|---|---|
| Submit playbook contribution | 10 |
| Submit audit report | 15 |
| Publish marketplace package | 25 |
| Tip gets 10+ upvotes | 5 |
| Package gets 5+ installs | 10 |
| Package gets 4.5+ rating | 15 |

### Tasks
- [ ] Create D1 migrations: `0045_create_workspace_badges.sql`, `0046_create_contributor_points.sql`
- [ ] Implement badge award engine: check criteria after each contribution
- [ ] Build badge display on trust profile (opt-in)
- [ ] Build contributor leaderboard (anonymous, by segment)
- [ ] Build points tracking and level system
- [ ] Show badges in workspace settings: "Your community reputation"

### Deliverables
- Badge system that rewards community contributions
- Visible on trust profiles (optional)
- Leaderboard for competitive motivation

---

## 7.7 Community-Powered Crosswalk Proposals

### Why
The crosswalk is the platform's moat, but maintaining 200+ mappings across framework versions is hard. Let the community propose new mappings and corrections.

### Flow
```
1. User notices: "Our evidence for CIS 5.4 should also satisfy ISO A.8.5,
   but the crosswalk doesn't link them"
2. User submits crosswalk proposal:
   Source: CIS v8.1 → 5.4
   Target: ISO 27001:2022 → A.8.5
   Type: equivalent / partial / related
   Confidence: 0.8
   Rationale: "Both require role-based access provisioning..."
3. Proposal enters review queue
4. AI pre-validates: compares requirement texts, checks for semantic similarity
5. Complerer team reviews → approves → new crosswalk mapping published
6. All workspaces benefit immediately
```

### Database Tables

#### `crosswalk_proposals`
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (ULID) | Primary key |
| `workspace_hash` | TEXT | Anonymous proposer |
| `source_control_id` | TEXT | FK → versioned_controls.id |
| `target_control_id` | TEXT | FK → versioned_controls.id |
| `mapping_type` | TEXT | equivalent / partial / related |
| `confidence` | REAL | Proposed confidence |
| `rationale` | TEXT | Why this mapping makes sense |
| `ai_validation_score` | REAL | AI-computed semantic similarity |
| `status` | TEXT | pending / approved / rejected |
| `reviewed_by` | TEXT | Complerer admin |
| `reviewed_at` | TEXT (ISO 8601) | |
| `created_at` | TEXT (ISO 8601) | |

### Tasks
- [ ] Create D1 migration: `0047_create_crosswalk_proposals.sql`
- [ ] Build proposal submission API
- [ ] AI pre-validation: embed both controls → compute similarity → auto-approve if >0.9 similarity + equivalent type
- [ ] Build admin review queue UI
- [ ] On approval: insert into `control_crosswalks` (immutable) + re-embed affected controls
- [ ] Notify workspaces that use either control: "New crosswalk mapping available"
- [ ] Award contributor points for approved proposals
- [ ] Build proposal submission UI: select two controls, pick mapping type, write rationale
- [ ] Write test: proposal approved → crosswalk created → evidence auto-links update

### Deliverables
- Community-driven crosswalk improvement with AI validation
- Admin review queue for quality control
- Approved mappings benefit all workspaces immediately

---

## Phase 7 Completion Criteria

- [ ] Playbooks: AI-seeded for every control, community contributions flowing, aggregated stats
- [ ] Trust Score: embeddable badge with 3 styles, public verification page, recomputed every 15 min
- [ ] Benchmarking: anonymous, per-segment, minimum 10 workspace threshold, linked to playbooks
- [ ] Marketplace: browsable packages, one-click install/uninstall, contribution flow, ratings
- [ ] Auditor Intel: anonymized profiles with scrutiny patterns, minimum 5 report threshold
- [ ] Reputation: badges, points, leaderboard driving sustained contributions
- [ ] Crosswalk Proposals: community-submitted, AI-validated, admin-approved
- [ ] Privacy: all contributions anonymized, no individual workspace data exposed
- [ ] Growth loop: badge → acquisition → usage → contribution → better content → more badges
- [ ] All community data emits compliance events where applicable
