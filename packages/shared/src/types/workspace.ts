import type { z } from 'zod';
import type {
  workspaceSchema,
  workspaceMemberSchema,
  memberRoleSchema,
  invitationSchema,
} from '../validators/workspace.js';

export type MemberRole = z.infer<typeof memberRoleSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;
export type Invitation = z.infer<typeof invitationSchema>;
