/**
 * Placeholder for Payload's generated types.
 *
 * Payload regenerates `apps/cms/src/payload-types.ts` from the collection configs
 * (`pnpm --filter @mpm/cms generate:types`). A postbuild step copies it here so the
 * web app and shared packages can import collection shapes without depending on the
 * CMS app directly. Until first generation, these minimal shapes keep the workspace
 * type-checking; they are overwritten, never hand-edited.
 */

export interface OrgProfile {
  legalName: string;
  brandName: string;
  gstin: string;
  cin: string;
  yearsOperating: number;
  insurancePartner?: string;
  registeredOffice: string;
  sameAs?: string[];
}

export interface Location {
  id: string;
  slug: string;
  name: string;
  type: 'state' | 'city' | 'locality';
  isServiceable: boolean;
}

export type { ManifestRow } from './manifest.js';
