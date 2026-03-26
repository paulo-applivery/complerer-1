import { z } from 'zod';

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().optional(),
  lastLoginAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const sessionSchema = z.object({
  userId: z.string(),
  workspaceId: z.string().optional(),
  role: z.string().optional(),
});
