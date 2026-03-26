import { z } from 'zod';

export const frameworkSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  sourceOrg: z.string(),
  sourceUrl: z.string().url(),
  createdAt: z.coerce.date(),
});

export const frameworkVersionSchema = z.object({
  id: z.string(),
  frameworkId: z.string(),
  version: z.string(),
  status: z.enum(['current', 'superseded', 'draft']),
  totalControls: z.number().int().nonnegative(),
  publishedAt: z.coerce.date(),
  changelog: z.string(),
  sourceUrl: z.string().url(),
  checksum: z.string(),
  previousVersionId: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const versionedControlSchema = z.object({
  id: z.string(),
  frameworkVersionId: z.string(),
  controlId: z.string(),
  domain: z.string(),
  subdomain: z.string().optional(),
  title: z.string(),
  requirementText: z.string(),
  guidance: z.string(),
  evidenceRequirements: z.array(z.string()),
  riskWeight: z.number(),
  implementationGroup: z.string().optional(),
  supersedes: z.string().optional(),
  deprecated: z.boolean(),
  deprecationNote: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const controlCrosswalkSchema = z.object({
  id: z.string(),
  sourceControlId: z.string(),
  targetControlId: z.string(),
  mappingType: z.enum(['equivalent', 'partial', 'related']),
  confidence: z.number().min(0).max(1),
  notes: z.string(),
  createdAt: z.coerce.date(),
});

export const workspaceAdoptionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  frameworkVersionId: z.string(),
  adoptedAt: z.coerce.date(),
  adoptedBy: z.string(),
  reason: z.string().optional(),
  effectiveFrom: z.coerce.date(),
  effectiveUntil: z.coerce.date().optional(),
  supersededBy: z.string().optional(),
  autoUpdateMinor: z.boolean(),
  createdAt: z.coerce.date(),
});
