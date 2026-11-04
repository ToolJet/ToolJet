import { EntityManager } from 'typeorm';
import { ResolveOutcome } from '@modules/organization-env/types';

export interface IOrganizationEnvRegistryService {
  initialize(): Promise<void>;
  has(organizationId: string, key: string): boolean;
  hasAll(organizationId: string, keys: readonly string[]): boolean;
  get(organizationId: string, key: string): Promise<string | undefined>;
  // manager — reuse the caller's connection for the lookup instead of taking a pooled one.
  ensureResolved(organizationId: string, manager?: EntityManager): Promise<ResolveOutcome>;
  getResolvedOrganizationIds(): string[];
}
