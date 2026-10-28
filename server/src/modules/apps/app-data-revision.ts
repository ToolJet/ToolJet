import { createHash } from 'crypto';
import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { findUserGroupsWithAppAccess } from '@modules/group-permissions/repository';
import { HELD_MIGRATION_LOCKS_SQL } from '../../migration-helpers/migration-locks';

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

// `stamp`: set by database triggers (migration AddViewerCacheStamps) whenever something changes what the
// released app shows without a new release: its permissions, the theme, an embedded module, a link.
// `epoch`: the last migration id handed out. In async mode a data migration can rewrite components after the new
// server version is already serving, so the version alone would keep the pre-migration copy. Read from the
// sequence, not the table: an upgrade holds LOCK TABLE migrations until it commits. The sequence moves before the
// run commits, so a held active lock marks the epoch too: nothing read mid-run is cached under the final key.
async function getChangeStamps(
  manager: EntityManager,
  appId: string
): Promise<{ stamp: string | null; epoch: string | null }> {
  const [row]: { stamp: string | null; epoch: string | null }[] = await manager.query(
    `SELECT (SELECT updated_at::text FROM app_viewer_cache_stamps WHERE app_id = $1) AS stamp,
            (SELECT last_value::text FROM migrations_id_seq)
              || CASE WHEN (SELECT migrating FROM (${HELD_MIGRATION_LOCKS_SQL}) migration_locks) THEN ':migrating' ELSE '' END AS epoch`,
    [appId]
  );
  return { stamp: row?.stamp ?? null, epoch: row?.epoch ?? null };
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
// version and license are read live, since they change with no database write or differ between
// servers mid-deploy. Not apps.updated_at, which every draft edit bumps. Null means "don't cache".
// Adding something the released app shows? See "Released-app viewer cache" in AGENTS.md.
export async function getAppDataRevision(
  manager: EntityManager,
  app: Pick<App, 'id' | 'name' | 'isPublic' | 'isMaintenanceOn' | 'organizationId'>,
  scope: AppDataRevisionScope
): Promise<string | null> {
  let stamps: { stamp: string | null; epoch: string | null };
  let groupIds: string[];
  try {
    [stamps, groupIds] = await Promise.all([
      getChangeStamps(manager, app.id),
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
    stamps.stamp,
    stamps.epoch,
    scope.userId ?? null,
    groupIds,
    globalThis.TOOLJET_VERSION ?? null,
    scope.licenseTerms ?? null,
  ];
  return createHash('sha1').update(JSON.stringify(inputs)).digest('hex').slice(0, 16);
}
