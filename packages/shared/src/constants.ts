import type { MemberRole } from './types/workspace.js';

export const MEMBER_ROLES = [
  'owner',
  'admin',
  'auditor',
  'member',
  'viewer',
] as const;

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 5,
  admin: 4,
  auditor: 3,
  member: 2,
  viewer: 1,
} as const;

export const FRAMEWORK_SLUGS = [
  'soc2',
  'iso27001',
  'nist_csf',
  'cis_v8',
  'pci_dss',
] as const;
