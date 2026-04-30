-- ============================================================
-- Phase 4: ENS reciprocal-recognition crosswalks + data-quality view.
--
-- Seeds the canonical ENS RD 311/2022 → ISO/IEC 27001:2022 (Annex A)
-- mappings published by CCN. Mappings use partial confidence to
-- reflect that ENS controls often span more than one ISO control.
--
-- Plus a view that surfaces inconsistencies between ENS findings and
-- their per-control checkboxes (audit template artefacts).
-- ============================================================

-- Helper: SQLite has no UPSERT-with-subquery-select shortcut, so we
-- avoid duplicate inserts by deleting any prior ENS↔ISO crosswalks
-- that this migration would re-create. Idempotent on re-run.

DELETE FROM control_crosswalks
WHERE id LIKE 'cw-ens-iso27001-%';

INSERT INTO control_crosswalks (id, source_control_id, target_control_id, mapping_type, confidence, notes, created_at)
SELECT
  'cw-ens-iso27001-' || lower(replace(replace(src.control_id, '.', '-'), '/', '-')) || '-' || lower(replace(replace(tgt.control_id, '.', '-'), '/', '-')) AS id,
  src.id AS source_control_id,
  tgt.id AS target_control_id,
  m.mapping_type,
  m.confidence,
  m.notes,
  datetime('now') AS created_at
FROM (
  SELECT 'org.1'      AS ens_code, 'A.5.1'  AS iso_code, 'equivalent' AS mapping_type, 0.9  AS confidence, 'ENS Política de seguridad ↔ ISO 5.1 Policies for information security' AS notes UNION ALL
  SELECT 'org.2',      'A.5.1',  'partial',    0.7,  'ENS Normativa de seguridad cubre detalle de la política; ISO 5.1 los abarca a alto nivel.' UNION ALL
  SELECT 'org.2',      'A.5.10', 'partial',    0.7,  'Acceptable use de información y activos.' UNION ALL
  SELECT 'org.3',      'A.5.37', 'equivalent', 0.85, 'Procedimientos operativos documentados.' UNION ALL
  SELECT 'org.4',      'A.5.10', 'partial',    0.6,  'Procesos de autorización formal sobre activos e información.' UNION ALL
  SELECT 'op.pl.1',    'A.5.7',  'partial',    0.7,  'Threat intelligence alimenta el análisis de riesgos.' UNION ALL
  SELECT 'op.pl.2',    'A.8.27', 'partial',    0.75, 'Arquitectura segura de sistemas.' UNION ALL
  SELECT 'op.pl.3',    'A.5.20', 'partial',    0.65, 'Adquisición se solapa con acuerdos con proveedores y desarrollo.' UNION ALL
  SELECT 'op.pl.5',    'A.8.30', 'partial',    0.7,  'Componentes certificados ↔ desarrollo subcontratado / componentes externos.' UNION ALL
  SELECT 'op.acc.1',   'A.5.16', 'equivalent', 0.9,  'Identity management.' UNION ALL
  SELECT 'op.acc.2',   'A.8.3',  'equivalent', 0.85, 'Information access restriction.' UNION ALL
  SELECT 'op.acc.3',   'A.5.3',  'equivalent', 0.9,  'Segregation of duties.' UNION ALL
  SELECT 'op.acc.4',   'A.5.18', 'equivalent', 0.9,  'Access rights provisioning, review, removal.' UNION ALL
  SELECT 'op.acc.5',   'A.8.5',  'equivalent', 0.9,  'Secure authentication for external users.' UNION ALL
  SELECT 'op.acc.6',   'A.8.5',  'equivalent', 0.9,  'Secure authentication for internal users.' UNION ALL
  SELECT 'op.exp.1',   'A.5.9',  'equivalent', 0.9,  'Inventory of information and other associated assets.' UNION ALL
  SELECT 'op.exp.2',   'A.8.9',  'equivalent', 0.85, 'Configuration management / hardening.' UNION ALL
  SELECT 'op.exp.3',   'A.8.9',  'equivalent', 0.85, 'Configuration management lifecycle.' UNION ALL
  SELECT 'op.exp.4',   'A.8.8',  'equivalent', 0.9,  'Management of technical vulnerabilities & patching.' UNION ALL
  SELECT 'op.exp.5',   'A.8.32', 'equivalent', 0.9,  'Change management.' UNION ALL
  SELECT 'op.exp.6',   'A.8.7',  'equivalent', 0.9,  'Protection against malware.' UNION ALL
  SELECT 'op.exp.7',   'A.5.24', 'partial',    0.85, 'Information security incident management planning.' UNION ALL
  SELECT 'op.exp.7',   'A.5.25', 'partial',    0.85, 'Assessment and decision on incidents.' UNION ALL
  SELECT 'op.exp.7',   'A.5.26', 'partial',    0.8,  'Response to incidents.' UNION ALL
  SELECT 'op.exp.8',   'A.8.15', 'equivalent', 0.9,  'Logging.' UNION ALL
  SELECT 'op.exp.9',   'A.5.27', 'equivalent', 0.85, 'Learning from incidents.' UNION ALL
  SELECT 'op.exp.10',  'A.8.24', 'equivalent', 0.9,  'Use of cryptography / key management.' UNION ALL
  SELECT 'op.ext.1',   'A.5.20', 'equivalent', 0.9,  'Supplier agreements / SLAs.' UNION ALL
  SELECT 'op.ext.2',   'A.5.22', 'equivalent', 0.85, 'Monitoring, review and change management of supplier services.' UNION ALL
  SELECT 'op.ext.3',   'A.5.21', 'equivalent', 0.85, 'Managing information security in the ICT supply chain.' UNION ALL
  SELECT 'op.ext.4',   'A.5.14', 'partial',    0.7,  'Information transfer / interconnections.' UNION ALL
  SELECT 'op.nub.1',   'A.5.23', 'equivalent', 0.9,  'Information security for use of cloud services.' UNION ALL
  SELECT 'op.cont.1',  'A.5.30', 'partial',    0.85, 'ICT readiness for business continuity (BIA).' UNION ALL
  SELECT 'op.cont.2',  'A.5.30', 'partial',    0.85, 'ICT readiness for business continuity (plan).' UNION ALL
  SELECT 'op.cont.3',  'A.5.30', 'partial',    0.8,  'ICT readiness for business continuity (testing).' UNION ALL
  SELECT 'op.cont.4',  'A.8.14', 'partial',    0.75, 'Redundancy of information processing facilities.' UNION ALL
  SELECT 'op.mon.1',   'A.8.16', 'partial',    0.8,  'Monitoring activities.' UNION ALL
  SELECT 'op.mon.2',   'A.5.36', 'partial',    0.65, 'Compliance with policies, rules and standards (metrics).' UNION ALL
  SELECT 'op.mon.3',   'A.8.16', 'equivalent', 0.85, 'Continuous monitoring / SOC.' UNION ALL
  SELECT 'mp.if.1',    'A.7.1',  'equivalent', 0.9,  'Physical security perimeters.' UNION ALL
  SELECT 'mp.if.2',    'A.7.2',  'equivalent', 0.9,  'Physical entry controls.' UNION ALL
  SELECT 'mp.if.3',    'A.7.5',  'partial',    0.85, 'Protecting against physical and environmental threats.' UNION ALL
  SELECT 'mp.if.4',    'A.7.11', 'equivalent', 0.9,  'Supporting utilities.' UNION ALL
  SELECT 'mp.if.5',    'A.7.5',  'partial',    0.8,  'Fire protection (environmental threats).' UNION ALL
  SELECT 'mp.if.6',    'A.7.5',  'partial',    0.8,  'Flood protection (environmental threats).' UNION ALL
  SELECT 'mp.if.7',    'A.7.10', 'partial',    0.7,  'Storage media handling on entry/exit.' UNION ALL
  SELECT 'mp.per.1',   'A.6.2',  'equivalent', 0.85, 'Terms and conditions of employment.' UNION ALL
  SELECT 'mp.per.2',   'A.6.2',  'partial',    0.85, 'Duties / NDAs in employment.' UNION ALL
  SELECT 'mp.per.3',   'A.6.3',  'equivalent', 0.9,  'Information security awareness, education and training.' UNION ALL
  SELECT 'mp.per.4',   'A.6.3',  'equivalent', 0.9,  'Information security training.' UNION ALL
  SELECT 'mp.eq.1',    'A.7.7',  'equivalent', 0.9,  'Clear desk and clear screen.' UNION ALL
  SELECT 'mp.eq.2',    'A.8.1',  'partial',    0.7,  'User endpoint devices (lock).' UNION ALL
  SELECT 'mp.eq.3',    'A.8.1',  'equivalent', 0.85, 'User endpoint devices (mobile/portable).' UNION ALL
  SELECT 'mp.eq.4',    'A.8.1',  'partial',    0.7,  'Other devices on network ↔ user endpoint devices.' UNION ALL
  SELECT 'mp.com.1',   'A.8.20', 'equivalent', 0.9,  'Networks security / perimeter.' UNION ALL
  SELECT 'mp.com.2',   'A.8.24', 'equivalent', 0.85, 'Use of cryptography for confidentiality in transit.' UNION ALL
  SELECT 'mp.com.3',   'A.8.24', 'partial',    0.8,  'Cryptography for integrity & authenticity.' UNION ALL
  SELECT 'mp.com.4',   'A.8.22', 'equivalent', 0.9,  'Segregation of networks.' UNION ALL
  SELECT 'mp.si.1',    'A.5.13', 'equivalent', 0.85, 'Labelling of information.' UNION ALL
  SELECT 'mp.si.2',    'A.8.24', 'partial',    0.8,  'Cryptography on removable media.' UNION ALL
  SELECT 'mp.si.3',    'A.7.10', 'equivalent', 0.85, 'Storage media custody.' UNION ALL
  SELECT 'mp.si.4',    'A.7.10', 'partial',    0.8,  'Storage media transport.' UNION ALL
  SELECT 'mp.si.5',    'A.7.14', 'equivalent', 0.9,  'Secure disposal or re-use of equipment / media.' UNION ALL
  SELECT 'mp.sw.1',    'A.8.25', 'equivalent', 0.9,  'Secure development lifecycle.' UNION ALL
  SELECT 'mp.sw.2',    'A.8.29', 'equivalent', 0.85, 'Security testing in development and acceptance.' UNION ALL
  SELECT 'mp.info.1',  'A.5.34', 'equivalent', 0.85, 'Privacy and protection of PII.' UNION ALL
  SELECT 'mp.info.2',  'A.5.12', 'equivalent', 0.9,  'Classification of information.' UNION ALL
  SELECT 'mp.info.3',  'A.8.24', 'partial',    0.75, 'Electronic signature ↔ cryptography.' UNION ALL
  SELECT 'mp.info.4',  'A.8.24', 'partial',    0.7,  'Time stamps ↔ cryptography.' UNION ALL
  SELECT 'mp.info.5',  'A.5.13', 'partial',    0.65, 'Document sanitization within labelling controls.' UNION ALL
  SELECT 'mp.info.6',  'A.8.13', 'equivalent', 0.95, 'Information backup.' UNION ALL
  SELECT 'mp.s.1',     'A.5.14', 'partial',    0.75, 'Email security ↔ information transfer.' UNION ALL
  SELECT 'mp.s.2',     'A.8.26', 'equivalent', 0.9,  'Application security requirements.' UNION ALL
  SELECT 'mp.s.3',     'A.8.23', 'equivalent', 0.9,  'Web filtering.' UNION ALL
  SELECT 'mp.s.4',     'A.8.6',  'partial',    0.75, 'DoS protection ↔ capacity management.'
) m
JOIN versioned_controls src
  ON src.framework_version_id = 'ens-2022' AND src.control_id = m.ens_code
JOIN versioned_controls tgt
  ON tgt.control_id = m.iso_code
JOIN framework_versions fv ON fv.id = tgt.framework_version_id
JOIN frameworks f          ON f.id = fv.framework_id
WHERE f.slug = 'iso27001';

-- ── Data-quality flag view ──────────────────────────────────
--
-- Surfaces inconsistencies between findings and their categorisation,
-- per the ENS audit-spec data-quality taxonomy. Computed lazily via a
-- view so the migration stays cheap and the source of truth remains
-- the underlying ens_findings table.

DROP VIEW IF EXISTS ens_finding_quality_flags;
CREATE VIEW ens_finding_quality_flags AS
SELECT
  f.id            AS finding_id,
  f.audit_id,
  f.display_id,
  f.severity,
  f.exists_flag,
  f.surfaces_in_executive_summary,
  -- SEVERITY_DISPLAY_MISMATCH: prefix vs. severity
  CASE
    WHEN f.severity IN ('NO_CONFORMIDAD_MAYOR','NO_CONFORMIDAD_MENOR') AND f.display_id NOT LIKE 'NC%' THEN 1
    WHEN f.severity = 'OBSERVACION' AND f.display_id NOT LIKE 'OBS%' THEN 1
    WHEN f.severity = 'PUNTO_DE_MEJORA' AND f.display_id NOT LIKE 'PM%' THEN 1
    ELSE 0
  END AS flag_severity_display_mismatch,
  -- EXEC_SUMMARY_MISSING_PER_CONTROL_FINDING: NC/OBS not surfaced in summary
  CASE
    WHEN f.severity IN ('NO_CONFORMIDAD_MAYOR','NO_CONFORMIDAD_MENOR','OBSERVACION')
     AND f.surfaces_in_executive_summary = 0 THEN 1
    ELSE 0
  END AS flag_exec_summary_missing_per_control_finding,
  -- EXISTEN_FALSE_BUT_CATEGORY_CHECKED: severity tagged but EXISTEN unchecked
  CASE
    WHEN f.exists_flag = 0 AND f.severity IS NOT NULL THEN 1
    ELSE 0
  END AS flag_existen_false_but_category_checked
FROM ens_findings f;
