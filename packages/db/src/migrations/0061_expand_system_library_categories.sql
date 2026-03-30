-- Expand system library: fix miscategorizations, add finance/marketing/design/productivity/business/monitoring/support

-- Fix: move finance tools out of 'hr' into new 'finance' category
UPDATE system_library SET category = 'finance' WHERE id IN ('sl_quickbooks', 'sl_stripe', 'sl_brex');

-- Seed: Finance & Accounting
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_xero',        'Xero',           'finance', 'Online accounting software',                     'Xero',       'xero.com',          'critical', 'high',   'users'),
('sl_netsuite',    'NetSuite',       'finance', 'Cloud ERP and financial management',              'Oracle',     'netsuite.com',      'critical', 'high',   'users'),
('sl_paddle',      'Paddle',         'finance', 'Revenue delivery platform for SaaS',              'Paddle',     'paddle.com',        'critical', 'high',   'users'),
('sl_chargebee',   'Chargebee',      'finance', 'Subscription billing and revenue management',     'Chargebee',  'chargebee.com',     'critical', 'high',   'users'),
('sl_ramp',        'Ramp',           'finance', 'Corporate cards and expense management',           'Ramp',       'ramp.com',          'critical', 'high',   'users'),
('sl_expensify',   'Expensify',      'finance', 'Expense management and reporting',                'Expensify',  'expensify.com',     'standard', 'medium', 'users'),
('sl_bill',        'Bill.com',       'finance', 'Accounts payable and receivable automation',      'Bill.com',   'bill.com',          'critical', 'high',   'users'),
('sl_mercury',     'Mercury',        'finance', 'Business banking for startups',                   'Mercury',    'mercury.com',       'critical', 'high',   'users'),
('sl_plaid',       'Plaid',          'finance', 'Financial data connectivity platform',            'Plaid',      'plaid.com',         'critical', 'high',   'users'),
('sl_adyen',       'Adyen',          'finance', 'Global payment processing platform',              'Adyen',      'adyen.com',         'critical', 'high',   'users');

-- Seed: Marketing & Growth
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_mailchimp',       'Mailchimp',        'marketing', 'Email marketing platform',                            'Intuit',        'mailchimp.com',          'standard', 'medium', 'message'),
('sl_activecampaign',  'ActiveCampaign',   'marketing', 'Customer experience automation',                      'ActiveCampaign','activecampaign.com',      'standard', 'medium', 'message'),
('sl_marketo',         'Marketo Engage',   'marketing', 'B2B marketing automation platform',                   'Adobe',         'marketo.com',             'standard', 'medium', 'message'),
('sl_google_analytics','Google Analytics', 'marketing', 'Web analytics and reporting',                         'Google',        'analytics.google.com',    'standard', 'low',    'database'),
('sl_mixpanel',        'Mixpanel',         'marketing', 'Product analytics and user behavior',                 'Mixpanel',      'mixpanel.com',            'standard', 'medium', 'database'),
('sl_amplitude',       'Amplitude',        'marketing', 'Digital analytics platform',                          'Amplitude',     'amplitude.com',           'standard', 'medium', 'database'),
('sl_klaviyo',         'Klaviyo',          'marketing', 'Email and SMS marketing for e-commerce',              'Klaviyo',       'klaviyo.com',             'standard', 'medium', 'message'),
('sl_brevo',           'Brevo',            'marketing', 'Email, SMS and marketing automation',                 'Brevo',         'brevo.com',               'standard', 'low',    'message'),
('sl_customer_io',     'Customer.io',      'marketing', 'Automated messaging platform',                        'Customer.io',   'customer.io',             'standard', 'medium', 'message'),
('sl_semrush',         'Semrush',          'marketing', 'SEO and competitive intelligence platform',           'Semrush',       'semrush.com',             'low',      'low',    'database'),
('sl_ahrefs',          'Ahrefs',           'marketing', 'SEO toolset and backlink analysis',                   'Ahrefs',        'ahrefs.com',              'low',      'low',    'database');

-- Seed: Design & Creative
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_figma',    'Figma',                  'design', 'Collaborative interface design tool',             'Figma',    'figma.com',            'standard', 'medium', 'code'),
('sl_sketch',   'Sketch',                 'design', 'Digital design platform for macOS',               'Sketch',   'sketch.com',           'standard', 'low',    'code'),
('sl_adobe_cc', 'Adobe Creative Cloud',   'design', 'Creative apps and services suite',                'Adobe',    'adobe.com',            'standard', 'medium', 'code'),
('sl_canva',    'Canva',                  'design', 'Online design and publishing platform',            'Canva',    'canva.com',            'low',      'low',    'code'),
('sl_framer',   'Framer',                 'design', 'Interactive prototyping and web design tool',      'Framer',   'framer.com',           'low',      'low',    'code'),
('sl_miro',     'Miro',                   'design', 'Online collaborative whiteboard platform',         'Miro',     'miro.com',             'standard', 'medium', 'code'),
('sl_zeplin',   'Zeplin',                 'design', 'Design handoff and collaboration for teams',       'Zeplin',   'zeplin.io',            'standard', 'low',    'code'),
('sl_invision', 'InVision',               'design', 'Digital product design platform',                 'InVision', 'invisionapp.com',      'standard', 'low',    'code'),
('sl_lottiefiles','LottieFiles',          'design', 'Animation workflow platform',                      'LottieFiles','lottiefiles.com',   'low',      'low',    'code');

-- Seed: Productivity & Collaboration
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_ms365',       'Microsoft 365',       'productivity', 'Cloud productivity suite',                        'Microsoft', 'microsoft.com/microsoft-365', 'standard', 'high',   'message'),
('sl_airtable',    'Airtable',            'productivity', 'No-code database and spreadsheet hybrid',         'Airtable',  'airtable.com',                'standard', 'medium', 'database'),
('sl_coda',        'Coda',                'productivity', 'All-in-one doc and workflow platform',            'Coda',      'coda.io',                     'standard', 'medium', 'message'),
('sl_loom',        'Loom',                'productivity', 'Async video messaging for teams',                 'Loom',      'loom.com',                    'standard', 'low',    'message'),
('sl_calendly',    'Calendly',            'productivity', 'Online scheduling automation',                    'Calendly',  'calendly.com',                'low',      'low',    'task'),
('sl_grammarly',   'Grammarly',           'productivity', 'AI writing assistant',                            'Grammarly', 'grammarly.com',               'standard', 'medium', 'message'),
('sl_zapier',      'Zapier',              'productivity', 'No-code workflow automation platform',            'Zapier',    'zapier.com',                  'standard', 'medium', 'code'),
('sl_make',        'Make (Integromat)',    'productivity', 'Visual automation and integration platform',      'Make',      'make.com',                    'standard', 'medium', 'code'),
('sl_obsidian',    'Obsidian',            'productivity', 'Knowledge base and note-taking app',              'Obsidian',  'obsidian.md',                 'low',      'low',    'message'),
('sl_roam',        'Roam Research',       'productivity', 'Networked note-taking tool',                      'Roam',      'roamresearch.com',            'low',      'low',    'message');

-- Seed: Business Operations
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_docusign',    'DocuSign',            'business', 'Electronic signature and agreement cloud',        'DocuSign',   'docusign.com',    'critical', 'high',   'task'),
('sl_hellosign',   'Dropbox Sign',        'business', 'Electronic signature solution',                   'Dropbox',    'sign.dropbox.com','standard', 'medium', 'task'),
('sl_pandadoc',    'PandaDoc',            'business', 'Document automation and e-sign platform',         'PandaDoc',   'pandadoc.com',    'standard', 'medium', 'task'),
('sl_dropbox',     'Dropbox',             'business', 'Cloud file storage and sharing',                  'Dropbox',    'dropbox.com',     'standard', 'medium', 'database'),
('sl_box',         'Box',                 'business', 'Enterprise cloud content management',             'Box',        'box.com',         'critical', 'high',   'database'),
('sl_sharepoint',  'SharePoint',          'business', 'Collaboration and document management',           'Microsoft',  'sharepoint.com',  'standard', 'high',   'database'),
('sl_google_drive','Google Drive',        'business', 'Cloud file storage and sharing',                  'Google',     'drive.google.com','standard', 'medium', 'database'),
('sl_typeform',    'Typeform',            'business', 'Online form and survey builder',                  'Typeform',   'typeform.com',    'standard', 'low',    'task'),
('sl_surveymonkey','SurveyMonkey',        'business', 'Online survey and feedback platform',             'Momentive',  'surveymonkey.com','standard', 'low',    'task'),
('sl_docebo',      'Docebo',              'business', 'Learning management system',                      'Docebo',     'docebo.com',      'standard', 'medium', 'task');

-- Seed: Monitoring & Observability
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_newrelic',    'New Relic',           'monitoring', 'Full-stack observability platform',             'New Relic',  'newrelic.com',      'standard', 'medium', 'shield'),
('sl_grafana',     'Grafana',             'monitoring', 'Metrics visualization and alerting',            'Grafana',    'grafana.com',       'standard', 'medium', 'shield'),
('sl_prometheus',  'Prometheus',          'monitoring', 'Open-source monitoring and alerting',           'CNCF',       'prometheus.io',     'standard', 'medium', 'shield'),
('sl_elastic',     'Elastic (ELK)',       'monitoring', 'Search, observability, and security platform',  'Elastic',    'elastic.co',        'standard', 'high',   'shield'),
('sl_honeycomb',   'Honeycomb',           'monitoring', 'Observability for production systems',          'Honeycomb',  'honeycomb.io',      'standard', 'medium', 'shield'),
('sl_sentry',      'Sentry',             'monitoring', 'Application performance monitoring and errors',  'Sentry',     'sentry.io',         'standard', 'medium', 'shield'),
('sl_dynatrace',   'Dynatrace',           'monitoring', 'AI-powered observability platform',             'Dynatrace',  'dynatrace.com',     'standard', 'medium', 'shield'),
('sl_statuspage',  'Statuspage',          'monitoring', 'Incident communication and status pages',       'Atlassian',  'atlassian.com/statuspage','low', 'low',   'shield'),
('sl_opsgenie',    'Opsgenie',            'monitoring', 'Incident management and on-call scheduling',    'Atlassian',  'atlassian.com/opsgenie', 'standard', 'medium', 'shield'),
('sl_victorops',   'VictorOps',           'monitoring', 'On-call scheduling and incident management',    'Splunk',     'victorops.com',     'standard', 'medium', 'shield');

-- Seed: Customer Support
INSERT OR IGNORE INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_front',        'Front',             'support', 'Shared inbox and customer support platform',     'Front',      'front.com',         'standard', 'medium', 'message'),
('sl_helpscout',    'Help Scout',        'support', 'Customer support and help desk software',        'Help Scout', 'helpscout.com',     'standard', 'medium', 'message'),
('sl_drift',        'Drift',             'support', 'Conversational marketing and sales platform',    'Salesloft',  'drift.com',         'standard', 'medium', 'message'),
('sl_crisp',        'Crisp',             'support', 'Customer messaging platform',                    'Crisp',      'crisp.chat',        'standard', 'low',    'message'),
('sl_freshservice', 'Freshservice',      'support', 'IT service management platform',                 'Freshworks', 'freshservice.com',  'standard', 'medium', 'task'),
('sl_servicedesk',  'Jira Service Mgmt', 'support', 'IT service management and helpdesk',             'Atlassian',  'atlassian.com/jira/service-management', 'standard', 'medium', 'task'),
('sl_livechat',     'LiveChat',          'support', 'Live chat software for customer service',        'LiveChat',   'livechat.com',      'standard', 'low',    'message'),
('sl_talkdesk',     'Talkdesk',          'support', 'Cloud contact center platform',                  'Talkdesk',   'talkdesk.com',      'standard', 'medium', 'message');
