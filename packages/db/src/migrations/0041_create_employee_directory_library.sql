-- Employee directory library: common roles/departments/titles for enterprise organizations
CREATE TABLE IF NOT EXISTS employee_directory_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email_template TEXT,
  department TEXT NOT NULL,
  title TEXT,
  category TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_emplib_category ON employee_directory_library(category);
CREATE INDEX idx_emplib_department ON employee_directory_library(department);

-- Seed: Executive / C-Suite
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_ceo', 'Chief Executive Officer', 'Executive', 'CEO', 'executive', 'Company leader and strategic direction', 'ceo@'),
('el_cto', 'Chief Technology Officer', 'Executive', 'CTO', 'executive', 'Technology strategy and engineering leadership', 'cto@'),
('el_cfo', 'Chief Financial Officer', 'Executive', 'CFO', 'executive', 'Financial strategy and operations', 'cfo@'),
('el_ciso', 'Chief Information Security Officer', 'Executive', 'CISO', 'executive', 'Information security and risk management', 'ciso@'),
('el_coo', 'Chief Operating Officer', 'Executive', 'COO', 'executive', 'Operational strategy and execution', 'coo@'),
('el_cpo', 'Chief Product Officer', 'Executive', 'CPO', 'executive', 'Product vision and roadmap', 'cpo@');

-- Seed: Engineering
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_eng_vp', 'VP of Engineering', 'Engineering', 'VP Engineering', 'engineering', 'Engineering team leadership', NULL),
('el_eng_manager', 'Engineering Manager', 'Engineering', 'Engineering Manager', 'engineering', 'Technical team management', NULL),
('el_eng_sr', 'Senior Software Engineer', 'Engineering', 'Senior Engineer', 'engineering', 'Senior development and architecture', NULL),
('el_eng_mid', 'Software Engineer', 'Engineering', 'Software Engineer', 'engineering', 'Software development', NULL),
('el_eng_jr', 'Junior Software Engineer', 'Engineering', 'Junior Engineer', 'engineering', 'Entry-level development', NULL),
('el_eng_sre', 'Site Reliability Engineer', 'Engineering', 'SRE', 'engineering', 'Infrastructure and reliability', NULL),
('el_eng_devops', 'DevOps Engineer', 'Engineering', 'DevOps Engineer', 'engineering', 'CI/CD and infrastructure automation', NULL),
('el_eng_qa', 'QA Engineer', 'Engineering', 'QA Engineer', 'engineering', 'Quality assurance and testing', NULL),
('el_eng_data', 'Data Engineer', 'Engineering', 'Data Engineer', 'engineering', 'Data pipeline and infrastructure', NULL);

-- Seed: Security & Compliance
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_sec_head', 'Head of Security', 'Security', 'Head of Security', 'security', 'Security team leadership', NULL),
('el_sec_analyst', 'Security Analyst', 'Security', 'Security Analyst', 'security', 'Security monitoring and incident response', NULL),
('el_sec_engineer', 'Security Engineer', 'Security', 'Security Engineer', 'security', 'Security tooling and infrastructure', NULL),
('el_compliance_mgr', 'Compliance Manager', 'Compliance', 'Compliance Manager', 'security', 'Regulatory compliance management', NULL),
('el_compliance_analyst', 'Compliance Analyst', 'Compliance', 'Compliance Analyst', 'security', 'Compliance auditing and reporting', NULL),
('el_grc_analyst', 'GRC Analyst', 'Compliance', 'GRC Analyst', 'security', 'Governance, risk, and compliance', NULL);

-- Seed: IT & Operations
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_it_director', 'IT Director', 'IT', 'IT Director', 'it_ops', 'IT department leadership', NULL),
('el_it_manager', 'IT Manager', 'IT', 'IT Manager', 'it_ops', 'IT team management', NULL),
('el_it_admin', 'System Administrator', 'IT', 'Sys Admin', 'it_ops', 'System and server administration', NULL),
('el_it_helpdesk', 'IT Support Specialist', 'IT', 'IT Support', 'it_ops', 'End-user technical support', NULL),
('el_it_network', 'Network Administrator', 'IT', 'Network Admin', 'it_ops', 'Network infrastructure management', NULL),
('el_it_dba', 'Database Administrator', 'IT', 'DBA', 'it_ops', 'Database management and optimization', NULL);

-- Seed: Product & Design
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_prod_vp', 'VP of Product', 'Product', 'VP Product', 'product', 'Product team leadership', NULL),
('el_prod_mgr', 'Product Manager', 'Product', 'Product Manager', 'product', 'Product strategy and roadmap execution', NULL),
('el_prod_designer', 'Product Designer', 'Design', 'Product Designer', 'product', 'UX/UI design', NULL),
('el_prod_researcher', 'UX Researcher', 'Design', 'UX Researcher', 'product', 'User research and insights', NULL),
('el_prod_analyst', 'Product Analyst', 'Product', 'Product Analyst', 'product', 'Product metrics and analysis', NULL);

-- Seed: Sales & Marketing
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_sales_vp', 'VP of Sales', 'Sales', 'VP Sales', 'sales_marketing', 'Sales team leadership', NULL),
('el_sales_ae', 'Account Executive', 'Sales', 'Account Executive', 'sales_marketing', 'Enterprise sales', NULL),
('el_sales_sdr', 'Sales Development Rep', 'Sales', 'SDR', 'sales_marketing', 'Outbound sales development', NULL),
('el_sales_csm', 'Customer Success Manager', 'Customer Success', 'CSM', 'sales_marketing', 'Customer relationship management', NULL),
('el_mktg_vp', 'VP of Marketing', 'Marketing', 'VP Marketing', 'sales_marketing', 'Marketing team leadership', NULL),
('el_mktg_mgr', 'Marketing Manager', 'Marketing', 'Marketing Manager', 'sales_marketing', 'Marketing campaigns and strategy', NULL),
('el_mktg_content', 'Content Marketing Manager', 'Marketing', 'Content Manager', 'sales_marketing', 'Content strategy and creation', NULL);

-- Seed: HR & People
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_hr_vp', 'VP of People', 'People', 'VP People', 'hr_people', 'People and HR leadership', NULL),
('el_hr_mgr', 'HR Manager', 'People', 'HR Manager', 'hr_people', 'HR operations and employee relations', NULL),
('el_hr_recruiter', 'Recruiter', 'People', 'Recruiter', 'hr_people', 'Talent acquisition', NULL),
('el_hr_bp', 'HR Business Partner', 'People', 'HRBP', 'hr_people', 'Strategic HR partnering', NULL);

-- Seed: Finance & Legal
INSERT INTO employee_directory_library (id, name, department, title, category, description, email_template) VALUES
('el_fin_controller', 'Financial Controller', 'Finance', 'Controller', 'finance_legal', 'Financial reporting and controls', NULL),
('el_fin_accountant', 'Accountant', 'Finance', 'Accountant', 'finance_legal', 'General accounting', NULL),
('el_fin_analyst', 'Financial Analyst', 'Finance', 'Financial Analyst', 'finance_legal', 'Financial planning and analysis', NULL),
('el_legal_counsel', 'Legal Counsel', 'Legal', 'Legal Counsel', 'finance_legal', 'Legal advisory and contracts', NULL),
('el_legal_dpo', 'Data Protection Officer', 'Legal', 'DPO', 'finance_legal', 'Data privacy and GDPR compliance', NULL);
