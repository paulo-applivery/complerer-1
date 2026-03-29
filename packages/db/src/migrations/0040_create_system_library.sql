-- System library: predefined catalog of common enterprise tools
CREATE TABLE IF NOT EXISTS system_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  website TEXT,
  default_classification TEXT NOT NULL DEFAULT 'standard',
  default_sensitivity TEXT NOT NULL DEFAULT 'medium',
  icon_hint TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_syslib_category ON system_library(category);

-- Seed: Identity & Access Management
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_okta', 'Okta', 'identity', 'Identity and access management platform', 'Okta', 'okta.com', 'critical', 'high', 'key'),
('sl_azure_ad', 'Microsoft Entra ID', 'identity', 'Cloud identity and access management', 'Microsoft', 'entra.microsoft.com', 'critical', 'high', 'key'),
('sl_google_workspace', 'Google Workspace', 'identity', 'Cloud productivity and identity platform', 'Google', 'workspace.google.com', 'critical', 'high', 'key'),
('sl_onelogin', 'OneLogin', 'identity', 'Cloud-based identity management', 'OneLogin', 'onelogin.com', 'critical', 'high', 'key'),
('sl_jumpcloud', 'JumpCloud', 'identity', 'Open directory platform for identity management', 'JumpCloud', 'jumpcloud.com', 'critical', 'high', 'key'),
('sl_auth0', 'Auth0', 'identity', 'Authentication and authorization platform', 'Okta', 'auth0.com', 'critical', 'high', 'key'),
('sl_1password', '1Password', 'identity', 'Enterprise password and secrets management', '1Password', '1password.com', 'critical', 'high', 'key'),
('sl_lastpass', 'LastPass', 'identity', 'Password management and SSO', 'LastPass', 'lastpass.com', 'critical', 'high', 'key');

-- Seed: Cloud Infrastructure
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_aws', 'Amazon Web Services', 'cloud', 'Cloud computing platform', 'Amazon', 'aws.amazon.com', 'critical', 'high', 'cloud'),
('sl_azure', 'Microsoft Azure', 'cloud', 'Cloud computing platform', 'Microsoft', 'azure.microsoft.com', 'critical', 'high', 'cloud'),
('sl_gcp', 'Google Cloud Platform', 'cloud', 'Cloud computing platform', 'Google', 'cloud.google.com', 'critical', 'high', 'cloud'),
('sl_digitalocean', 'DigitalOcean', 'cloud', 'Cloud infrastructure provider', 'DigitalOcean', 'digitalocean.com', 'standard', 'medium', 'cloud'),
('sl_heroku', 'Heroku', 'cloud', 'Platform as a Service', 'Salesforce', 'heroku.com', 'standard', 'medium', 'cloud'),
('sl_vercel', 'Vercel', 'cloud', 'Frontend cloud platform', 'Vercel', 'vercel.com', 'standard', 'low', 'cloud'),
('sl_cloudflare', 'Cloudflare', 'cloud', 'Web performance and security platform', 'Cloudflare', 'cloudflare.com', 'critical', 'medium', 'cloud'),
('sl_netlify', 'Netlify', 'cloud', 'Web development and deployment platform', 'Netlify', 'netlify.com', 'standard', 'low', 'cloud');

-- Seed: DevOps & Development
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_github', 'GitHub', 'devops', 'Code hosting and version control platform', 'Microsoft', 'github.com', 'critical', 'high', 'code'),
('sl_gitlab', 'GitLab', 'devops', 'DevOps lifecycle platform', 'GitLab', 'gitlab.com', 'critical', 'high', 'code'),
('sl_bitbucket', 'Bitbucket', 'devops', 'Git code management and CI/CD', 'Atlassian', 'bitbucket.org', 'critical', 'high', 'code'),
('sl_jenkins', 'Jenkins', 'devops', 'Open source CI/CD automation server', 'Jenkins', 'jenkins.io', 'standard', 'medium', 'code'),
('sl_circleci', 'CircleCI', 'devops', 'Continuous integration and delivery', 'CircleCI', 'circleci.com', 'standard', 'medium', 'code'),
('sl_docker', 'Docker Hub', 'devops', 'Container image registry', 'Docker', 'hub.docker.com', 'standard', 'medium', 'code'),
('sl_terraform', 'Terraform Cloud', 'devops', 'Infrastructure as code platform', 'HashiCorp', 'app.terraform.io', 'critical', 'high', 'code'),
('sl_datadog', 'Datadog', 'devops', 'Cloud monitoring and observability', 'Datadog', 'datadoghq.com', 'standard', 'medium', 'code');

-- Seed: Communication & Collaboration
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_slack', 'Slack', 'communication', 'Business messaging and collaboration', 'Salesforce', 'slack.com', 'standard', 'medium', 'message'),
('sl_teams', 'Microsoft Teams', 'communication', 'Team collaboration and chat', 'Microsoft', 'teams.microsoft.com', 'standard', 'medium', 'message'),
('sl_zoom', 'Zoom', 'communication', 'Video conferencing platform', 'Zoom', 'zoom.us', 'standard', 'medium', 'message'),
('sl_notion', 'Notion', 'communication', 'Collaborative workspace and documentation', 'Notion', 'notion.so', 'standard', 'medium', 'message'),
('sl_confluence', 'Confluence', 'communication', 'Team workspace and documentation', 'Atlassian', 'atlassian.com/confluence', 'standard', 'medium', 'message'),
('sl_gmail', 'Gmail / Google Mail', 'communication', 'Business email', 'Google', 'mail.google.com', 'standard', 'high', 'message'),
('sl_outlook', 'Microsoft Outlook', 'communication', 'Business email and calendar', 'Microsoft', 'outlook.office.com', 'standard', 'high', 'message');

-- Seed: Project Management
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_jira', 'Jira', 'project', 'Issue tracking and project management', 'Atlassian', 'atlassian.com/jira', 'standard', 'medium', 'task'),
('sl_asana', 'Asana', 'project', 'Work management platform', 'Asana', 'asana.com', 'standard', 'low', 'task'),
('sl_linear', 'Linear', 'project', 'Issue tracking for software teams', 'Linear', 'linear.app', 'standard', 'low', 'task'),
('sl_monday', 'Monday.com', 'project', 'Work operating system', 'Monday', 'monday.com', 'standard', 'low', 'task'),
('sl_trello', 'Trello', 'project', 'Visual project management', 'Atlassian', 'trello.com', 'low', 'low', 'task'),
('sl_clickup', 'ClickUp', 'project', 'All-in-one productivity platform', 'ClickUp', 'clickup.com', 'standard', 'low', 'task');

-- Seed: Security & Compliance
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_crowdstrike', 'CrowdStrike Falcon', 'security', 'Endpoint detection and response', 'CrowdStrike', 'crowdstrike.com', 'critical', 'high', 'shield'),
('sl_sentinelone', 'SentinelOne', 'security', 'Autonomous endpoint security', 'SentinelOne', 'sentinelone.com', 'critical', 'high', 'shield'),
('sl_snyk', 'Snyk', 'security', 'Developer-first security platform', 'Snyk', 'snyk.io', 'standard', 'medium', 'shield'),
('sl_vanta', 'Vanta', 'security', 'Automated security and compliance', 'Vanta', 'vanta.com', 'standard', 'medium', 'shield'),
('sl_splunk', 'Splunk', 'security', 'SIEM and observability platform', 'Cisco', 'splunk.com', 'critical', 'high', 'shield'),
('sl_pagerduty', 'PagerDuty', 'security', 'Incident management platform', 'PagerDuty', 'pagerduty.com', 'standard', 'medium', 'shield'),
('sl_qualys', 'Qualys', 'security', 'Vulnerability management and compliance', 'Qualys', 'qualys.com', 'standard', 'high', 'shield');

-- Seed: Data & Analytics
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_snowflake', 'Snowflake', 'data', 'Cloud data warehouse', 'Snowflake', 'snowflake.com', 'critical', 'high', 'database'),
('sl_bigquery', 'BigQuery', 'data', 'Serverless data warehouse', 'Google', 'cloud.google.com/bigquery', 'critical', 'high', 'database'),
('sl_redshift', 'Amazon Redshift', 'data', 'Cloud data warehouse', 'Amazon', 'aws.amazon.com/redshift', 'critical', 'high', 'database'),
('sl_tableau', 'Tableau', 'data', 'Business intelligence and analytics', 'Salesforce', 'tableau.com', 'standard', 'medium', 'database'),
('sl_looker', 'Looker', 'data', 'Business intelligence platform', 'Google', 'looker.com', 'standard', 'medium', 'database'),
('sl_segment', 'Segment', 'data', 'Customer data platform', 'Twilio', 'segment.com', 'critical', 'high', 'database'),
('sl_mongodb', 'MongoDB Atlas', 'data', 'Cloud database service', 'MongoDB', 'mongodb.com', 'critical', 'high', 'database');

-- Seed: CRM & Sales
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_salesforce', 'Salesforce', 'crm', 'CRM and business platform', 'Salesforce', 'salesforce.com', 'critical', 'high', 'users'),
('sl_hubspot', 'HubSpot', 'crm', 'CRM, marketing, and sales platform', 'HubSpot', 'hubspot.com', 'standard', 'medium', 'users'),
('sl_zendesk', 'Zendesk', 'crm', 'Customer service and support platform', 'Zendesk', 'zendesk.com', 'standard', 'medium', 'users'),
('sl_intercom', 'Intercom', 'crm', 'Customer messaging platform', 'Intercom', 'intercom.com', 'standard', 'medium', 'users'),
('sl_freshdesk', 'Freshdesk', 'crm', 'Customer support software', 'Freshworks', 'freshdesk.com', 'standard', 'medium', 'users');

-- Seed: HR & Finance
INSERT INTO system_library (id, name, category, description, vendor, website, default_classification, default_sensitivity, icon_hint) VALUES
('sl_workday', 'Workday', 'hr', 'Human capital management', 'Workday', 'workday.com', 'critical', 'high', 'users'),
('sl_bamboohr', 'BambooHR', 'hr', 'HR software for SMBs', 'BambooHR', 'bamboohr.com', 'critical', 'high', 'users'),
('sl_rippling', 'Rippling', 'hr', 'Workforce management platform', 'Rippling', 'rippling.com', 'critical', 'high', 'users'),
('sl_gusto', 'Gusto', 'hr', 'Payroll and HR platform', 'Gusto', 'gusto.com', 'critical', 'high', 'users'),
('sl_quickbooks', 'QuickBooks', 'hr', 'Accounting and financial management', 'Intuit', 'quickbooks.intuit.com', 'critical', 'high', 'users'),
('sl_stripe', 'Stripe', 'hr', 'Payment processing platform', 'Stripe', 'stripe.com', 'critical', 'high', 'users'),
('sl_brex', 'Brex', 'hr', 'Corporate credit cards and spend management', 'Brex', 'brex.com', 'critical', 'high', 'users');
