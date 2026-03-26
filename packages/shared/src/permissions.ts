import type { MemberRole } from './types/workspace.js';
import { ROLE_HIERARCHY } from './constants.js';

// ── Action constants ──────────────────────────────────────────────────
export const Actions = {
  // Workspace
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_BILLING: 'workspace:billing',

  // Members
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  MEMBER_CHANGE_ROLE: 'member:change_role',

  // Frameworks
  FRAMEWORK_ADOPT: 'framework:adopt',
  FRAMEWORK_REMOVE: 'framework:remove',

  // Controls / Evidence
  CONTROL_VIEW: 'control:view',
  CONTROL_ASSIGN: 'control:assign',
  EVIDENCE_UPLOAD: 'evidence:upload',
  EVIDENCE_REVIEW: 'evidence:review',

  // Auditing
  AUDIT_VIEW: 'audit:view',
  AUDIT_EXPORT: 'audit:export',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];

// ── Permission matrix ─────────────────────────────────────────────────
// Minimum role level required for each action.
const ACTION_MIN_LEVEL: Record<string, number> = {
  // Owner-only
  [Actions.WORKSPACE_DELETE]: ROLE_HIERARCHY.owner,
  [Actions.WORKSPACE_BILLING]: ROLE_HIERARCHY.owner,
  [Actions.MEMBER_CHANGE_ROLE]: ROLE_HIERARCHY.owner,

  // Admin+
  [Actions.WORKSPACE_UPDATE]: ROLE_HIERARCHY.admin,
  [Actions.MEMBER_INVITE]: ROLE_HIERARCHY.admin,
  [Actions.MEMBER_REMOVE]: ROLE_HIERARCHY.admin,
  [Actions.FRAMEWORK_ADOPT]: ROLE_HIERARCHY.admin,
  [Actions.FRAMEWORK_REMOVE]: ROLE_HIERARCHY.admin,

  // Auditor+
  [Actions.AUDIT_VIEW]: ROLE_HIERARCHY.auditor,
  [Actions.AUDIT_EXPORT]: ROLE_HIERARCHY.auditor,
  [Actions.EVIDENCE_REVIEW]: ROLE_HIERARCHY.auditor,

  // Member+
  [Actions.CONTROL_ASSIGN]: ROLE_HIERARCHY.member,
  [Actions.EVIDENCE_UPLOAD]: ROLE_HIERARCHY.member,

  // Viewer+
  [Actions.CONTROL_VIEW]: ROLE_HIERARCHY.viewer,
  [Actions.DASHBOARD_VIEW]: ROLE_HIERARCHY.viewer,
};

/**
 * Check whether a given role is allowed to perform an action.
 * Unknown actions are denied by default.
 */
export function can(role: MemberRole, action: string): boolean {
  const roleLevel = ROLE_HIERARCHY[role];
  const requiredLevel = ACTION_MIN_LEVEL[action];

  if (roleLevel === undefined || requiredLevel === undefined) {
    return false;
  }

  return roleLevel >= requiredLevel;
}
