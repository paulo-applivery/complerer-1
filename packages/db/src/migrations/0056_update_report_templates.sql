-- Update all 6 report templates with full professional content
-- Following Big 4 / ISACA / ISO 19011 best practices

-- ═══════════════════════════════════════════════════════════════════════════
-- SOC 2 Type II
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE report_template_library SET content = '{
  "type": "doc",
  "content": [
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"SOC 2 Type II Report"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Independent Service Auditor''s Report on Controls Relevant to Security, Availability, Processing Integrity, Confidentiality, and Privacy"}]},
    {"type":"horizontalRule"},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Report Information"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Field"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Details"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Service Organization"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Address"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.address","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Audit Period"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_start","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":" to "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_end","variableType":"date","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Auditor / Firm"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.auditor","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" — "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.auditor_firm","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Report Date"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.date","variableType":"date","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Report Classification"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Confidential — Restricted Distribution"}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Table of Contents"}]},
    {"type":"orderedList","content":[
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Independent Service Auditor''s Report (Opinion Letter)"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Management''s Assertion"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"System Description"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Trust Services Criteria & Control Testing Results"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Findings and Exceptions"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Complementary User Entity Controls (CUECs)"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Appendices"}]}]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section I — Independent Service Auditor''s Report"}]},
    {"type":"paragraph","content":[{"type":"text","text":"To the Management of "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":":"}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Scope"}]},
    {"type":"paragraph","content":[{"type":"text","text":"We have examined "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":"''s description of its system and the suitability of the design and operating effectiveness of controls relevant to the "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.scope","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" trust services criteria throughout the period "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_start","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":" to "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_end","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":"."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Service Organization''s Responsibilities"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Management is responsible for providing the system description, having a reasonable basis for the assertion, and selecting the criteria and maintaining effective internal controls over the system."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Service Auditor''s Responsibilities"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Our responsibility is to express an opinion on the description, the suitability of design, and the operating effectiveness of the controls based on our examination. We conducted our examination in accordance with SSAE No. 18."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Opinion"}]},
    {"type":"paragraph","content":[{"type":"text","text":"In our opinion, in all material respects, the description fairly presents the system as designed and implemented throughout the examination period. The controls were suitably designed and operated effectively to provide reasonable assurance that the service commitments and system requirements were achieved."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section II — Management''s Assertion"}]},
    {"type":"paragraph","content":[{"type":"text","text":"We, the management of "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":", assert that the accompanying description of our system fairly presents our system as designed and implemented during the period "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_start","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":" to "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_end","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":". The controls stated in the description were suitably designed and operated effectively to meet the applicable trust services criteria."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section III — System Description"}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Company Overview"}]},
    {"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" provides [describe services]. The company has been operating since [year] and serves [customer types]."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Infrastructure"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe the cloud infrastructure, data centers, network architecture, and physical security measures."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Software"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe the application stack, databases, middleware, and third-party integrations."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"People"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe organizational structure, key personnel, roles and responsibilities, hiring practices, and training programs."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Procedures"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe operational procedures, change management, incident response, and business continuity."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Data"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe data classification, data flows, encryption, retention, and disposal practices."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section IV — Trust Services Criteria & Control Testing Results"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The following table presents the trust services criteria, related controls, test procedures, and test results for the examination period."}]},
    {"type":"evidenceTable","attrs":{"controlIds":[],"columns":["name","type","status","date"],"filterStatus":"all","maxRows":100}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section V — Findings and Exceptions"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The following findings and exceptions were identified during the examination period. Each finding is presented with its condition, criteria, cause, effect, and recommendation."}]},
    {"type":"findingCard","attrs":{"mode":"inline","severity":"medium","title":"[Finding Title]","condition":"Describe the condition observed.","criteria":"Describe the applicable criteria or standard.","cause":"Describe the root cause.","effect":"Describe the actual or potential effect.","recommendation":"Describe the recommended remediation."}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section VI — Complementary User Entity Controls (CUECs)"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The following complementary user entity controls should be implemented by user entities to achieve the trust services criteria:"}]},
    {"type":"bulletList","content":[
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Users should implement strong authentication mechanisms including multi-factor authentication."}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Users should restrict access to authorized personnel only and review access periodically."}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Users should maintain their own business continuity and disaster recovery plans."}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Users should report suspected security incidents promptly."}]}]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section VII — Appendices"}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Appendix A: Glossary of Terms"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define key terms used throughout this report."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Appendix B: Personnel Involved"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Name"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Role"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Organization"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Responsibility"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Name]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Lead Auditor"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.auditor_firm","variableType":"text","displayMode":"placeholder"}}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Examination and opinion"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Name]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"CISO / Security Lead"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Security oversight and control owner"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Name]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"CTO / Engineering Lead"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Technical controls and infrastructure"}]}]}
      ]}
    ]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Appendix C: Distribution List"}]},
    {"type":"paragraph","content":[{"type":"text","text":"This report is intended solely for the use of "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":", user entities, and prospective user entities. It is not intended and should not be used by anyone other than these specified parties."}]}
  ]
}', updated_at = '2025-06-01T00:00:00.000Z'
WHERE id = 'rt_soc2_type2';

-- ═══════════════════════════════════════════════════════════════════════════
-- ISO 27001
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE report_template_library SET content = '{
  "type": "doc",
  "content": [
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"ISO/IEC 27001:2022 Audit Report"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Information Security Management System — Certification Audit Report"}]},
    {"type":"horizontalRule"},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Audit Information"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Field"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Details"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Organization"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Certification Body"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.cert_body","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Lead Auditor"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.auditor","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Audit Period"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_start","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":" to "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_end","variableType":"date","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Audit Type"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Initial Certification / Surveillance / Recertification"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Standard"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"ISO/IEC 27001:2022"}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"1. ISMS Scope"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The scope of the Information Security Management System covers: "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.scope","variableType":"text","displayMode":"placeholder"}}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1.1 Organizational Context"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe internal and external issues relevant to the ISMS, interested parties, and their requirements."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1.2 Scope Boundaries"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Define physical locations, organizational units, technologies, and interfaces included/excluded."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"2. Audit Methodology"}]},
    {"type":"paragraph","content":[{"type":"text","text":"This audit was conducted in accordance with ISO 19011:2018 guidelines. The methodology included document review, interviews with key personnel, observation of processes, and sampling of records and evidence."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"2.1 Audit Team"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Name"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Role"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Qualifications"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.auditor","variableType":"text","displayMode":"placeholder"}}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Lead Auditor"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"ISO 27001 Lead Auditor, CISA"}]}]}
      ]}
    ]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"2.2 Auditee Representatives"}]},
    {"type":"paragraph","content":[{"type":"text","text":"List key personnel from "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" involved in the audit: CISO, IT Director, DPO, HR Manager, etc."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"3. Clause 4-10 Assessment"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of conformity against ISO 27001:2022 mandatory clauses."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Clause 4: Context of the Organization"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of understanding external/internal issues, interested parties, and ISMS scope definition."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Clause 5: Leadership"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of top management commitment, information security policy, and roles/responsibilities."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Clause 6: Planning"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of risk assessment methodology, risk treatment plan, and information security objectives."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Clause 7: Support"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of resources, competence, awareness, communication, and documented information."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Clause 8: Operation"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of operational planning, risk assessment execution, and risk treatment implementation."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Clause 9: Performance Evaluation"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of monitoring, measurement, internal audit program, and management review."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Clause 10: Improvement"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of nonconformity handling, corrective actions, and continual improvement."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"4. Annex A Controls Assessment"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of applicable Annex A controls from ISO 27001:2022 (93 controls across 4 themes)."}]},
    {"type":"evidenceTable","attrs":{"controlIds":[],"columns":["name","type","status","date"],"filterStatus":"all","maxRows":100}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"5. Nonconformities"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The following nonconformities were identified during the audit."}]},
    {"type":"findingCard","attrs":{"mode":"inline","severity":"high","title":"[Nonconformity Title]","condition":"Describe the nonconformity observed.","criteria":"Reference the ISO 27001 clause or Annex A control.","cause":"Describe the root cause.","effect":"Describe the impact on the ISMS.","recommendation":"Describe the required corrective action."}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"6. Observations & Opportunities for Improvement"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The following observations were noted as opportunities for improvement (not nonconformities)."}]},
    {"type":"bulletList","content":[
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"[Observation 1]"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"[Observation 2]"}]}]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"7. Certification Recommendation"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Based on the audit findings, the audit team recommends [GRANT / CONDITIONAL / WITHHOLD] certification of "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":"''s ISMS to ISO/IEC 27001:2022."}]},
    {"type":"paragraph","content":[{"type":"text","text":"Conditions (if applicable): All major nonconformities must be addressed within 90 days with evidence of corrective action."}]}
  ]
}', updated_at = '2025-06-01T00:00:00.000Z'
WHERE id = 'rt_iso27001';

-- ═══════════════════════════════════════════════════════════════════════════
-- GDPR DPIA
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE report_template_library SET content = '{
  "type": "doc",
  "content": [
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Data Protection Impact Assessment (DPIA)"}]},
    {"type":"paragraph","content":[{"type":"text","text":"In accordance with Article 35 of the General Data Protection Regulation (EU) 2016/679"}]},
    {"type":"horizontalRule"},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Assessment Overview"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Field"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Details"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Organization"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Processing Activity"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"processing.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"DPO"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"dpo.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Assessment Date"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.date","variableType":"date","displayMode":"placeholder"}}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"1. Processing Description"}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1.1 Purpose of Processing"}]},
    {"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"processing.purpose","variableType":"text","displayMode":"placeholder"}}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1.2 Categories of Data Subjects"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Describe the categories of individuals whose data is processed (employees, customers, minors, etc.)."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1.3 Categories of Personal Data"}]},
    {"type":"paragraph","content":[{"type":"text","text":"List the types of personal data processed, including any special categories (Art. 9) or criminal data (Art. 10)."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1.4 Recipients & Transfers"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Identify data recipients, processors, and any international transfers outside the EEA."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"1.5 Retention Period"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Specify how long personal data will be retained and the criteria for determining retention periods."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"2. Necessity & Proportionality Assessment"}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"2.1 Legal Basis"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Identify the lawful basis under Article 6 (and Article 9 if applicable)."}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"2.2 Necessity"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Explain why the processing is necessary to achieve the stated purpose. Could the purpose be achieved with less data or less intrusive means?"}]},
    {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"2.3 Proportionality"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assess whether the processing is proportionate to the purpose. Consider data minimisation, storage limitation, and purpose limitation principles."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"3. Risk Assessment"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Identify and assess risks to the rights and freedoms of data subjects."}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Risk"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Likelihood"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Impact"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Risk Level"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Mitigation"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Unauthorized access to personal data"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Medium"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"High"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"High"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Access controls, encryption, monitoring"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Data breach / loss"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Low"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"High"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Medium"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Encryption at rest, backups, incident response"}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"4. Mitigating Measures"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The following technical and organisational measures are implemented to mitigate identified risks:"}]},
    {"type":"bulletList","content":[
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Encryption of personal data in transit and at rest"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Role-based access controls with least privilege principle"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Regular security testing and vulnerability assessments"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Data processing agreements with all sub-processors"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Incident response and breach notification procedures"}]}]},
      {"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Privacy by design and by default principles applied"}]}]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"5. DPO Consultation"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The Data Protection Officer ("},{"type":"variablePlaceholder","attrs":{"variableKey":"dpo.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":") was consulted on this DPIA and provided the following recommendations:"}]},
    {"type":"paragraph","content":[{"type":"text","text":"[DPO recommendations and comments]"}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"6. Conclusion & Decision"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Based on this assessment, the residual risk level after implementing mitigating measures is [LOW / MEDIUM / HIGH]. The processing [MAY / MAY NOT] proceed. If residual risk remains high, consultation with the supervisory authority under Article 36 is required."}]},
    {"type":"paragraph","content":[{"type":"text","text":"Signed by: _________________________ Date: _________________________"}]},
    {"type":"paragraph","content":[{"type":"text","text":"DPO approval: _________________________ Date: _________________________"}]}
  ]
}', updated_at = '2025-06-01T00:00:00.000Z'
WHERE id = 'rt_gdpr_dpia';

-- ═══════════════════════════════════════════════════════════════════════════
-- ENS
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE report_template_library SET content = '{
  "type": "doc",
  "content": [
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Informe de Conformidad — Esquema Nacional de Seguridad"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Real Decreto 311/2022 — Evaluacion del nivel de conformidad con el ENS"}]},
    {"type":"horizontalRule"},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Datos del Informe"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Campo"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Detalle"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Organizacion"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Categoria ENS"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.category","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Periodo de evaluacion"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_start","variableType":"date","displayMode":"placeholder"}},{"type":"text","text":" a "},{"type":"variablePlaceholder","attrs":{"variableKey":"audit.period_end","variableType":"date","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Auditor"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.auditor","variableType":"text","displayMode":"placeholder"}}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"1. Determinacion de la Categoria"}]},
    {"type":"paragraph","content":[{"type":"text","text":"La categoria del sistema se determina en funcion del analisis de las dimensiones de seguridad (disponibilidad, autenticidad, integridad, confidencialidad y trazabilidad) y el impacto que tendria un incidente en cada una."}]},
    {"type":"paragraph","content":[{"type":"text","text":"Categoria asignada: "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.category","variableType":"text","displayMode":"placeholder"}}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"2. Evaluacion de Medidas de Seguridad"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Evaluacion de las medidas de seguridad aplicables segun el Anexo II del RD 311/2022 para la categoria asignada."}]},
    {"type":"evidenceTable","attrs":{"controlIds":[],"columns":["name","type","status","date"],"filterStatus":"all","maxRows":100}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"3. Analisis de Brechas"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Identificacion de brechas entre el estado actual de seguridad y los requisitos del ENS para la categoria asignada."}]},
    {"type":"findingCard","attrs":{"mode":"inline","severity":"medium","title":"[Brecha Identificada]","condition":"Descripcion de la situacion actual.","criteria":"Requisito ENS aplicable.","cause":"Causa raiz de la brecha.","effect":"Impacto potencial.","recommendation":"Accion correctiva recomendada."}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"4. Nivel de Conformidad y Recomendacion"}]},
    {"type":"paragraph","content":[{"type":"text","text":"En base a la evaluacion realizada, el nivel de conformidad de "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" con el Esquema Nacional de Seguridad es [CONFORME / CONFORME CON OBSERVACIONES / NO CONFORME]."}]},
    {"type":"paragraph","content":[{"type":"text","text":"Se recomienda [OTORGAR / CONDICIONAR / DENEGAR] la certificacion de conformidad con el ENS en categoria "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.category","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":"."}]}
  ]
}', updated_at = '2025-06-01T00:00:00.000Z'
WHERE id = 'rt_ens';

-- ═══════════════════════════════════════════════════════════════════════════
-- Risk Assessment
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE report_template_library SET content = '{
  "type": "doc",
  "content": [
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Risk Assessment Report"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Comprehensive Information Security Risk Assessment following ISO 31000 methodology"}]},
    {"type":"horizontalRule"},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Assessment Information"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Field"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Details"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Organization"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Scope"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.scope","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Date"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.date","variableType":"date","displayMode":"placeholder"}}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"1. Scope & Methodology"}]},
    {"type":"paragraph","content":[{"type":"text","text":"This risk assessment follows the ISO 31000:2018 framework. The methodology includes asset identification, threat analysis, vulnerability assessment, impact analysis, and risk evaluation using a 5x5 risk matrix."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"2. Asset Inventory"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Critical information assets identified within scope:"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Asset"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Category"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Owner"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Classification"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Asset Name]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Data/System/Process]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Owner]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Confidential/Internal/Public]"}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"3. Threat Analysis"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Identified threats and vulnerabilities applicable to the assessed assets."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"4. Risk Scoring & Prioritization"}]},
    {"type":"riskHeatmap","attrs":{"riskSource":"project","likelihoodScale":5,"impactScale":5}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"5. Risk Treatment Plan"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Proposed treatment for identified high and critical risks."}]},
    {"type":"findingCard","attrs":{"mode":"inline","severity":"high","title":"[Risk Title]","condition":"Current risk exposure.","criteria":"Risk appetite threshold.","cause":"Threat-vulnerability pair.","effect":"Potential business impact.","recommendation":"Proposed treatment (mitigate/transfer/accept/avoid)."}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"6. Residual Risk Assessment"}]},
    {"type":"paragraph","content":[{"type":"text","text":"After applying proposed treatments, the residual risk levels are assessed and compared against the organization''s risk appetite."}]}
  ]
}', updated_at = '2025-06-01T00:00:00.000Z'
WHERE id = 'rt_risk_assessment';

-- ═══════════════════════════════════════════════════════════════════════════
-- Gap Analysis
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE report_template_library SET content = '{
  "type": "doc",
  "content": [
    {"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Gap Analysis Report"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Framework Compliance Gap Assessment — Current State vs Target Requirements"}]},
    {"type":"horizontalRule"},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Assessment Information"}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Field"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Details"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Organization"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Target Framework"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"framework.name","variableType":"text","displayMode":"placeholder"}}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Assessment Date"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"variablePlaceholder","attrs":{"variableKey":"audit.date","variableType":"date","displayMode":"placeholder"}}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"1. Executive Summary"}]},
    {"type":"paragraph","content":[{"type":"text","text":"This gap analysis assesses "},{"type":"variablePlaceholder","attrs":{"variableKey":"org.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":"''s current compliance posture against "},{"type":"variablePlaceholder","attrs":{"variableKey":"framework.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":" requirements. The assessment identifies areas of conformity, partial conformity, and non-conformity."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"2. Framework Requirements Baseline"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Summary of all applicable requirements from "},{"type":"variablePlaceholder","attrs":{"variableKey":"framework.name","variableType":"text","displayMode":"placeholder"}},{"type":"text","text":"."}]},
    {"type":"evidenceTable","attrs":{"controlIds":[],"columns":["name","type","status","date"],"filterStatus":"all","maxRows":100}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"3. Current State Assessment"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Assessment of the current implementation status for each requirement area."}]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"4. Identified Gaps"}]},
    {"type":"paragraph","content":[{"type":"text","text":"The following gaps were identified between current state and target requirements."}]},
    {"type":"findingCard","attrs":{"mode":"inline","severity":"medium","title":"[Gap Title]","condition":"Current state of implementation.","criteria":"Target framework requirement.","cause":"Root cause of the gap.","effect":"Impact on compliance posture.","recommendation":"Remediation action required."}},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"5. Remediation Roadmap"}]},
    {"type":"paragraph","content":[{"type":"text","text":"Prioritized remediation plan with estimated timelines and resource requirements."}]},
    {"type":"table","content":[
      {"type":"tableRow","content":[
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Priority"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Gap"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Action"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Owner"}]}]},
        {"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Timeline"}]}]}
      ]},
      {"type":"tableRow","content":[
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"P1 — Critical"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Gap description]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Remediation action]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Owner]"}]}]},
        {"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"[Timeline]"}]}]}
      ]}
    ]},

    {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"6. Implementation Timeline"}]},
    {"type":"timeline","attrs":{"dataSource":"audit_activities","events":[
      {"date":"Month 1-2","label":"Critical gaps remediation","status":"pending"},
      {"date":"Month 3-4","label":"High priority gaps remediation","status":"pending"},
      {"date":"Month 5-6","label":"Medium priority gaps remediation","status":"pending"},
      {"date":"Month 7-8","label":"Evidence collection and documentation","status":"pending"},
      {"date":"Month 9","label":"Internal audit and readiness assessment","status":"pending"},
      {"date":"Month 10-12","label":"Certification audit","status":"pending"}
    ]}}
  ]
}', updated_at = '2025-06-01T00:00:00.000Z'
WHERE id = 'rt_gap_analysis';
