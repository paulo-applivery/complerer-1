-- ============================================================
-- ENS 2022 (Esquema Nacional de Seguridad) - RD 311/2022
-- Spanish National Security Framework
-- 73 controls across 3 domains
-- ============================================================

-- 1. Framework
INSERT OR IGNORE INTO frameworks (id, slug, name, description, source_org, source_url, created_at)
VALUES (
  'ens',
  'ens',
  'Esquema Nacional de Seguridad (ENS)',
  'Spanish National Security Framework (Real Decreto 311/2022) establishing the security policy for the use of electronic media in the public sector and suppliers. Applies to all Spanish public administrations and their technology providers.',
  'Gobierno de España - Ministerio de Asuntos Económicos y Transformación Digital',
  'https://www.boe.es/eli/es/rd/2022/05/03/311',
  datetime('now')
);

-- 2. Framework version
INSERT OR IGNORE INTO framework_versions (id, framework_id, version, status, total_controls, published_at, changelog, source_url, created_at)
VALUES (
  'ens-2022',
  'ens',
  'RD 311/2022',
  'active',
  73,
  '2022-05-04T00:00:00Z',
  'Complete rewrite of ENS replacing RD 3/2010. Updated to address cloud, supply chain, and modern threat landscape.',
  'https://www.boe.es/eli/es/rd/2022/05/03/311',
  datetime('now')
);

-- 3. Versioned controls
-- ════════════════════════════════════════════════════════════
-- DOMAIN: Marco Organizativo (Organizational Framework) - 4 controls
-- ════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-org-1', 'ens-2022', 'org.1', 'Marco Organizativo', NULL, 'Política de seguridad',
   'The organization shall establish a security policy that defines the overall objectives, scope, roles and responsibilities, risk management approach, and regulatory compliance commitments for information security. The policy must be approved by senior management and communicated to all relevant personnel.',
   'The security policy should reference the ENS categorization of systems and the applicable security dimensions (confidentiality, integrity, availability, authenticity, traceability).',
   '["Approved security policy document","Evidence of management approval","Distribution and acknowledgment records"]',
   0.8, 'basic', datetime('now')),

  ('ens-2022-org-2', 'ens-2022', 'org.2', 'Marco Organizativo', NULL, 'Normativa de seguridad',
   'The organization shall develop and maintain a set of security regulations and standards that detail mandatory requirements derived from the security policy. These regulations shall cover all information systems according to their category and be binding for all personnel.',
   'Security regulations should include acceptable use policies, classification rules, access control standards, and incident response procedures.',
   '["Security regulations documentation","Version control and approval records","Staff notification records"]',
   0.8, 'basic', datetime('now')),

  ('ens-2022-org-3', 'ens-2022', 'org.3', 'Marco Organizativo', NULL, 'Procedimientos de seguridad',
   'The organization shall document detailed security procedures covering how to carry out the tasks defined in the security regulations. Procedures must be clear, actionable, and kept up to date with changes in technology, organization, or threat landscape.',
   'Procedures should address day-to-day security operations including user provisioning, backup execution, patch management, and incident handling.',
   '["Documented security procedures","Procedure review and update records","Training records on procedures"]',
   0.8, 'basic', datetime('now')),

  ('ens-2022-org-4', 'ens-2022', 'org.4', 'Marco Organizativo', NULL, 'Proceso de autorización',
   'The organization shall define and enforce a formal authorization process for accessing information systems, installing new components, and making changes to the production environment. Authorization must be granted by designated personnel with appropriate authority.',
   'The authorization process should include risk assessment for new components and change requests.',
   '["Authorization process documentation","Authorization request and approval records","Designated authority assignments"]',
   0.8, 'basic', datetime('now'));

-- ════════════════════════════════════════════════════════════
-- DOMAIN: Marco Operacional (Operational Framework) - 31 controls
-- ════════════════════════════════════════════════════════════

-- Subdomain: Planificación [op.pl]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-op-pl-1', 'ens-2022', 'op.pl.1', 'Marco Operacional', 'Planificación', 'Análisis de riesgos',
   'The organization shall perform and maintain a risk analysis of information systems identifying threats, vulnerabilities, and impacts. The analysis shall be proportionate to the system category and shall be reviewed periodically or when significant changes occur.',
   'Risk analysis methodology should align with MAGERIT or equivalent recognized approaches.',
   '["Risk analysis report","Threat and vulnerability inventory","Risk treatment plan","Review schedule records"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-pl-2', 'ens-2022', 'op.pl.2', 'Marco Operacional', 'Planificación', 'Arquitectura de seguridad',
   'The organization shall define and document the security architecture of its information systems, including network segmentation, defense-in-depth layers, trust boundaries, and the security services protecting each system component.',
   'Architecture documentation should include network diagrams, data flow diagrams, and security zone definitions.',
   '["Security architecture documentation","Network diagrams","Defense-in-depth design records"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-pl-3', 'ens-2022', 'op.pl.3', 'Marco Operacional', 'Planificación', 'Adquisición de nuevos componentes',
   'The organization shall establish a process for evaluating and approving the acquisition of new hardware, software, and communication components, ensuring they meet security requirements before integration into production systems.',
   'Evaluation should consider vendor security posture, known vulnerabilities, and compatibility with existing security controls.',
   '["Acquisition evaluation procedures","Security assessment reports for new components","Approval records"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-pl-4', 'ens-2022', 'op.pl.4', 'Marco Operacional', 'Planificación', 'Dimensionamiento / gestión de capacidades',
   'The organization shall monitor and manage system capacity to ensure adequate resources are available to maintain security operations and prevent service degradation. Capacity planning shall consider current needs and projected growth.',
   'Capacity management should address processing power, storage, bandwidth, and human resources for security operations.',
   '["Capacity monitoring reports","Capacity planning documents","Alert thresholds and escalation procedures"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-pl-5', 'ens-2022', 'op.pl.5', 'Marco Operacional', 'Planificación', 'Componentes certificados',
   'The organization shall use products and services that have been certified or evaluated under recognized security certification schemes (such as Common Criteria or equivalent) when required by the system category and risk level.',
   'For HIGH category systems, certified components are mandatory for critical security functions.',
   '["Inventory of certified components","Certification certificates or evaluation reports","Justification for non-certified components"]',
   0.7, 'high', datetime('now'));

-- Subdomain: Control de acceso [op.acc]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-op-acc-1', 'ens-2022', 'op.acc.1', 'Marco Operacional', 'Control de acceso', 'Identificación',
   'The organization shall uniquely identify all users (internal and external) and entities that access information systems. Shared or generic accounts shall be avoided unless strictly justified and controlled with compensating measures.',
   'Identification mechanisms should support traceability of all actions to individual users.',
   '["User identification policy","User account inventory","Shared account justification and controls"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-acc-2', 'ens-2022', 'op.acc.2', 'Marco Operacional', 'Control de acceso', 'Requisitos de acceso',
   'The organization shall define access requirements based on the principle of least privilege and need-to-know. Access rights shall be formally documented, approved by asset owners, and aligned with job responsibilities.',
   'Access requirements should be derived from the security policy and system categorization.',
   '["Access control policy","Role-based access matrix","Access approval workflows"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-acc-3', 'ens-2022', 'op.acc.3', 'Marco Operacional', 'Control de acceso', 'Segregación de funciones y tareas',
   'The organization shall enforce segregation of duties to prevent any single person from having conflicting privileges that could enable fraud, error, or security compromise. Critical functions shall require multiple authorized individuals.',
   'Segregation should address administration, audit, operation, and development roles.',
   '["Segregation of duties matrix","Conflicting role analysis","Compensating controls for exceptions"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-acc-4', 'ens-2022', 'op.acc.4', 'Marco Operacional', 'Control de acceso', 'Proceso de gestión de derechos de acceso',
   'The organization shall implement a formal process for managing access rights throughout their lifecycle, including provisioning, modification, periodic review, and timely revocation upon role change or termination.',
   'Access rights reviews should be conducted at least annually, more frequently for privileged accounts.',
   '["Access lifecycle management procedures","Periodic access review records","Deprovisioning evidence"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-acc-5', 'ens-2022', 'op.acc.5', 'Marco Operacional', 'Control de acceso', 'Mecanismo de autenticación (usuarios externos)',
   'The organization shall implement authentication mechanisms for external users proportionate to the system category, ensuring at minimum username/password with complexity requirements, and multi-factor authentication for medium and high category systems.',
   'External authentication should consider federation, certificates, or token-based mechanisms where appropriate.',
   '["Authentication policy for external users","MFA deployment records","Authentication strength assessment"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-acc-6', 'ens-2022', 'op.acc.6', 'Marco Operacional', 'Control de acceso', 'Mecanismo de autenticación (usuarios de la organización)',
   'The organization shall implement authentication mechanisms for internal users that are proportionate to the system category. Medium and high category systems shall require multi-factor authentication. Password policies shall enforce complexity, rotation, and history requirements.',
   'Consider centralized identity providers and single sign-on for consistent authentication enforcement.',
   '["Internal authentication policy","MFA enrollment records","Password policy configuration evidence"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-acc-7', 'ens-2022', 'op.acc.7', 'Marco Operacional', 'Control de acceso', 'Mecanismo de autenticación (usuarios de la organización en entorno local)',
   'The organization shall implement local authentication mechanisms for users accessing systems within controlled premises, including physical access controls combined with logical authentication. Local access shall maintain the same security assurance level as remote access.',
   'Local authentication may leverage physical presence as a factor but must still enforce appropriate logical controls.',
   '["Local authentication policy","Physical-logical access integration records","Local access audit logs"]',
   0.7, 'medium', datetime('now'));

-- Subdomain: Explotación [op.exp]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-op-exp-1', 'ens-2022', 'op.exp.1', 'Marco Operacional', 'Explotación', 'Inventario de activos',
   'The organization shall maintain a complete and up-to-date inventory of all information assets including hardware, software, data, services, and personnel. Each asset shall be classified and assigned an owner responsible for its security.',
   'The inventory should be automated where possible and reconciled regularly.',
   '["Asset inventory records","Asset classification scheme","Asset ownership assignments"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-2', 'ens-2022', 'op.exp.2', 'Marco Operacional', 'Explotación', 'Configuración de seguridad',
   'The organization shall establish and apply secure configuration baselines (hardening) for all system components, removing unnecessary services, changing default credentials, and applying the principle of minimal functionality.',
   'Configuration baselines should be derived from CIS Benchmarks, vendor recommendations, or CCN-STIC guides.',
   '["Secure configuration baselines","Hardening checklists","Configuration compliance scan results"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-3', 'ens-2022', 'op.exp.3', 'Marco Operacional', 'Explotación', 'Gestión de la configuración de seguridad',
   'The organization shall implement configuration management processes to control changes to security configurations, ensure traceability, and prevent unauthorized modifications. A configuration management database (CMDB) or equivalent shall be maintained.',
   'Configuration management should integrate with change management and incident management processes.',
   '["Configuration management procedures","CMDB or equivalent records","Configuration change audit trail"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-4', 'ens-2022', 'op.exp.4', 'Marco Operacional', 'Explotación', 'Mantenimiento y actualizaciones de seguridad',
   'The organization shall establish a process for timely application of security patches and updates to all system components. Critical vulnerabilities shall be addressed within defined SLAs based on risk severity.',
   'Patch management should include testing in non-production environments before deployment.',
   '["Patch management policy","Patch deployment records and timelines","Vulnerability scan results"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-5', 'ens-2022', 'op.exp.5', 'Marco Operacional', 'Explotación', 'Gestión de cambios',
   'The organization shall implement a formal change management process for all modifications to information systems, including risk assessment, testing, approval, rollback procedures, and post-implementation review.',
   'Change management should distinguish between standard, normal, and emergency changes.',
   '["Change management policy","Change request and approval records","Post-implementation review reports"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-6', 'ens-2022', 'op.exp.6', 'Marco Operacional', 'Explotación', 'Protección frente a código dañino',
   'The organization shall implement measures to protect against malicious code including malware, ransomware, and unauthorized software. Anti-malware solutions shall be deployed, kept updated, and configured for real-time protection and periodic scanning.',
   'Protection should cover endpoints, servers, email gateways, and web proxies.',
   '["Anti-malware deployment records","Update and scan logs","Malware incident reports"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-7', 'ens-2022', 'op.exp.7', 'Marco Operacional', 'Explotación', 'Gestión de incidentes',
   'The organization shall establish an incident management process covering detection, analysis, containment, eradication, recovery, and lessons learned. Security incidents shall be reported to CCN-CERT as required by the ENS.',
   'Incident management should define severity levels, escalation procedures, and communication protocols.',
   '["Incident management policy and procedures","Incident response records","CCN-CERT notification records"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-8', 'ens-2022', 'op.exp.8', 'Marco Operacional', 'Explotación', 'Registro de la actividad',
   'The organization shall log all user and system activities including access attempts, administrative actions, and security events. Logs shall be protected against tampering, retained for the required period, and reviewed regularly.',
   'Log retention periods should be defined based on system category and legal requirements.',
   '["Logging policy","Log collection and retention configuration","Log review records"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-9', 'ens-2022', 'op.exp.9', 'Marco Operacional', 'Explotación', 'Registro de la gestión de incidentes',
   'The organization shall maintain detailed records of all security incidents including timeline, actions taken, personnel involved, impact assessment, and lessons learned. Incident records shall be preserved for audit and continuous improvement purposes.',
   'Incident records should feed into the risk analysis process and drive improvements to security controls.',
   '["Incident register/database","Incident timeline and action records","Post-incident review reports"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-exp-10', 'ens-2022', 'op.exp.10', 'Marco Operacional', 'Explotación', 'Protección de claves criptográficas',
   'The organization shall implement controls for the generation, storage, distribution, rotation, and destruction of cryptographic keys. Key management procedures shall ensure keys are protected throughout their lifecycle and comply with applicable standards.',
   'Key management should use hardware security modules (HSMs) for high category systems.',
   '["Key management policy","Key lifecycle records","HSM or key storage configuration evidence"]',
   0.7, 'medium', datetime('now')),

  ('ens-2022-op-exp-11', 'ens-2022', 'op.exp.11', 'Marco Operacional', 'Explotación', 'Protección de los servicios y aplicaciones web',
   'The organization shall protect web services and applications against common attacks (injection, XSS, CSRF, etc.) through secure coding practices, input validation, web application firewalls, and regular security testing.',
   'Web applications should be tested according to OWASP guidelines and CCN-STIC recommendations.',
   '["Secure development standards","Web application security test results","WAF configuration and logs"]',
   0.7, 'basic', datetime('now'));

-- Subdomain: Recursos externos [op.ext]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-op-ext-1', 'ens-2022', 'op.ext.1', 'Marco Operacional', 'Recursos externos', 'Contratación y acuerdos de nivel de servicio',
   'The organization shall include specific security requirements in contracts with external service providers, including SLAs for security, incident notification obligations, audit rights, and compliance with ENS requirements applicable to the services provided.',
   'Contracts should specify data protection responsibilities and subcontracting limitations.',
   '["Contract security clauses","SLA documentation","Vendor security assessment records"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-ext-2', 'ens-2022', 'op.ext.2', 'Marco Operacional', 'Recursos externos', 'Gestión diaria',
   'The organization shall monitor and manage external services on a day-to-day basis, verifying compliance with agreed security levels, reviewing security reports, and maintaining communication channels for security incidents and changes.',
   'Daily management should include monitoring of SLA compliance and security event feeds from providers.',
   '["Service monitoring records","SLA compliance reports","Security communication logs with providers"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-ext-3', 'ens-2022', 'op.ext.3', 'Marco Operacional', 'Recursos externos', 'Protección de la cadena de suministro',
   'The organization shall assess and manage security risks in the supply chain, including software and hardware providers, ensuring that the chain of custody and integrity of components is maintained from origin to deployment.',
   'Supply chain protection should address software bill of materials (SBOM) and integrity verification.',
   '["Supply chain risk assessment","Vendor security evaluation records","Component integrity verification evidence"]',
   0.7, 'medium', datetime('now')),

  ('ens-2022-op-ext-4', 'ens-2022', 'op.ext.4', 'Marco Operacional', 'Recursos externos', 'Interconexión de sistemas',
   'The organization shall control and document all interconnections between its systems and external systems, establishing security agreements, implementing appropriate protection measures, and monitoring data flows across trust boundaries.',
   'Interconnection agreements should define data types, security controls, and incident response responsibilities.',
   '["System interconnection agreements","Network diagrams showing external connections","Data flow documentation"]',
   0.7, 'basic', datetime('now'));

-- Subdomain: Servicios en la nube [op.nub]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-op-nub-1', 'ens-2022', 'op.nub.1', 'Marco Operacional', 'Servicios en la nube', 'Protección de servicios en la nube',
   'The organization shall ensure cloud services used comply with ENS requirements, including data residency within EU/EEA, appropriate certification (such as ENS compliance certification for the cloud provider), encryption of data at rest and in transit, and contractual security guarantees.',
   'Cloud providers should hold ENS certification or equivalent (e.g., ISO 27001 + ENS-specific controls). CCN-STIC 823 provides cloud-specific guidance.',
   '["Cloud provider ENS certification","Data residency documentation","Cloud security configuration evidence","Cloud service agreements"]',
   0.7, 'basic', datetime('now'));

-- Subdomain: Continuidad del servicio [op.cont]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-op-cont-1', 'ens-2022', 'op.cont.1', 'Marco Operacional', 'Continuidad del servicio', 'Análisis de impacto',
   'The organization shall conduct a business impact analysis (BIA) to identify critical services, determine maximum tolerable downtime, and establish recovery time and recovery point objectives for each system based on its category.',
   'The BIA should consider dependencies between systems and services.',
   '["Business impact analysis report","RTO/RPO definitions per system","Critical service inventory"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-cont-2', 'ens-2022', 'op.cont.2', 'Marco Operacional', 'Continuidad del servicio', 'Plan de continuidad',
   'The organization shall develop and maintain a business continuity plan that defines the procedures, responsibilities, and resources required to restore critical services within the established recovery objectives after a disruption.',
   'The continuity plan should address various disruption scenarios including natural disasters, cyberattacks, and supply chain failures.',
   '["Business continuity plan","Recovery procedure documentation","Resource and responsibility assignments"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-cont-3', 'ens-2022', 'op.cont.3', 'Marco Operacional', 'Continuidad del servicio', 'Pruebas periódicas',
   'The organization shall conduct periodic testing of continuity plans to verify their effectiveness, identify gaps, and ensure personnel are familiar with their roles. Tests shall be documented and findings addressed through corrective actions.',
   'Testing should include tabletop exercises, functional tests, and full-scale simulations appropriate to the system category.',
   '["Continuity test plans and schedules","Test execution reports","Corrective action records from tests"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-cont-4', 'ens-2022', 'op.cont.4', 'Marco Operacional', 'Continuidad del servicio', 'Medios alternativos',
   'The organization shall provision alternative means (redundant infrastructure, backup sites, secondary communication channels) to ensure service continuity when primary systems are unavailable, proportionate to the system category and recovery objectives.',
   'Alternative means should be tested regularly as part of continuity exercises.',
   '["Alternative infrastructure documentation","Redundancy configuration evidence","Failover test records"]',
   0.7, 'medium', datetime('now'));

-- Subdomain: Monitorización del sistema [op.mon]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-op-mon-1', 'ens-2022', 'op.mon.1', 'Marco Operacional', 'Monitorización del sistema', 'Detección de intrusión',
   'The organization shall deploy intrusion detection and prevention systems (IDS/IPS) to monitor network traffic and system activity for signs of malicious behavior. Detection capabilities shall cover the network perimeter and critical internal segments.',
   'IDS/IPS should be tuned to reduce false positives and integrated with the SIEM for correlation.',
   '["IDS/IPS deployment records","Detection rule configuration","Alert and incident correlation reports"]',
   0.7, 'basic', datetime('now')),

  ('ens-2022-op-mon-2', 'ens-2022', 'op.mon.2', 'Marco Operacional', 'Monitorización del sistema', 'Sistema de métricas',
   'The organization shall establish a security metrics system to measure the effectiveness of security controls, track compliance levels, and support risk-based decision-making. Metrics shall be reported to management periodically.',
   'Metrics should cover vulnerability management, incident response times, patch compliance, and access review completion.',
   '["Security metrics definition","Dashboard or reporting system","Periodic management reports"]',
   0.7, 'medium', datetime('now')),

  ('ens-2022-op-mon-3', 'ens-2022', 'op.mon.3', 'Marco Operacional', 'Monitorización del sistema', 'Vigilancia',
   'The organization shall implement continuous security monitoring (SOC capabilities) to detect, analyze, and respond to security events in near real-time. Monitoring shall cover logs, network flows, endpoint telemetry, and threat intelligence feeds.',
   'For HIGH category systems, 24/7 monitoring capabilities are required. Consider integration with CCN-CERT services.',
   '["SOC/monitoring service documentation","SIEM configuration and coverage","Threat intelligence integration records"]',
   0.7, 'medium', datetime('now'));

-- ════════════════════════════════════════════════════════════
-- DOMAIN: Medidas de Protección (Protection Measures) - 38 controls
-- ════════════════════════════════════════════════════════════

-- Subdomain: Protección de las instalaciones [mp.if]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-if-1', 'ens-2022', 'mp.if.1', 'Medidas de Protección', 'Protección de las instalaciones', 'Áreas separadas y con control de acceso',
   'The organization shall establish physically separated security areas with access controls proportionate to the classification of the information and systems they contain. Access shall be restricted to authorized personnel only.',
   'Physical security zones should be defined based on the sensitivity of the assets they protect.',
   '["Physical security zone documentation","Access control system records","Authorized personnel lists per zone"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-if-2', 'ens-2022', 'mp.if.2', 'Medidas de Protección', 'Protección de las instalaciones', 'Identificación de las personas',
   'The organization shall implement mechanisms to identify and authenticate individuals before granting physical access to secure areas. Visitor management procedures shall include registration, escort requirements, and badge issuance.',
   'Identification mechanisms should be proportionate to the area security level.',
   '["Physical identification procedures","Visitor management logs","Badge issuance and return records"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-if-3', 'ens-2022', 'mp.if.3', 'Medidas de Protección', 'Protección de las instalaciones', 'Acondicionamiento de los locales',
   'The organization shall ensure facilities housing information systems have appropriate environmental conditioning including temperature control, humidity management, dust protection, and electromagnetic interference shielding as required.',
   'Environmental monitoring should include automated alerting for out-of-range conditions.',
   '["Environmental monitoring system records","HVAC maintenance records","Environmental incident logs"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-if-4', 'ens-2022', 'mp.if.4', 'Medidas de Protección', 'Protección de las instalaciones', 'Energía eléctrica',
   'The organization shall ensure reliable power supply to critical systems including uninterruptible power supplies (UPS), backup generators, and redundant power feeds proportionate to system availability requirements.',
   'Power protection should be tested regularly and capacity should cover the critical load plus safety margin.',
   '["Power infrastructure documentation","UPS and generator test records","Power capacity assessments"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-if-5', 'ens-2022', 'mp.if.5', 'Medidas de Protección', 'Protección de las instalaciones', 'Protección frente a incendios',
   'The organization shall implement fire detection and suppression systems in facilities housing information systems. Fire protection measures shall comply with applicable building regulations and be tested periodically.',
   'Data centers and server rooms should use clean-agent fire suppression systems.',
   '["Fire detection system documentation","Fire suppression system records","Fire drill and test records"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-if-6', 'ens-2022', 'mp.if.6', 'Medidas de Protección', 'Protección de las instalaciones', 'Protección frente a inundaciones',
   'The organization shall implement measures to protect facilities and equipment against water damage and flooding, including water detection sensors, raised floors, waterproof barriers, and drainage systems where appropriate.',
   'Water detection should be installed in areas below, above, and adjacent to critical equipment.',
   '["Flood protection measures documentation","Water detection sensor deployment records","Facility risk assessment for water damage"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-if-7', 'ens-2022', 'mp.if.7', 'Medidas de Protección', 'Protección de las instalaciones', 'Registro de entrada y salida de equipamiento',
   'The organization shall maintain a register of all equipment entering and leaving secure areas, including date, time, person responsible, equipment description, and authorization. Equipment movements shall be authorized and verified.',
   'Equipment tracking should integrate with the asset inventory.',
   '["Equipment movement register","Authorization records for equipment transfers","Equipment verification procedures"]',
   0.6, 'basic', datetime('now'));

-- Subdomain: Gestión del personal [mp.per]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-per-1', 'ens-2022', 'mp.per.1', 'Medidas de Protección', 'Gestión del personal', 'Caracterización del puesto de trabajo',
   'The organization shall define security responsibilities and requirements for each job role, including required security clearances, access privileges, and security training needs. Job descriptions shall reflect security duties.',
   'Role characterization should be reviewed when organizational changes occur.',
   '["Job role security profiles","Security clearance requirements per role","Role-based access privilege definitions"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-per-2', 'ens-2022', 'mp.per.2', 'Medidas de Protección', 'Gestión del personal', 'Deberes y obligaciones',
   'The organization shall inform all personnel of their security duties and obligations including acceptable use, confidentiality, incident reporting, and consequences of non-compliance. Personnel shall formally acknowledge these obligations.',
   'Obligations should be communicated during onboarding and reinforced periodically.',
   '["Security duties documentation","Signed acknowledgment records","Acceptable use policy acceptance"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-per-3', 'ens-2022', 'mp.per.3', 'Medidas de Protección', 'Gestión del personal', 'Concienciación',
   'The organization shall conduct regular security awareness programs to ensure all personnel understand current threats, recognize social engineering attempts, follow security procedures, and report suspicious activities.',
   'Awareness programs should be updated to reflect the current threat landscape and include practical exercises like phishing simulations.',
   '["Security awareness program plan","Training attendance records","Phishing simulation results"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-per-4', 'ens-2022', 'mp.per.4', 'Medidas de Protección', 'Gestión del personal', 'Formación',
   'The organization shall provide specific security training to personnel with security responsibilities, ensuring they have the technical knowledge and skills required to perform their roles effectively. Training shall be updated to address emerging threats and technologies.',
   'Training should be role-specific and include hands-on exercises for technical staff.',
   '["Security training plan","Training completion records","Competency assessments"]',
   0.6, 'basic', datetime('now'));

-- Subdomain: Protección de los equipos [mp.eq]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-eq-1', 'ens-2022', 'mp.eq.1', 'Medidas de Protección', 'Protección de los equipos', 'Puesto de trabajo despejado',
   'The organization shall enforce a clean desk and clear screen policy to prevent unauthorized access to sensitive information left on desks, screens, printers, or other accessible locations when workstations are unattended.',
   'Policy should address both physical documents and digital displays.',
   '["Clean desk policy","Compliance audit records","Awareness training on clean desk practices"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-eq-2', 'ens-2022', 'mp.eq.2', 'Medidas de Protección', 'Protección de los equipos', 'Bloqueo del puesto de trabajo',
   'The organization shall configure workstations to automatically lock after a period of inactivity and require re-authentication to unlock. Users shall be trained to manually lock their workstations when leaving them unattended.',
   'Screen lock timeout should be appropriate to the environment risk level.',
   '["Screen lock policy configuration","GPO or MDM settings evidence","User training records"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-eq-3', 'ens-2022', 'mp.eq.3', 'Medidas de Protección', 'Protección de los equipos', 'Protección de dispositivos portátiles',
   'The organization shall implement specific security measures for portable devices including laptops, tablets, and smartphones, such as full disk encryption, remote wipe capability, device management, and usage policies for travel and remote work.',
   'Mobile device management (MDM) solutions should be deployed for organizational devices.',
   '["Mobile device policy","MDM deployment records","Encryption configuration evidence"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-eq-4', 'ens-2022', 'mp.eq.4', 'Medidas de Protección', 'Protección de los equipos', 'Otros dispositivos conectados a la red',
   'The organization shall identify, authorize, and secure all devices connected to its networks including IoT devices, printers, BYOD equipment, and industrial control systems. Unauthorized devices shall be detected and blocked.',
   'Network access control (NAC) should be implemented to enforce device authorization.',
   '["Connected device inventory","Network access control configuration","Unauthorized device detection logs"]',
   0.6, 'basic', datetime('now'));

-- Subdomain: Protección de las comunicaciones [mp.com]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-com-1', 'ens-2022', 'mp.com.1', 'Medidas de Protección', 'Protección de las comunicaciones', 'Perímetro seguro',
   'The organization shall establish a secure network perimeter using firewalls, DMZ architectures, and boundary protection devices to control traffic between internal networks and external networks, allowing only authorized communications.',
   'Perimeter security should include next-generation firewall capabilities and be aligned with the security architecture.',
   '["Firewall and perimeter security architecture","Firewall rule sets and reviews","DMZ documentation"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-com-2', 'ens-2022', 'mp.com.2', 'Medidas de Protección', 'Protección de las comunicaciones', 'Protección de la confidencialidad',
   'The organization shall protect the confidentiality of information in transit using encryption protocols appropriate to the data classification. VPNs, TLS, or equivalent mechanisms shall be used for communications over untrusted networks.',
   'Encryption protocols should use current standards and approved algorithms per CCN-STIC guidelines.',
   '["Encryption policy for communications","TLS/VPN configuration evidence","Certificate management records"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-com-3', 'ens-2022', 'mp.com.3', 'Medidas de Protección', 'Protección de las comunicaciones', 'Protección de la integridad y de la autenticidad',
   'The organization shall implement mechanisms to ensure the integrity and authenticity of communications, detecting unauthorized modifications and verifying the identity of communicating parties through digital signatures, MACs, or equivalent controls.',
   'Integrity protection should cover both data in transit and critical system communications.',
   '["Integrity protection mechanisms documentation","Digital signature deployment records","Communication authentication evidence"]',
   0.6, 'medium', datetime('now')),

  ('ens-2022-mp-com-4', 'ens-2022', 'mp.com.4', 'Medidas de Protección', 'Protección de las comunicaciones', 'Separación de flujos de información en la red',
   'The organization shall implement network segmentation to separate information flows based on their security requirements, using VLANs, firewalls, or other segregation mechanisms to prevent unauthorized lateral movement and limit blast radius of security incidents.',
   'Network segmentation should align with data classification and system categorization.',
   '["Network segmentation design","VLAN and firewall zone documentation","Segmentation verification test results"]',
   0.6, 'basic', datetime('now'));

-- Subdomain: Protección de los soportes de información [mp.si]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-si-1', 'ens-2022', 'mp.si.1', 'Medidas de Protección', 'Protección de los soportes de información', 'Etiquetado',
   'The organization shall label information storage media according to the classification of the information they contain, enabling appropriate handling, access control, and disposal procedures to be applied consistently.',
   'Labeling should be visible and durable, and digital media should use metadata tagging where physical labels are impractical.',
   '["Media labeling policy","Classification scheme documentation","Labeling compliance audit records"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-si-2', 'ens-2022', 'mp.si.2', 'Medidas de Protección', 'Protección de los soportes de información', 'Criptografía',
   'The organization shall apply cryptographic protection to information stored on removable media and portable devices using approved algorithms and key lengths. Encryption shall be mandatory for media containing classified or sensitive information.',
   'Encryption should comply with CCN-STIC cryptographic guidelines.',
   '["Media encryption policy","Encrypted media inventory","Encryption configuration evidence"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-si-3', 'ens-2022', 'mp.si.3', 'Medidas de Protección', 'Protección de los soportes de información', 'Custodia',
   'The organization shall implement controls for the secure custody of information storage media, including secure storage locations, access restrictions, environmental protection, and inventory management to prevent loss, theft, or unauthorized access.',
   'Media custody should be documented with chain-of-custody records for sensitive information.',
   '["Media custody procedures","Secure storage facility documentation","Media inventory and audit records"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-si-4', 'ens-2022', 'mp.si.4', 'Medidas de Protección', 'Protección de los soportes de información', 'Transporte',
   'The organization shall protect information storage media during transport using appropriate physical and cryptographic controls, secure packaging, chain-of-custody documentation, and authorized courier services for sensitive information.',
   'Transport security measures should be proportionate to the classification of the information.',
   '["Media transport policy","Chain-of-custody records","Authorized courier service agreements"]',
   0.6, 'medium', datetime('now')),

  ('ens-2022-mp-si-5', 'ens-2022', 'mp.si.5', 'Medidas de Protección', 'Protección de los soportes de información', 'Borrado y destrucción',
   'The organization shall implement secure erasure and destruction procedures for information storage media that are no longer needed, using methods proportionate to the information classification to prevent recovery of sensitive data.',
   'Destruction methods should comply with recognized standards (e.g., NIST SP 800-88 or equivalent).',
   '["Media destruction policy","Destruction certificates","Destruction method verification records"]',
   0.6, 'basic', datetime('now'));

-- Subdomain: Protección de las aplicaciones informáticas [mp.sw]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-sw-1', 'ens-2022', 'mp.sw.1', 'Medidas de Protección', 'Protección de las aplicaciones informáticas', 'Desarrollo de aplicaciones',
   'The organization shall implement a secure software development lifecycle (SSDLC) that integrates security at every phase including requirements, design, coding, testing, and deployment. Security requirements shall be derived from system categorization and risk analysis.',
   'Development practices should include threat modeling, secure coding standards, code review, and static/dynamic analysis.',
   '["SSDLC documentation","Secure coding guidelines","Security testing results per release"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-sw-2', 'ens-2022', 'mp.sw.2', 'Medidas de Protección', 'Protección de las aplicaciones informáticas', 'Aceptación y puesta en servicio',
   'The organization shall establish formal acceptance criteria and procedures for deploying applications into production, including security testing verification, configuration review, documentation validation, and sign-off by appropriate authority.',
   'Acceptance should verify that all security requirements have been met and residual risks are documented.',
   '["Acceptance criteria documentation","Pre-production security checklist","Deployment approval records"]',
   0.6, 'basic', datetime('now'));

-- Subdomain: Protección de la información [mp.info]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-info-1', 'ens-2022', 'mp.info.1', 'Medidas de Protección', 'Protección de la información', 'Datos de carácter personal',
   'The organization shall implement specific measures to protect personal data in accordance with the GDPR and Spanish LOPDGDD, including data minimization, purpose limitation, consent management, data subject rights procedures, and data protection impact assessments where required.',
   'Personal data protection should be coordinated with the Data Protection Officer (DPO).',
   '["Data protection policy","DPIA records","Data processing register","Data subject rights procedures"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-info-2', 'ens-2022', 'mp.info.2', 'Medidas de Protección', 'Protección de la información', 'Calificación de la información',
   'The organization shall classify all information according to its sensitivity and the potential impact of its compromise on confidentiality, integrity, and availability. Classification shall drive the selection of protective measures.',
   'Classification scheme should align with ENS categories (BASIC, MEDIUM, HIGH) and security dimensions.',
   '["Information classification policy","Classification guide","Classified information inventory"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-info-3', 'ens-2022', 'mp.info.3', 'Medidas de Protección', 'Protección de la información', 'Firma electrónica',
   'The organization shall use electronic signatures to ensure the authenticity and integrity of documents and transactions where required. Signature mechanisms shall be proportionate to the system category and comply with eIDAS and Spanish electronic signature regulations.',
   'Advanced or qualified electronic signatures should be used for high-assurance requirements.',
   '["Electronic signature policy","Signature infrastructure documentation","Certificate authority agreements"]',
   0.6, 'medium', datetime('now')),

  ('ens-2022-mp-info-4', 'ens-2022', 'mp.info.4', 'Medidas de Protección', 'Protección de la información', 'Sellos de tiempo',
   'The organization shall use trusted timestamping services to provide proof of existence and integrity of documents and transactions at specific points in time, supporting non-repudiation and regulatory compliance requirements.',
   'Timestamp services should use qualified trust service providers where required.',
   '["Timestamping policy","TSA service agreements","Timestamp verification procedures"]',
   0.6, 'medium', datetime('now')),

  ('ens-2022-mp-info-5', 'ens-2022', 'mp.info.5', 'Medidas de Protección', 'Protección de la información', 'Limpieza de documentos',
   'The organization shall implement procedures to remove hidden metadata, tracked changes, comments, and other embedded information from documents before external publication or distribution, preventing unintended information disclosure.',
   'Document sanitization should be automated where possible and verified before external release.',
   '["Document sanitization procedures","Metadata removal tool configuration","Publication review checklist"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-info-6', 'ens-2022', 'mp.info.6', 'Medidas de Protección', 'Protección de la información', 'Copias de seguridad',
   'The organization shall implement a backup strategy covering all critical information and systems, defining backup frequency, retention periods, storage locations, and encryption requirements. Backup restoration shall be tested regularly to ensure recoverability.',
   'Backup strategy should follow the 3-2-1 rule (3 copies, 2 media types, 1 offsite) and align with recovery objectives.',
   '["Backup policy","Backup execution logs","Restoration test records","Offsite storage documentation"]',
   0.6, 'basic', datetime('now'));

-- Subdomain: Protección de los servicios [mp.s]
INSERT OR IGNORE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, created_at)
VALUES
  ('ens-2022-mp-s-1', 'ens-2022', 'mp.s.1', 'Medidas de Protección', 'Protección de los servicios', 'Protección del correo electrónico',
   'The organization shall protect email services against threats including spam, phishing, malware, and data exfiltration through email filtering, authentication mechanisms (SPF, DKIM, DMARC), encryption for sensitive communications, and user awareness training.',
   'Email protection should include both inbound and outbound security controls.',
   '["Email security configuration (SPF/DKIM/DMARC)","Email filtering solution documentation","Email security incident reports"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-s-2', 'ens-2022', 'mp.s.2', 'Medidas de Protección', 'Protección de los servicios', 'Protección de servicios y aplicaciones web',
   'The organization shall protect web services and applications through secure architecture design, input validation, output encoding, secure session management, and deployment of web application firewalls. Regular vulnerability assessments and penetration testing shall be conducted.',
   'Web application security should follow OWASP Top 10 mitigations and CCN-STIC web security guides.',
   '["Web application security architecture","Vulnerability assessment reports","Penetration test reports","WAF logs and configuration"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-s-3', 'ens-2022', 'mp.s.3', 'Medidas de Protección', 'Protección de los servicios', 'Protección de la navegación web',
   'The organization shall implement controls to protect users during web browsing, including web content filtering, malicious site blocking, browser security configuration, and restrictions on downloading and executing unauthorized content.',
   'Web filtering should leverage threat intelligence and URL categorization services.',
   '["Web filtering policy and configuration","Browser security baseline","Web access logs and reports"]',
   0.6, 'basic', datetime('now')),

  ('ens-2022-mp-s-4', 'ens-2022', 'mp.s.4', 'Medidas de Protección', 'Protección de los servicios', 'Protección frente a la denegación de servicio',
   'The organization shall implement measures to protect critical services against denial-of-service (DoS/DDoS) attacks, including traffic analysis, rate limiting, content delivery networks, anti-DDoS services, and incident response procedures specific to availability attacks.',
   'DDoS protection should be proportionate to the service criticality and expected threat level.',
   '["DDoS protection architecture","Anti-DDoS service agreements","DDoS incident response procedures","Traffic baseline and anomaly detection configuration"]',
   0.6, 'basic', datetime('now'));
