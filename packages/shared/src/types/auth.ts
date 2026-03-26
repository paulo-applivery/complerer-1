import type { z } from 'zod';
import type { authUserSchema, sessionSchema } from '../validators/auth.js';

export type AuthUser = z.infer<typeof authUserSchema>;
export type Session = z.infer<typeof sessionSchema>;
