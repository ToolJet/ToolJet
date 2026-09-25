import { Organization } from '@entities/organization.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { getDBConnection } from '@helpers/database.helper';

// Shared id->name caches for metric labels — names change rarely, never a DB hit per emission

const ORG_NAME_TTL_MS = 5 * 60_000;
const orgNameCache = new Map<string, { name: string; ts: number }>();

export async function getOrganizationNameCached(organizationId: string): Promise<string> {
  const cached = orgNameCache.get(organizationId);
  if (cached && Date.now() - cached.ts < ORG_NAME_TTL_MS) return cached.name;

  // Plain read — no transaction needed
  const organization = await getDBConnection().findOne(Organization, { where: { id: organizationId } });
  const name = organization?.name ?? 'unknown';
  orgNameCache.set(organizationId, { name, ts: Date.now() });
  return name;
}

// Environment names are immutable per id — cache for process lifetime
const envNameCache = new Map<string, string>();

export async function getEnvironmentNameCached(environmentId: string): Promise<string> {
  const cached = envNameCache.get(environmentId);
  if (cached) return cached;

  // Plain read — no transaction needed
  const environment = await getDBConnection().findOne(AppEnvironment, { where: { id: environmentId } });
  const name = environment?.name ?? 'unknown';
  if (name !== 'unknown') envNameCache.set(environmentId, name);
  return name;
}
