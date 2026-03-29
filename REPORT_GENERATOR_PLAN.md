# Report Generator — Implementation Plan

## Overview

Certification-grade audit report system for SOC 2 Type II, ISO 27001, GDPR DPIAs, ENS, and custom frameworks. Combines a TipTap rich editor with dynamic data blocks, AI-assisted drafting, configurable templates, sign-off workflows, and PDF export via Cloudflare Browser Rendering.

---

## Phase 1: Editor Foundation

### Goal
Set up TipTap editor with rich text editing, slash command menu, and the first custom blocks. This is the core UI that everything else builds on.

### Implementation

#### 1.1 TipTap Setup
- Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`
- Create `ReportEditor` component wrapping `useEditor` hook
- Configure base extensions: `StarterKit` (bold, italic, headings, lists, code, blockquote), `Placeholder`, `Typography`, `TextAlign`, `Underline`, `Link`, `Table`, `TableRow`, `TableCell`, `TableHeader`, `Image`, `TaskList`, `TaskItem`
- Editor stores content as TipTap JSON AST (ProseMirror-compatible)
- Toolbar with formatting controls (bold, italic, headings, alignment, lists, table insert)

#### 1.2 Slash Menu
- Install `@tiptap/suggestion` extension
- Create `SlashMenu` component: renders a floating dropdown when user types `/`
- Menu items grouped by category:
  - **Text**: Heading 1/2/3, Bullet List, Numbered List, Quote, Divider, Callout
  - **Data Blocks**: Evidence Table, Control Matrix, Finding Card, Risk Heatmap, Chart
  - **References**: Policy Reference, Evidence Gallery, Variable Placeholder
  - **AI**: Draft Section, Summarize, Generate Recommendation
- Filter items as user types after `/`
- Keyboard navigation (arrow keys + enter to select)

#### 1.3 Custom Block: Variable Placeholder
- TipTap `Node.create({ name: 'variablePlaceholder', group: 'inline', inline: true, atom: true })`
- Attributes: `variableKey`, `variableType`, `displayMode` (placeholder | resolved)
- In **template mode**: renders as a styled chip/tag showing variable name (e.g., `{{Organization Name}}`)
- In **report mode**: resolves to actual value from report data
- Variable types: `text`, `date`, `number`, `user`, `list`, `evidence_table`, `control_matrix`
- Inserted via slash menu → opens a variable picker dropdown

#### 1.4 Custom Block: Evidence Table
- TipTap `Node.create({ name: 'evidenceTable', group: 'block', atom: true })`
- Attributes: `controlIds[]`, `frameworkId`, `columns[]`, `filterStatus`, `maxRows`
- React component (`EvidenceTableNodeView`) fetches evidence from API based on attributes
- Renders a styled table: Evidence name, Type, Status badge, Collected date, Source, Linked controls
- Configuration panel (click to open): select controls, choose columns, set filters
- Empty state when no evidence matches

#### 1.5 Custom Block: Finding Card
- TipTap `Node.create({ name: 'findingCard', group: 'block', atom: true })`
- Attributes: `findingId` (links to report_findings) or inline data
- Renders structured card: Severity badge, Title, Condition, Criteria, Cause, Effect, Recommendation
- Two modes: **linked** (pulls from report_findings table) or **inline** (data stored in node attributes)
- Click to edit finding details in a side panel

### UI Connection
- **Route**: `/workspaces/:workspaceId/reports/:reportId/edit`
- **Layout**: Full-width editor with left sidebar (sections outline) and right sidebar (properties/configuration)
- **Components**:
  - `ReportEditorPage` — page wrapper, loads report data
  - `ReportEditor` — TipTap editor instance
  - `EditorToolbar` — formatting toolbar (top)
  - `SlashMenu` — floating command palette
  - `SectionOutline` — left sidebar, clickable section navigation
  - `BlockConfigPanel` — right sidebar, shows config when a custom block is selected
  - `VariablePicker` — dropdown for inserting variables
  - `EvidenceTableNodeView` — renders evidence table block
  - `FindingCardNodeView` — renders finding card block

---

## Phase 2: Template System

### Goal
Let users create, manage, and configure report templates per framework. Templates define the document structure with placeholder sections and variables.

### Implementation

#### 2.1 Database: `report_templates` table
```sql
CREATE TABLE report_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  framework_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,           -- TipTap JSON AST with placeholders
  variables TEXT NOT NULL DEFAULT '[]',
  sections TEXT NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT 0,
  is_library BOOLEAN DEFAULT 0,   -- admin-seeded template
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (framework_id) REFERENCES frameworks(id)
);
```

#### 2.2 API Endpoints
- `GET /api/workspaces/:id/report-templates` — list templates (filter by framework)
- `POST /api/workspaces/:id/report-templates` — create template
- `GET /api/workspaces/:id/report-templates/:templateId` — get template with content
- `PUT /api/workspaces/:id/report-templates/:templateId` — update template
- `DELETE /api/workspaces/:id/report-templates/:templateId` — delete template
- `POST /api/workspaces/:id/report-templates/:templateId/duplicate` — clone template

#### 2.3 Variable Definition System
- Each template defines its variables in the `variables` JSON column:
```json
[
  { "key": "org.name", "type": "text", "label": "Organization Name", "required": true },
  { "key": "audit.period_start", "type": "date", "label": "Audit Period Start", "required": true },
  { "key": "audit.period_end", "type": "date", "label": "Audit Period End", "required": true },
  { "key": "audit.scope", "type": "text", "label": "Audit Scope Description", "required": true },
  { "key": "controls.summary", "type": "control_matrix", "label": "Control Testing Summary", "dataSource": { "entity": "controls", "query": { "frameworkId": "$framework" } } },
  { "key": "evidence.list", "type": "evidence_table", "label": "Evidence Index", "dataSource": { "entity": "evidence", "query": { "projectId": "$project" } } }
]
```
- Variables with `dataSource` are auto-resolved from platform data
- Variables without `dataSource` are manually filled by the user

#### 2.4 Section Configuration
- Each template defines ordered sections:
```json
[
  { "id": "exec-summary", "title": "Executive Summary", "required": true, "aiPrompt": "Write a concise executive summary...", "variables": ["org.name", "audit.period_start"] },
  { "id": "scope", "title": "Scope and Methodology", "required": true },
  { "id": "system-desc", "title": "System Description", "required": true },
  { "id": "control-testing", "title": "Control Testing Results", "required": true, "variables": ["controls.summary"] },
  { "id": "findings", "title": "Findings and Exceptions", "required": false },
  { "id": "recommendations", "title": "Recommendations", "required": false },
  { "id": "appendix", "title": "Appendices", "required": false }
]
```

#### 2.5 Pre-built Templates (Seeded)
- **SOC 2 Type II**: Opinion letter, Management assertion, System description, TSC control matrix, Findings, CUECs
- **ISO 27001**: ISMS scope, Clause 4-10 assessment, Annex A controls, Nonconformities, Certification recommendation
- **GDPR DPIA**: Processing description, Necessity assessment, Risk assessment, Mitigations, DPO consultation
- **ENS**: Category assessment, Security measures, Gap analysis, Compliance level
- **Risk Assessment**: Asset inventory, Threat analysis, Risk scoring, Treatment plan
- **Gap Analysis**: Framework baseline, Current state, Gaps, Remediation roadmap

### UI Connection
- **Route**: `/workspaces/:workspaceId/report-templates`
- **Route**: `/workspaces/:workspaceId/report-templates/:templateId/edit`
- **Components**:
  - `TemplateListPage` — grid/list of templates, filter by framework, create new
  - `TemplateEditorPage` — same TipTap editor but in "template mode" (placeholders shown as chips)
  - `TemplateSettingsPanel` — right sidebar: name, description, framework, variables config
  - `VariableDefinitionEditor` — form for defining template variables
  - `SectionManager` — drag-and-drop section ordering, required/optional toggle, AI prompt config
  - `TemplatePreview` — preview with sample data resolved

---

## Phase 3: Report Generation & Management

### Goal
Create reports from templates, resolve variables from compliance project data, manage report lifecycle (draft → review → approved → published).

### Implementation

#### 3.1 Database: `reports` table
```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  project_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content TEXT NOT NULL,
  resolved_variables TEXT DEFAULT '{}',
  audit_period_start TEXT,
  audit_period_end TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  locked_at TEXT,
  locked_by TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (template_id) REFERENCES report_templates(id),
  FOREIGN KEY (project_id) REFERENCES compliance_projects(id)
);
```

#### 3.2 Database: `report_versions` table
```sql
CREATE TABLE report_versions (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  change_type TEXT NOT NULL,
  change_description TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);
```

#### 3.3 API Endpoints
- `GET /api/workspaces/:id/reports` — list reports (filter by status, project, framework)
- `POST /api/workspaces/:id/reports` — create report from template (resolves variables, snapshots content)
- `GET /api/workspaces/:id/reports/:reportId` — get report with content
- `PUT /api/workspaces/:id/reports/:reportId` — update report content (auto-saves, creates version)
- `PATCH /api/workspaces/:id/reports/:reportId/status` — transition status (draft→review→approved→published)
- `GET /api/workspaces/:id/reports/:reportId/versions` — list version history
- `GET /api/workspaces/:id/reports/:reportId/versions/:version` — get specific version
- `POST /api/workspaces/:id/reports/:reportId/revert/:version` — revert to version

#### 3.4 Variable Resolution Engine
- When creating a report from a template:
  1. Copy template content as report content
  2. For each variable with `dataSource`, fetch current data from DB (controls, evidence, policies, risks)
  3. Store resolved values in `resolved_variables` JSON column
  4. Variable placeholder nodes in the AST reference keys in `resolved_variables`
  5. Manual variables left as placeholders for user to fill

#### 3.5 Auto-save
- Debounced save (2s after last edit)
- Each save creates a version entry in `report_versions`
- Versions are compacted: keep every save for last hour, then one per hour for last day, then one per day

### UI Connection
- **Route**: `/workspaces/:workspaceId/reports` — report dashboard
- **Route**: `/workspaces/:workspaceId/reports/new` — create report (select template + project)
- **Route**: `/workspaces/:workspaceId/reports/:reportId` — report detail / read view
- **Route**: `/workspaces/:workspaceId/reports/:reportId/edit` — editor (Phase 1 editor loaded with report data)
- **Components**:
  - `ReportDashboard` — list/grid view, status filters, search, create button
  - `ReportCard` — preview card: name, framework, status badge, last edited, progress
  - `CreateReportModal` — step wizard: 1) Select template 2) Link project 3) Set audit period 4) Fill manual variables 5) Generate
  - `ReportStatusBar` — top bar showing status, version, last saved, status transition buttons
  - `VersionHistoryPanel` — side panel showing version timeline with diffs
  - `VariableResolutionPanel` — shows which variables are resolved vs. pending

---

## Phase 4: AI-Assisted Drafting

### Goal
Integrate AI to help auditors draft report sections, generate finding narratives, create executive summaries, and identify gaps — all with streaming into the editor.

### Implementation

#### 4.1 API Endpoints
- `POST /api/workspaces/:id/reports/:reportId/ai/draft-section` — stream AI content for a section (SSE)
- `POST /api/workspaces/:id/reports/:reportId/ai/executive-summary` — generate executive summary
- `POST /api/workspaces/:id/reports/:reportId/ai/finding-narrative` — generate finding description from structured data
- `POST /api/workspaces/:id/reports/:reportId/ai/gap-analysis` — identify evidence gaps
- `POST /api/workspaces/:id/reports/:reportId/ai/recommendation` — generate remediation recommendations

#### 4.2 Context Assembly
- For each AI request, the API assembles relevant context:
  - **Section scope**: which controls, criteria, and evidence are relevant to this section
  - **Framework context**: the specific framework requirements (e.g., TSC criteria for SOC 2)
  - **Evidence data**: summaries of linked evidence, collection dates, statuses
  - **Finding data**: existing findings with severity, status
  - **Organization context**: workspace settings, industry, size
  - **Template AI prompt**: the section's configured `aiPrompt` from the template

#### 4.3 Streaming into Editor
- Backend returns SSE stream of markdown tokens
- Frontend converts markdown to TipTap JSON on-the-fly using `editor.commands.insertContent()`
- User sees content appearing with typewriter effect
- User can stop generation at any point
- Generated content is fully editable after insertion

#### 4.4 AI Use Cases
| Action | Trigger | Context Sent | Output |
|---|---|---|---|
| Draft section | Slash menu `/ai-draft` or section button | Section template prompt + linked controls + evidence | Streaming rich text |
| Executive summary | Button in exec summary section | All findings, pass rates, risk scores | Streaming rich text |
| Finding narrative | Button on finding card | Structured finding data (condition/criteria/cause/effect) | Professional audit language |
| Gap analysis | Button or slash `/ai-gaps` | Controls in scope + linked evidence | Table of gaps with recommendations |
| Recommendations | Per-finding or bulk | Finding details + control context | Specific action items |
| Evidence sufficiency | Pre-export check | All controls + linked evidence | Warning list of insufficient evidence |

### UI Connection
- **Components**:
  - `AIDraftButton` — in section header, triggers streaming draft
  - `AIStreamingOverlay` — shows generation progress, stop button
  - `AIGenerationIndicator` — subtle indicator while content streams in
  - `AISuggestionsPanel` — right sidebar showing AI suggestions (gaps, recommendations)
  - `FindingNarrativeGenerator` — in finding card, button to generate professional narrative
- **Slash menu additions**: `/ai-draft`, `/ai-summarize`, `/ai-recommend`, `/ai-gaps`
- **Version tracking**: AI-generated content creates a version with `change_type: 'ai_draft'` and stores the prompt in metadata

---

## Phase 5: PDF Export

### Goal
Generate high-quality, audit-ready PDF documents from report content using Cloudflare Browser Rendering (Puppeteer).

### Implementation

#### 5.1 Cloudflare Browser Rendering Setup
- Add browser binding to `wrangler.toml`:
```toml
[browser]
binding = "BROWSER"
```
- Add `nodejs_compat` to compatibility flags

#### 5.2 HTML Renderer
- Server-side function that converts TipTap JSON AST → HTML
- Custom block renderers for each node type:
  - `evidenceTable` → static HTML table with styled rows
  - `findingCard` → structured HTML card
  - `controlMatrix` → HTML table with pass/fail badges
  - `riskHeatmap` → SVG grid
  - `chart` → SVG chart (pre-rendered)
  - `variablePlaceholder` → resolved text value
- CSS stylesheet for print: page breaks, headers/footers, page numbers, margins

#### 5.3 PDF Generation Pipeline
1. Frontend requests PDF export
2. API fetches report content + resolved variables
3. Render TipTap JSON → full HTML document with print CSS
4. Pass HTML to Puppeteer via Browser Rendering binding
5. `page.pdf()` with options: A4, margins, header/footer template, page numbers
6. Store PDF in R2, record in `report_exports` table
7. Return signed R2 URL for download

#### 5.4 Database: `report_exports` table
```sql
CREATE TABLE report_exports (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf',
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  generated_at TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  content_hash TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);
```

#### 5.5 API Endpoints
- `POST /api/workspaces/:id/reports/:reportId/export/pdf` — generate PDF
- `GET /api/workspaces/:id/reports/:reportId/exports` — list exports
- `GET /api/workspaces/:id/reports/:reportId/exports/:exportId/download` — download PDF (signed R2 URL)

#### 5.6 PDF Features
- **Cover page**: Report title, framework, organization, audit period, classification
- **Table of contents**: Auto-generated from section headings
- **Headers/footers**: Organization name, report title, page X of Y, classification label
- **Page breaks**: Before each major section
- **Custom fonts**: Professional serif/sans-serif (loaded via CSS)
- **Watermarks**: "DRAFT" watermark on non-published reports

### UI Connection
- **Components**:
  - `ExportPDFButton` — in report toolbar, triggers generation
  - `PDFPreviewModal` — shows generated PDF in iframe before download
  - `ExportHistoryPanel` — list of past exports with download links
  - `PDFSettingsModal` — configure: paper size, margins, include/exclude sections, watermark
- **Route**: No new route — export actions live on the report detail/edit page

---

## Phase 6: Findings Management

### Goal
Structured audit findings with full lifecycle management — from identification through remediation and validation.

### Implementation

#### 6.1 Database: `report_findings` table
```sql
CREATE TABLE report_findings (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  control_id TEXT,
  section_id TEXT,
  severity TEXT NOT NULL,
  finding_type TEXT NOT NULL,
  title TEXT NOT NULL,
  condition TEXT,
  criteria TEXT,
  cause TEXT,
  effect TEXT,
  recommendation TEXT,
  management_response TEXT,
  management_response_by TEXT,
  management_response_at TEXT,
  remediation_due_date TEXT,
  remediation_owner TEXT,
  status TEXT DEFAULT 'open',
  is_repeat BOOLEAN DEFAULT 0,
  prior_finding_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (control_id) REFERENCES versioned_controls(id)
);
```

#### 6.2 API Endpoints
- `GET /api/workspaces/:id/reports/:reportId/findings` — list findings
- `POST /api/workspaces/:id/reports/:reportId/findings` — create finding
- `PUT /api/workspaces/:id/reports/:reportId/findings/:findingId` — update finding
- `DELETE /api/workspaces/:id/reports/:reportId/findings/:findingId` — delete finding
- `PATCH /api/workspaces/:id/reports/:reportId/findings/:findingId/status` — transition status
- `POST /api/workspaces/:id/reports/:reportId/findings/:findingId/response` — add management response

#### 6.3 Finding Lifecycle
```
Open → Acknowledged → Remediation Planned → Remediated → Validated → Closed
  │                                                            │
  └────────────────── Reopened ←──────────────────────────────┘
```

#### 6.4 Finding Types (per framework)
- **SOC 2**: Deficiency, Significant Deficiency, Material Weakness
- **ISO 27001**: Major Nonconformity, Minor Nonconformity, Observation, Opportunity for Improvement
- **Generic**: Critical, High, Medium, Low, Informational

### UI Connection
- **Components**:
  - `FindingsListPanel` — side panel listing all findings for the report, filterable by severity/status
  - `FindingDetailModal` — full form for creating/editing a finding (all fields)
  - `FindingStatusBadge` — colored badge showing status
  - `ManagementResponseForm` — separate form for control owners to respond
  - `FindingTimelineView` — history of status changes and comments per finding
  - `FindingCard` (editor block) — updated to link to `report_findings` records
  - `FindingSummaryWidget` — dashboard widget showing findings count by severity

---

## Phase 7: Sign-off & Approval Workflow

### Goal
Multi-role approval workflow with audit trail, version locking, and immutability guarantees for published reports.

### Implementation

#### 7.1 Database: `report_approvals` table
```sql
CREATE TABLE report_approvals (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  role TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  comment TEXT,
  signed_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 7.2 Workflow Rules
- **Draft → Review**: Any editor can submit for review. Content is saved as a version snapshot.
- **Review → Approved**: Reviewer (different from preparer) approves or returns with comments.
- **Approved → Published**: Approver confirms final sign-off. Report is locked. PDF is auto-generated.
- **Published**: Content is immutable. Only new versions (amendments) can be created, which go through the same workflow.
- **Return**: At any stage, can be returned to prior stage with comments.

#### 7.3 Locking Mechanism
- When status is `approved` or `published`, the API rejects content updates
- Editor switches to read-only mode
- Only status transitions and new amendment versions are allowed

#### 7.4 API Endpoints
- `POST /api/workspaces/:id/reports/:reportId/submit-review` — submit for review
- `POST /api/workspaces/:id/reports/:reportId/approve` — approve
- `POST /api/workspaces/:id/reports/:reportId/reject` — return with comments
- `POST /api/workspaces/:id/reports/:reportId/publish` — publish and lock
- `GET /api/workspaces/:id/reports/:reportId/approvals` — approval history

### UI Connection
- **Components**:
  - `ApprovalWorkflowBar` — top bar showing current status, action buttons, assigned reviewers
  - `SubmitReviewModal` — select reviewer, add notes
  - `ApprovalModal` — approve or return with comments
  - `ApprovalHistoryTimeline` — vertical timeline of all approval actions
  - `ReadOnlyBanner` — shown when report is locked (approved/published)
  - `AmendmentButton` — create new amendment version of published report

---

## Phase 8: Advanced Editor Blocks

### Goal
Full library of custom blocks for comprehensive audit reporting: control matrices, risk heatmaps, charts, timelines, and evidence galleries.

### Implementation

#### 8.1 Control Matrix Block
- Attributes: `frameworkId`, `sectionScope` (e.g., TSC category), `columns[]`
- Renders: criteria → control description → test procedure → test result → exceptions
- Color-coded: green (pass), red (fail), yellow (partial), gray (not tested)
- Expandable rows for exception details

#### 8.2 Risk Heatmap Block
- Attributes: `riskSource` (project risks, finding risks), `likelihoodScale`, `impactScale`
- Renders: Likelihood × Impact grid with colored cells
- Dots/counts in each cell representing items at that risk level
- Click cell to see items at that intersection

#### 8.3 Chart Block
- Attributes: `chartType` (bar, pie, donut, radar, stacked bar), `dataSource`, `config`
- Pre-built chart configurations:
  - Control status distribution (pie)
  - Evidence collection timeline (bar)
  - Findings by severity (bar)
  - Framework coverage (radar)
  - Risk trend over time (line)
- Uses lightweight chart library (Chart.js or Recharts)
- For PDF: renders as SVG/image

#### 8.4 Timeline Block
- Attributes: `events[]` or `dataSource`
- Renders vertical timeline of audit activities
- Useful for: audit timeline, remediation progress, evidence collection milestones

#### 8.5 Evidence Gallery Block
- Attributes: `evidenceIds[]`, `layout` (grid | list), `showMetadata`
- Renders grid of evidence thumbnails (screenshots, document previews)
- Click to expand / view full evidence
- Captions with evidence metadata (date, source, collector)

#### 8.6 Policy Reference Block
- Attributes: `policyId`
- Renders inline card: policy name, version, status, relevant excerpt
- Click to view full policy
- For templates: policy variable placeholder

### UI Connection
- All blocks accessible via **slash menu** under their respective categories
- Each block has a **configuration panel** (right sidebar) when selected
- All blocks have **static HTML renderers** for PDF export
- **Block gallery page**: documentation/preview of all available blocks (for template creators)

---

## Phase 9: Cross-Framework & Advanced Features

### Goal
Evidence reuse across reports, comparison views, trend analysis, and advanced compliance intelligence.

### Implementation

#### 9.1 Cross-Framework Evidence Mapping
- When evidence is linked to controls across multiple frameworks (via crosswalks), show this in reports
- Evidence table block can show "also satisfies: ISO 27001 A.5.18, NIST AC-1" per evidence item
- Reduces duplicate evidence collection work

#### 9.2 Report Comparison
- Side-by-side diff view between report versions
- Period-over-period comparison (Q1 vs Q2, this year vs last year)
- Highlight changes in control status, new/resolved findings

#### 9.3 Trend Analysis
- `TrendChart` block that shows compliance posture over multiple audit periods
- Data: control pass rates, finding counts, risk scores across time
- Requires linking reports to time periods and tracking metrics per report

#### 9.4 Bulk Report Generation
- Generate reports for multiple frameworks from the same compliance project
- Shared evidence resolves once, mapped per framework
- Parallel generation with progress tracking

#### 9.5 Report Sharing & Distribution
- Generate shareable links (read-only) for external auditors
- Access controls: viewer, commenter, editor
- Expiring links for sensitive reports
- Email distribution with PDF attachment

#### 9.6 Retention & Archival
- Configurable retention policies per workspace
- Auto-archive after retention period
- Archived reports are read-only, stored in cold R2 storage
- Compliance with SOX (7yr), ISO (3yr), HIPAA (6yr) retention requirements

### UI Connection
- **Route**: `/workspaces/:workspaceId/reports/compare` — comparison view
- **Components**:
  - `ReportComparisonView` — side-by-side diff
  - `TrendDashboard` — compliance trend charts across reports
  - `BulkGenerateModal` — select frameworks + project → generate multiple reports
  - `ShareReportModal` — generate sharing link, set permissions, expiry
  - `RetentionSettingsPanel` — workspace-level retention configuration
  - `ArchiveManager` — view/restore archived reports
