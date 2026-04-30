import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';

// Guards Postgres uuid-typed lookups against stale legacy non-UUID values
// (e.g. version names from pre-rename YAML imports).
export const MODULE_VERSION_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// Returns consumer-branch draft (if any) plus saved versions on the default
// branch. A pure branchId filter would drop saved versions on feature branches.
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

// After hydrating a feature-branch AppVersion, copy default's current pin onto
// the matching feature component (matched by component.co_relation_id) — git
// content is whatever was last pushed and can lag default's intent. Default
// always wins; feature-branch users don't get sticky pin overrides.
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
    if (!def?.moduleVersionId) continue;
    if (feat.moduleVersionId === def.moduleVersionId) continue;

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
