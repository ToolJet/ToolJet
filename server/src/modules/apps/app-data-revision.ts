import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';

// Latest migration timestamp. Migrations run before the server starts, so one read per process.
let latestMigration: Promise<string | null> | undefined;

function getLatestMigration(manager: EntityManager): Promise<string | null> {
  latestMigration ??= manager
    .query('SELECT MAX(timestamp)::text AS revision FROM migrations')
    .then((rows: { revision: string | null }[]) => rows[0]?.revision ?? null)
    .catch(() => {
      latestMigration = undefined; // retry on the next call
      return null;
    });
  return latestMigration;
}

// Cache key for a released app's data, used by the viewer's IndexedDB caches and the version
// endpoint's ETag. Changes on a migration or when the app's name, public or maintenance setting
// changes. Built from values the request already loaded (not apps.updated_at, which every draft
// edit bumps), so draft edits keep the cache. Null means "don't cache".
export async function getAppDataRevision(
  manager: EntityManager,
  app: Pick<App, 'name' | 'isPublic' | 'isMaintenanceOn'>
): Promise<string | null> {
  const migration = await getLatestMigration(manager);
  if (!migration) return null;
  const settings = createHash('sha1')
    .update(JSON.stringify([app.name, app.isPublic, app.isMaintenanceOn]))
    .digest('hex')
    .slice(0, 12);
  return `${migration}.${settings}`;
}

export function resetAppDataRevisionCache(): void {
  latestMigration = undefined;
}
