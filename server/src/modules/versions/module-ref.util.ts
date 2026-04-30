import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * Module version resolution.
 *
 * A ModuleViewer stores two strings in its component properties:
 *   moduleAppId       — the module's apps.id (local DB id).
 *   moduleVersionId   — the version's app_versions.id (local DB id). Empty
 *                       string signals "unpinned" (follow the consumer's
 *                       current branch).
 *
 * Cross-instance stability comes from AppSnapshot at every boundary
 * (push, pull, JSON export/import, branch-create), which translates these
 * local ids to/from co_relation_id. At runtime — after a pull or import
 * lands rows on this instance — the values held in component JSON are
 * always *this instance's* local ids.
 *
 * Resolution rules:
 *
 *   value present + matches a row's id          → pinned, prefer consumer's
 *                                                  branch row else default-
 *                                                  branch row
 *   value absent (null/empty)                   → unpinned, latest non-stub
 *                                                  on consumer branch (or
 *                                                  default)
 *   value present but no row matches            → orphaned, fall back to
 *                                                  latest saved on default
 *
 * Resolution is always scoped to the consumer's branchId (from the
 * x-branch-id header). When the request has no branchId — a public-share
 * URL or an embedded viewer without an auth session — the resolver falls
 * back to the default branch.
 */

function findDefaultBranch(manager: EntityManager, organizationId: string) {
  return manager.findOne(WorkspaceBranch, {
    where: { organizationId, isDefault: true },
  });
}

async function listSavedVersionsOnDefaultBranch(
  manager: EntityManager,
  moduleApp: App,
  organizationId: string
): Promise<AppVersion[]> {
  const defaultBranch = await findDefaultBranch(manager, organizationId);
  if (!defaultBranch) return [];
  return manager.find(AppVersion, {
    where: {
      appId: moduleApp.id,
      branchId: defaultBranch.id,
      versionType: AppVersionType.VERSION,
      isStub: false,
    },
    order: { createdAt: 'DESC' },
  });
}

/**
 * Consumer-branch draft (if any) plus saved versions on the default branch.
 * A pure branchId filter would drop saved versions on feature branches.
 */
export async function listModuleVersions(
  manager: EntityManager,
  moduleApp: App,
  branchId: string | undefined,
  organizationId: string
): Promise<AppVersion[]> {
  const savedVersions = await listSavedVersionsOnDefaultBranch(manager, moduleApp, organizationId);
  const branchDraft = branchId
    ? await manager.findOne(AppVersion, {
        where: {
          appId: moduleApp.id,
          branchId,
          versionType: AppVersionType.BRANCH,
          isStub: false,
        },
      })
    : null;
  return [branchDraft, ...savedVersions].filter((v): v is AppVersion => !!v);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a ModuleViewer reference to an actual AppVersion row.
 *
 *   moduleVersionId is a valid UUID + matches a row's id → pinned. Prefer the
 *                                                          consumer-branch copy
 *                                                          (post git pull); fall
 *                                                          back to the default-
 *                                                          branch copy.
 *   moduleVersionId absent / not a UUID                  → unpinned. Latest non-
 *                                                          stub on the consumer's
 *                                                          branch (or default).
 *   moduleVersionId is a UUID, no match                  → orphaned. Fall back to
 *                                                          latest saved on the
 *                                                          default branch.
 *
 * The UUID guard prevents `where: { id: <non-uuid> }` from crashing the
 * postgres uuid-typed column lookup with `invalid input syntax for type uuid`.
 */
export async function resolveModuleRef(
  manager: EntityManager,
  moduleApp: App,
  moduleVersionId: string | null | undefined,
  consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  if (moduleVersionId && UUID_RE.test(moduleVersionId)) {
    if (consumerBranchId) {
      const local = await manager.findOne(AppVersion, {
        where: {
          id: moduleVersionId,
          appId: moduleApp.id,
          branchId: consumerBranchId,
          isStub: false,
        },
      });
      if (local) return local;
    }
    const defaultBranch = await findDefaultBranch(manager, organizationId);
    if (defaultBranch) {
      const onDefault = await manager.findOne(AppVersion, {
        where: {
          id: moduleVersionId,
          appId: moduleApp.id,
          branchId: defaultBranch.id,
          isStub: false,
        },
      });
      if (onDefault) return onDefault;
    }
    // id present but neither branch had a match — orphan fallback below.
  }

  // Unpinned OR orphaned: latest non-stub on consumer's branch (or default).
  const targetBranchId = consumerBranchId ?? (await findDefaultBranch(manager, organizationId))?.id;
  if (!targetBranchId) return null;
  return manager.findOne(AppVersion, {
    where: { appId: moduleApp.id, branchId: targetBranchId, isStub: false },
    order: { createdAt: 'DESC' },
  });
}

/**
 * After hydrating a feature-branch AppVersion, inherit pinned moduleVersionId
 * values from the matching component on the default branch. The component JSON
 * committed to git can be stale (the component might still hold an older ref
 * from when the branch was first created), so without this pass the feature
 * branch lands with whatever was last pushed.
 *
 * Match key: component.co_relation_id (matches across the two app_version rows).
 *
 * Policy:
 *   - Only copy when default's value is set (a pinned id) AND differs from feature's.
 *   - A feature-branch component that already has the same id is left alone.
 *   - Empty/missing values on default are skipped (nothing to inherit).
 */
export async function reconcileModuleViewerPinsFromDefault(
  manager: EntityManager,
  featureBranchVersionId: string,
  organizationId: string
): Promise<void> {
  const featureVersion = await manager.findOne(AppVersion, {
    where: { id: featureBranchVersionId },
    select: ['id', 'appId'],
  });
  if (!featureVersion) return;

  const defaultBranch = await findDefaultBranch(manager, organizationId);
  if (!defaultBranch) return;

  const defaultVersion = await manager.findOne(AppVersion, {
    where: {
      appId: featureVersion.appId,
      branchId: defaultBranch.id,
      versionType: AppVersionType.VERSION,
      isStub: false,
    },
    order: { createdAt: 'DESC' },
  });
  if (!defaultVersion) return;

  type ViewerRow = {
    id: string;
    co_relation_id: string | null;
    moduleAppId: string | null;
    moduleVersionId: string | null;
  };

  const readViewers = (appVersionId: string): Promise<ViewerRow[]> =>
    manager.query(
      `SELECT c.id, c.co_relation_id,
              c.properties->'moduleAppId'->>'value' AS "moduleAppId",
              c.properties->'moduleVersionId'->>'value' AS "moduleVersionId"
       FROM components c
       JOIN pages p ON p.id = c.page_id
       WHERE p.app_version_id = $1
         AND c.type = 'ModuleViewer'
         AND c.co_relation_id IS NOT NULL`,
      [appVersionId]
    );

  const featureViewers = await readViewers(featureBranchVersionId);
  if (featureViewers.length === 0) return;

  const defaultViewers = await readViewers(defaultVersion.id);
  const defaultByCoRel = new Map(
    defaultViewers.filter((v) => v.co_relation_id).map((v) => [v.co_relation_id as string, v])
  );

  for (const feat of featureViewers) {
    if (!feat.co_relation_id) continue;
    const def = defaultByCoRel.get(feat.co_relation_id);
    if (!def?.moduleVersionId) continue; // nothing to inherit
    if (feat.moduleVersionId === def.moduleVersionId) continue; // already matches

    // moduleAppId.value holds the module's local apps.id; org scope lives
    // on the App row directly, no co_relation_id resolution needed.
    const moduleApp = def.moduleAppId
      ? await manager.findOne(App, {
          where: { id: def.moduleAppId, type: APP_TYPES.MODULE, organizationId },
        })
      : null;
    if (!moduleApp) continue;

    await manager.query(
      `UPDATE components
       SET properties = jsonb_set(properties::jsonb, '{moduleVersionId,value}', to_jsonb($1::text))
       WHERE id = $2`,
      [def.moduleVersionId, feat.id]
    );
  }
}
