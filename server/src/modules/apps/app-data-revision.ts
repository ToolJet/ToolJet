import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { findUserGroupsWithAppAccess } from '@modules/group-permissions/repository';

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

// License terms the released-app and released-version responses depend on: permission filtering,
// page groups and modules, JS libraries (stripped without the license), and the environment and
// branch-freeze state the version endpoint returns.
export const VIEWER_LICENSE_FIELDS = [
  LICENSE_FIELD.VALID,
  LICENSE_FIELD.APP_PERMISSIONS_PAGES,
  LICENSE_FIELD.APP_PERMISSIONS_QUERY,
  LICENSE_FIELD.APP_PERMISSIONS_COMPONENT,
  LICENSE_FIELD.APP_PAGES_NAV_GROUP,
  LICENSE_FIELD.MODULES,
  LICENSE_FIELD.APP_JS_LIBRARIES,
  LICENSE_FIELD.MULTI_ENVIRONMENT,
  LICENSE_FIELD.GIT_SYNC_MULTI_BRANCH,
];

export interface AppDataRevisionScope {
  versionId: string;
  // Undefined for an anonymous visitor of a public app.
  userId?: string;
  // The VIEWER_LICENSE_FIELDS terms of the app's workspace.
  licenseTerms: unknown;
}

// Database triggers (migration AddViewerCacheStamps) set this whenever something changes what the
// released app shows without a new release: its permissions, the theme, an embedded module, a link.
async function getAppChangeStamp(manager: EntityManager, appId: string): Promise<string | null> {
  const rows: { stamp: string | null }[] = await manager.query(
    'SELECT updated_at::text AS stamp FROM app_viewer_cache_stamps WHERE app_id = $1',
    [appId]
  );
  return rows[0]?.stamp ?? null;
}

// Permissions are checked against these groups, so joining or leaving one, or a group gaining or
// losing access to the app, changes what the viewer sees. Public apps don't check groups.
async function getViewerGroupIds(
  manager: EntityManager,
  app: Pick<App, 'id' | 'isPublic' | 'organizationId'>,
  userId: string | undefined
): Promise<string[]> {
  if (!userId || app.isPublic) return [];
  const groups = await findUserGroupsWithAppAccess(manager, userId, app.id, app.organizationId);
  return groups.map((group) => group.id).sort();
}

// Cache key for a released app's data, used by the viewer's IndexedDB cache and the version
// endpoint's ETag. The change stamp and the viewer's groups cover data changes; the server
// version, migration and license are read live, since they change with no database write or
// differ between servers mid-deploy. Not apps.updated_at, which every draft edit bumps.
// Null means "don't cache".
export async function getAppDataRevision(
  manager: EntityManager,
  app: Pick<App, 'id' | 'name' | 'isPublic' | 'isMaintenanceOn' | 'organizationId'>,
  scope: AppDataRevisionScope
): Promise<string | null> {
  const migration = await getLatestMigration(manager);
  if (!migration) return null;

  let appStamp: string | null;
  let groupIds: string[];
  try {
    [appStamp, groupIds] = await Promise.all([
      getAppChangeStamp(manager, app.id),
      getViewerGroupIds(manager, app, scope.userId),
    ]);
  } catch {
    return null; // can't tell whether the app changed, so don't let it be cached
  }

  const inputs = [
    app.name,
    app.isPublic,
    app.isMaintenanceOn,
    scope.versionId,
    appStamp,
    scope.userId ?? null,
    groupIds,
    globalThis.TOOLJET_VERSION ?? null,
    scope.licenseTerms ?? null,
  ];
  const hash = createHash('sha1').update(JSON.stringify(inputs)).digest('hex').slice(0, 12);
  return `${migration}.${hash}`;
}

export function resetAppDataRevisionCache(): void {
  latestMigration = undefined;
}
