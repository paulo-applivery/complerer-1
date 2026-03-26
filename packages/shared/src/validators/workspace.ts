import { z } from 'zod';

export const memberRoleSchema = z.enum([
  'owner',
  'admin',
  'auditor',
  'member',
  'viewer',
]);

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const workspaceMemberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  role: memberRoleSchema,
  invitedBy: z.string(),
  joinedAt: z.coerce.date(),
});

export const invitationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  email: z.string().email(),
  role: memberRoleSchema,
  invitedBy: z.string(),
  status: z.enum(['pending', 'accepted', 'expired']),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});
