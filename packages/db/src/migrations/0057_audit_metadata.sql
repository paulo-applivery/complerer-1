-- Add organization metadata to workspaces
ALTER TABLE workspaces ADD COLUMN org_address TEXT;
ALTER TABLE workspaces ADD COLUMN org_industry TEXT;
ALTER TABLE workspaces ADD COLUMN org_size TEXT;
ALTER TABLE workspaces ADD COLUMN org_website TEXT;
ALTER TABLE workspaces ADD COLUMN org_registration_id TEXT;
ALTER TABLE workspaces ADD COLUMN security_officer_name TEXT;
ALTER TABLE workspaces ADD COLUMN security_officer_email TEXT;
ALTER TABLE workspaces ADD COLUMN security_officer_phone TEXT;
ALTER TABLE workspaces ADD COLUMN dpo_name TEXT;
ALTER TABLE workspaces ADD COLUMN dpo_email TEXT;
ALTER TABLE workspaces ADD COLUMN dpo_phone TEXT;
ALTER TABLE workspaces ADD COLUMN legal_rep_name TEXT;
ALTER TABLE workspaces ADD COLUMN legal_rep_email TEXT;

-- Add auditor/firm details to compliance_projects
ALTER TABLE compliance_projects ADD COLUMN auditor_email TEXT;
ALTER TABLE compliance_projects ADD COLUMN auditor_phone TEXT;
ALTER TABLE compliance_projects ADD COLUMN auditor_qualifications TEXT;
ALTER TABLE compliance_projects ADD COLUMN firm_address TEXT;
ALTER TABLE compliance_projects ADD COLUMN firm_email TEXT;
ALTER TABLE compliance_projects ADD COLUMN firm_phone TEXT;
ALTER TABLE compliance_projects ADD COLUMN firm_website TEXT;
