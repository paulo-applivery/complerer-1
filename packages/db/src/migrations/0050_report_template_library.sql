-- Report Template Library (admin-managed, consumed by workspaces)
CREATE TABLE IF NOT EXISTS report_template_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  framework_slug TEXT,
  category TEXT NOT NULL DEFAULT 'compliance',
  description TEXT,
  content TEXT NOT NULL DEFAULT '{}',
  variables TEXT NOT NULL DEFAULT '[]',
  sections TEXT NOT NULL DEFAULT '[]',
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rtl_framework ON report_template_library(framework_slug);
CREATE INDEX IF NOT EXISTS idx_rtl_category ON report_template_library(category);

-- Seed: SOC 2 Type II
INSERT INTO report_template_library (id, name, framework_slug, category, description, content, variables, sections, version, created_at, updated_at) VALUES (
  'rt_soc2_type2', 'SOC 2 Type II Report', 'soc2', 'compliance',
  'Comprehensive SOC 2 Type II audit report covering Trust Services Criteria, control testing results, and findings.',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"SOC 2 Type II Report"}]},{"type":"paragraph","content":[{"type":"text","text":"Independent Service Auditor''s Report on Controls at "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" for the period "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_start","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":" to "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_end","variableType":"date","displayMode":"placeholder"}}]}]}',
  '[{"key":"org.name","type":"text","label":"Organization Name","required":true},{"key":"org.address","type":"text","label":"Organization Address","required":true},{"key":"audit.period_start","type":"date","label":"Audit Period Start","required":true},{"key":"audit.period_end","type":"date","label":"Audit Period End","required":true},{"key":"audit.scope","type":"text","label":"Audit Scope Description","required":true},{"key":"audit.auditor","type":"text","label":"Auditor Name","required":true},{"key":"audit.auditor_firm","type":"text","label":"Auditor Firm","required":true}]',
  '[{"id":"opinion","title":"Independent Service Auditor''s Report (Opinion Letter)","required":true,"aiPrompt":"Write a formal SOC 2 Type II opinion letter for the audit period."},{"id":"management-assertion","title":"Management''s Assertion","required":true,"aiPrompt":"Write management assertion confirming responsibility for the system and controls."},{"id":"system-description","title":"System Description","required":true,"aiPrompt":"Describe the system, infrastructure, software, people, procedures, and data."},{"id":"control-testing","title":"Trust Services Criteria & Control Testing","required":true,"variables":["controls.summary"]},{"id":"findings","title":"Findings and Exceptions","required":false},{"id":"cuecs","title":"Complementary User Entity Controls (CUECs)","required":false,"aiPrompt":"List CUECs that user entities are expected to implement."},{"id":"appendix","title":"Appendices","required":false}]',
  '1.0', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'
);

-- Seed: ISO 27001
INSERT INTO report_template_library (id, name, framework_slug, category, description, content, variables, sections, version, created_at, updated_at) VALUES (
  'rt_iso27001', 'ISO 27001 Audit Report', 'iso27001', 'compliance',
  'ISO/IEC 27001:2022 certification audit report covering ISMS scope, clause assessment, Annex A controls, and nonconformities.',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"ISO 27001:2022 Audit Report"}]},{"type":"paragraph","content":[{"type":"text","text":"Information Security Management System Audit Report for "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}',
  '[{"key":"org.name","type":"text","label":"Organization Name","required":true},{"key":"org.address","type":"text","label":"Organization Address","required":true},{"key":"audit.period_start","type":"date","label":"Audit Period Start","required":true},{"key":"audit.period_end","type":"date","label":"Audit Period End","required":true},{"key":"audit.scope","type":"text","label":"ISMS Scope","required":true},{"key":"audit.auditor","type":"text","label":"Lead Auditor","required":true},{"key":"audit.cert_body","type":"text","label":"Certification Body","required":true}]',
  '[{"id":"scope","title":"ISMS Scope","required":true,"aiPrompt":"Define the ISMS scope including boundaries, interfaces, and applicability."},{"id":"clause-assessment","title":"Clause 4-10 Assessment","required":true,"aiPrompt":"Assess compliance against ISO 27001 clauses 4 through 10."},{"id":"annex-a","title":"Annex A Controls Assessment","required":true,"variables":["controls.summary"]},{"id":"nonconformities","title":"Nonconformities","required":false},{"id":"observations","title":"Observations & Opportunities for Improvement","required":false},{"id":"recommendation","title":"Certification Recommendation","required":true,"aiPrompt":"Provide certification recommendation based on audit findings."}]',
  '1.0', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'
);

-- Seed: GDPR DPIA
INSERT INTO report_template_library (id, name, framework_slug, category, description, content, variables, sections, version, created_at, updated_at) VALUES (
  'rt_gdpr_dpia', 'GDPR Data Protection Impact Assessment', 'gdpr', 'privacy',
  'GDPR Article 35 DPIA report covering processing description, necessity assessment, risk assessment, and mitigations.',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Data Protection Impact Assessment (DPIA)"}]},{"type":"paragraph","content":[{"type":"text","text":"Assessment conducted for "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}',
  '[{"key":"org.name","type":"text","label":"Organization Name","required":true},{"key":"dpo.name","type":"text","label":"DPO Name","required":true},{"key":"processing.name","type":"text","label":"Processing Activity Name","required":true},{"key":"processing.purpose","type":"text","label":"Processing Purpose","required":true},{"key":"audit.date","type":"date","label":"Assessment Date","required":true}]',
  '[{"id":"processing","title":"Processing Description","required":true,"aiPrompt":"Describe the data processing activity, data categories, data subjects, and recipients."},{"id":"necessity","title":"Necessity & Proportionality Assessment","required":true,"aiPrompt":"Assess the necessity and proportionality of the processing in relation to its purpose."},{"id":"risk-assessment","title":"Risk Assessment","required":true,"aiPrompt":"Identify and assess risks to data subjects rights and freedoms."},{"id":"mitigations","title":"Mitigating Measures","required":true,"aiPrompt":"Describe measures to mitigate identified risks."},{"id":"dpo-consultation","title":"DPO Consultation","required":false,"aiPrompt":"Document DPO consultation and recommendations."},{"id":"conclusion","title":"Conclusion & Decision","required":true}]',
  '1.0', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'
);

-- Seed: ENS
INSERT INTO report_template_library (id, name, framework_slug, category, description, content, variables, sections, version, created_at, updated_at) VALUES (
  'rt_ens', 'ENS Compliance Report', 'ens', 'compliance',
  'Esquema Nacional de Seguridad (RD 311/2022) compliance report covering category assessment, security measures, and gap analysis.',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Informe de Conformidad ENS"}]},{"type":"paragraph","content":[{"type":"text","text":"Evaluacion de conformidad con el Esquema Nacional de Seguridad para "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}',
  '[{"key":"org.name","type":"text","label":"Organization Name","required":true},{"key":"org.category","type":"text","label":"ENS Category (Basic/Medium/High)","required":true},{"key":"audit.period_start","type":"date","label":"Assessment Period Start","required":true},{"key":"audit.period_end","type":"date","label":"Assessment Period End","required":true},{"key":"audit.auditor","type":"text","label":"Auditor","required":true}]',
  '[{"id":"category","title":"Category Assessment","required":true,"aiPrompt":"Determine the ENS category level based on the impact dimensions."},{"id":"measures","title":"Security Measures Assessment","required":true,"variables":["controls.summary"]},{"id":"gaps","title":"Gap Analysis","required":false,"aiPrompt":"Identify gaps between current security posture and ENS requirements."},{"id":"compliance","title":"Compliance Level & Recommendation","required":true,"aiPrompt":"State the overall compliance level and certification recommendation."}]',
  '1.0', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'
);

-- Seed: Risk Assessment
INSERT INTO report_template_library (id, name, framework_slug, category, description, content, variables, sections, version, created_at, updated_at) VALUES (
  'rt_risk_assessment', 'Risk Assessment Report', NULL, 'risk',
  'Comprehensive risk assessment report following ISO 31000 methodology with asset inventory, threat analysis, risk scoring, and treatment plan.',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Risk Assessment Report"}]},{"type":"paragraph","content":[{"type":"text","text":"Risk assessment for "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}',
  '[{"key":"org.name","type":"text","label":"Organization Name","required":true},{"key":"audit.scope","type":"text","label":"Assessment Scope","required":true},{"key":"audit.date","type":"date","label":"Assessment Date","required":true},{"key":"audit.methodology","type":"text","label":"Methodology","required":false}]',
  '[{"id":"scope","title":"Scope & Methodology","required":true,"aiPrompt":"Describe the risk assessment scope, methodology, and criteria."},{"id":"assets","title":"Asset Inventory","required":true},{"id":"threats","title":"Threat Analysis","required":true,"aiPrompt":"Analyze threats and vulnerabilities applicable to identified assets."},{"id":"scoring","title":"Risk Scoring & Prioritization","required":true},{"id":"treatment","title":"Risk Treatment Plan","required":true,"aiPrompt":"Propose risk treatment options for high-priority risks."},{"id":"residual","title":"Residual Risk Assessment","required":false}]',
  '1.0', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'
);

-- Seed: Gap Analysis
INSERT INTO report_template_library (id, name, framework_slug, category, description, content, variables, sections, version, created_at, updated_at) VALUES (
  'rt_gap_analysis', 'Gap Analysis Report', NULL, 'compliance',
  'Gap analysis report comparing current state against framework requirements with remediation roadmap.',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Gap Analysis Report"}]},{"type":"paragraph","content":[{"type":"text","text":"Gap analysis for "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" against "},{"type":"variablePlaceholder","attrs":{"variableKey":"framework.name","variableType":"text","displayMode":"placeholder"}}]}]}',
  '[{"key":"org.name","type":"text","label":"Organization Name","required":true},{"key":"framework.name","type":"text","label":"Target Framework","required":true},{"key":"audit.date","type":"date","label":"Assessment Date","required":true}]',
  '[{"id":"baseline","title":"Framework Baseline Requirements","required":true},{"id":"current-state","title":"Current State Assessment","required":true,"aiPrompt":"Assess the current compliance posture against framework requirements."},{"id":"gaps","title":"Identified Gaps","required":true},{"id":"roadmap","title":"Remediation Roadmap","required":true,"aiPrompt":"Create a prioritized remediation roadmap for identified gaps."},{"id":"timeline","title":"Implementation Timeline","required":false}]',
  '1.0', '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'
);
