-- Baseline Library: predefined compliance baselines that workspaces can activate
CREATE TABLE IF NOT EXISTS baseline_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  check_type TEXT NOT NULL DEFAULT 'manual',
  expected_value TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  framework_hints TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bl_cat ON baseline_library(category);

-- ── Identity & Access Management ──────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_mfa_all', 'MFA enabled on all user accounts', 'identity', 'Multi-factor authentication must be enabled for every user account in identity providers', 'automated', 'enabled', 'critical', 'SOC2:CC6.1,ISO27001:A.9.4.2,NIST:IA-2'),
('bl_mfa_admin', 'MFA enforced for admin accounts', 'identity', 'Administrative accounts must have hardware or app-based MFA enforced', 'automated', 'enforced', 'critical', 'SOC2:CC6.1,ISO27001:A.9.4.2'),
('bl_password_length', 'Minimum password length ≥ 12 characters', 'identity', 'Password policy must enforce minimum 12 character passwords', 'automated', '>=12', 'high', 'SOC2:CC6.1,ISO27001:A.9.4.3,NIST:IA-5'),
('bl_password_complexity', 'Password complexity requirements enabled', 'identity', 'Passwords must require uppercase, lowercase, numbers, and special characters', 'automated', 'enabled', 'medium', 'SOC2:CC6.1,NIST:IA-5'),
('bl_session_timeout', 'Session timeout ≤ 15 minutes', 'identity', 'Inactive sessions must auto-lock after 15 minutes maximum', 'automated', '<=15', 'medium', 'SOC2:CC6.1,ISO27001:A.11.2.8,NIST:AC-11'),
('bl_sso_enforced', 'SSO enforced for production systems', 'identity', 'Single sign-on must be the only authentication method for production systems', 'manual', 'enforced', 'high', 'SOC2:CC6.1,ISO27001:A.9.4.2'),
('bl_account_lockout', 'Account lockout after 5 failed attempts', 'identity', 'Accounts must be locked after 5 consecutive failed login attempts', 'automated', '<=5', 'medium', 'SOC2:CC6.1,NIST:AC-7'),
('bl_access_review_90', 'Access reviews conducted every 90 days', 'identity', 'User access permissions must be reviewed and recertified quarterly', 'manual', '<=90 days', 'high', 'SOC2:CC6.2,ISO27001:A.9.2.5,NIST:AC-2'),
('bl_offboarding_24h', 'Access revoked within 24h of termination', 'identity', 'All system access must be revoked within 24 hours of employee termination', 'manual', '<=24h', 'critical', 'SOC2:CC6.2,ISO27001:A.9.2.6,NIST:PS-4'),
('bl_least_privilege', 'Least privilege access enforced', 'identity', 'Users must only have access to resources required for their role', 'manual', 'enforced', 'high', 'SOC2:CC6.3,ISO27001:A.9.4.1,NIST:AC-6');

-- ── Data Protection ───────────────────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_encrypt_rest', 'Encryption at rest enabled', 'data_protection', 'All data stores must have encryption at rest enabled (AES-256 or equivalent)', 'automated', 'enabled', 'critical', 'SOC2:CC6.7,ISO27001:A.10.1.1,NIST:SC-28'),
('bl_encrypt_transit', 'TLS 1.2+ enforced for data in transit', 'data_protection', 'All network communication must use TLS 1.2 or higher', 'automated', '>=1.2', 'critical', 'SOC2:CC6.7,ISO27001:A.10.1.1,NIST:SC-8'),
('bl_backup_retention', 'Backup retention ≥ 30 days', 'data_protection', 'Data backups must be retained for at least 30 days', 'automated', '>=30', 'high', 'SOC2:A1.2,ISO27001:A.12.3.1,NIST:CP-9'),
('bl_backup_tested', 'Backup restoration tested quarterly', 'data_protection', 'Backup restoration must be tested at least once per quarter', 'manual', '<=90 days', 'high', 'SOC2:A1.2,ISO27001:A.17.1.3,NIST:CP-4'),
('bl_data_classification', 'Data classification policy applied', 'data_protection', 'All data assets must be classified according to sensitivity levels', 'manual', 'applied', 'medium', 'SOC2:CC6.7,ISO27001:A.8.2.1,NIST:RA-2'),
('bl_pii_handling', 'PII handling procedures documented', 'data_protection', 'Procedures for handling personally identifiable information must be documented and followed', 'manual', 'documented', 'high', 'SOC2:P1,ISO27001:A.18.1.4,NIST:SI-12'),
('bl_data_retention', 'Data retention policy enforced', 'data_protection', 'Data retention and disposal schedules must be defined and enforced', 'manual', 'enforced', 'medium', 'SOC2:CC6.5,ISO27001:A.8.3.2,NIST:SI-12');

-- ── Network Security ──────────────────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_firewall_rules', 'Firewall rules reviewed quarterly', 'network', 'Network firewall rules must be reviewed and updated at least quarterly', 'manual', '<=90 days', 'high', 'SOC2:CC6.6,ISO27001:A.13.1.1,NIST:SC-7'),
('bl_vpn_remote', 'VPN required for remote access', 'network', 'All remote access to internal networks must use approved VPN connections', 'manual', 'required', 'high', 'SOC2:CC6.6,ISO27001:A.13.1.1,NIST:AC-17'),
('bl_network_segmentation', 'Network segmentation implemented', 'network', 'Production, staging, and corporate networks must be segmented', 'manual', 'implemented', 'high', 'SOC2:CC6.6,ISO27001:A.13.1.3,NIST:SC-7'),
('bl_ids_ips', 'IDS/IPS monitoring active', 'network', 'Intrusion detection and prevention systems must be active on all network boundaries', 'automated', 'active', 'high', 'SOC2:CC7.2,ISO27001:A.13.1.1,NIST:SI-4'),
('bl_ddos_protection', 'DDoS protection enabled', 'network', 'DDoS mitigation must be enabled for all public-facing services', 'automated', 'enabled', 'medium', 'SOC2:A1.2,NIST:SC-5'),
('bl_dns_security', 'DNS security (DNSSEC) enabled', 'network', 'DNSSEC must be enabled to prevent DNS spoofing attacks', 'automated', 'enabled', 'low', 'NIST:SC-20');

-- ── Endpoint Security ─────────────────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_edr_installed', 'EDR/Antivirus installed on all endpoints', 'endpoint', 'Endpoint detection and response must be installed on every managed device', 'automated', 'installed', 'critical', 'SOC2:CC6.8,ISO27001:A.12.2.1,NIST:SI-3'),
('bl_os_updates', 'OS auto-updates enabled', 'endpoint', 'Operating system security patches must be applied automatically or within 14 days', 'automated', 'enabled', 'high', 'SOC2:CC7.1,ISO27001:A.12.6.1,NIST:SI-2'),
('bl_disk_encryption', 'Full disk encryption enabled', 'endpoint', 'All endpoint devices must have full disk encryption (BitLocker, FileVault, LUKS)', 'automated', 'enabled', 'critical', 'SOC2:CC6.7,ISO27001:A.10.1.1,NIST:SC-28'),
('bl_screen_lock', 'Screen lock ≤ 5 minutes', 'endpoint', 'Endpoints must auto-lock after 5 minutes of inactivity', 'automated', '<=5', 'medium', 'SOC2:CC6.1,ISO27001:A.11.2.8,NIST:AC-11'),
('bl_usb_restricted', 'USB storage devices restricted', 'endpoint', 'USB mass storage devices must be restricted or disabled on managed endpoints', 'automated', 'restricted', 'medium', 'SOC2:CC6.7,ISO27001:A.8.3.1,NIST:MP-7'),
('bl_mdm_enrolled', 'All devices enrolled in MDM', 'endpoint', 'Every company device must be enrolled in mobile device management', 'automated', 'enrolled', 'high', 'SOC2:CC6.8,ISO27001:A.11.2.6');

-- ── Logging & Monitoring ──────────────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_audit_logs', 'Audit logging enabled on all systems', 'logging', 'All production systems must have audit logging enabled and forwarded to SIEM', 'automated', 'enabled', 'critical', 'SOC2:CC7.2,ISO27001:A.12.4.1,NIST:AU-2'),
('bl_log_retention', 'Log retention ≥ 90 days', 'logging', 'All audit logs must be retained for at least 90 days (1 year recommended)', 'automated', '>=90', 'high', 'SOC2:CC7.2,ISO27001:A.12.4.1,NIST:AU-11'),
('bl_alerting_critical', 'Alerting configured for critical events', 'logging', 'Automated alerts must be configured for security-critical events', 'manual', 'configured', 'high', 'SOC2:CC7.3,ISO27001:A.16.1.2,NIST:IR-6'),
('bl_log_integrity', 'Log tampering protection enabled', 'logging', 'Audit logs must be protected against unauthorized modification or deletion', 'automated', 'enabled', 'high', 'SOC2:CC7.2,ISO27001:A.12.4.2,NIST:AU-9'),
('bl_siem_active', 'SIEM platform active and monitored', 'logging', 'Security information and event management must be operational with 24/7 monitoring', 'manual', 'active', 'high', 'SOC2:CC7.2,NIST:SI-4');

-- ── Application Security ──────────────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_code_review', 'Code review required before merge', 'application', 'All code changes must be reviewed and approved before merging to main branch', 'automated', 'required', 'high', 'SOC2:CC8.1,ISO27001:A.14.2.1,NIST:SA-11'),
('bl_sast_pipeline', 'SAST scanning in CI/CD pipeline', 'application', 'Static application security testing must run on every build', 'automated', 'enabled', 'high', 'SOC2:CC8.1,ISO27001:A.14.2.5,NIST:SA-11'),
('bl_dependency_scan', 'Dependency vulnerability scanning enabled', 'application', 'Third-party dependencies must be scanned for known vulnerabilities', 'automated', 'enabled', 'high', 'SOC2:CC8.1,ISO27001:A.14.2.5,NIST:RA-5'),
('bl_secrets_scan', 'Secret detection in repositories', 'application', 'Automated scanning for exposed secrets, keys, and credentials in code repositories', 'automated', 'enabled', 'critical', 'SOC2:CC6.1,NIST:IA-5'),
('bl_pentest_annual', 'Penetration testing conducted annually', 'application', 'External penetration testing must be performed at least annually', 'manual', '<=365 days', 'high', 'SOC2:CC4.1,ISO27001:A.18.2.3,NIST:CA-8'),
('bl_waf_enabled', 'WAF enabled on public applications', 'application', 'Web application firewall must protect all public-facing web applications', 'automated', 'enabled', 'high', 'SOC2:CC6.6,NIST:SC-7');

-- ── Business Continuity ───────────────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_dr_plan', 'Disaster recovery plan documented', 'continuity', 'A comprehensive disaster recovery plan must be documented and maintained', 'manual', 'documented', 'high', 'SOC2:A1.2,ISO27001:A.17.1.1,NIST:CP-2'),
('bl_dr_tested', 'DR plan tested annually', 'continuity', 'Disaster recovery procedures must be tested at least annually', 'manual', '<=365 days', 'high', 'SOC2:A1.2,ISO27001:A.17.1.3,NIST:CP-4'),
('bl_rto_defined', 'RTO/RPO targets defined', 'continuity', 'Recovery Time and Recovery Point Objectives must be defined for all critical systems', 'manual', 'defined', 'medium', 'SOC2:A1.2,ISO27001:A.17.1.1,NIST:CP-2'),
('bl_incident_response', 'Incident response plan documented', 'continuity', 'An incident response plan with roles, procedures, and communication must be maintained', 'manual', 'documented', 'high', 'SOC2:CC7.3,ISO27001:A.16.1.1,NIST:IR-1'),
('bl_incident_tested', 'Incident response tested semi-annually', 'continuity', 'Incident response drills or tabletop exercises must be conducted twice per year', 'manual', '<=180 days', 'medium', 'SOC2:CC7.3,ISO27001:A.16.1.1,NIST:IR-3');

-- ── Compliance & Governance ───────────────────────────────────────────
INSERT INTO baseline_library (id, name, category, description, check_type, expected_value, severity, framework_hints) VALUES
('bl_security_training', 'Security awareness training completed annually', 'governance', 'All employees must complete security awareness training at least annually', 'manual', '<=365 days', 'high', 'SOC2:CC1.4,ISO27001:A.7.2.2,NIST:AT-2'),
('bl_acceptable_use', 'Acceptable use policy acknowledged', 'governance', 'All employees must acknowledge the acceptable use policy upon hire and annually', 'manual', 'acknowledged', 'medium', 'SOC2:CC1.1,ISO27001:A.8.1.3,NIST:PL-4'),
('bl_vendor_assessment', 'Vendor risk assessments conducted', 'governance', 'Third-party vendors with access to data must undergo security risk assessment', 'manual', 'conducted', 'high', 'SOC2:CC9.2,ISO27001:A.15.1.1,NIST:SA-9'),
('bl_change_management', 'Change management process enforced', 'governance', 'All production changes must follow a documented change management process', 'manual', 'enforced', 'high', 'SOC2:CC8.1,ISO27001:A.12.1.2,NIST:CM-3'),
('bl_risk_assessment', 'Risk assessment conducted annually', 'governance', 'Formal risk assessment must be conducted at least annually', 'manual', '<=365 days', 'high', 'SOC2:CC3.2,ISO27001:A.12.6.1,NIST:RA-3');
