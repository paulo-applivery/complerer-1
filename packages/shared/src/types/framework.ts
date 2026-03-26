import type { z } from 'zod';
import type {
  frameworkSchema,
  frameworkVersionSchema,
  versionedControlSchema,
  controlCrosswalkSchema,
  workspaceAdoptionSchema,
} from '../validators/framework.js';

export type Framework = z.infer<typeof frameworkSchema>;
export type FrameworkVersion = z.infer<typeof frameworkVersionSchema>;
export type VersionedControl = z.infer<typeof versionedControlSchema>;
export type ControlCrosswalk = z.infer<typeof controlCrosswalkSchema>;
export type WorkspaceAdoption = z.infer<typeof workspaceAdoptionSchema>;
