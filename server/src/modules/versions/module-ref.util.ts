import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * Module version resolution.
 *
 * A parent app references an embedded module by (moduleAppId, moduleVersionId).
 * moduleAppId is a co_relation_id (stable across branches and git-cloned
 * workspaces). moduleVersionId is a name, not a UUID: `app_versions.id` is
 * re-minted per workspace/branch, so a UUID FK would snap on clone.
 *
 * The name has no type tag; meaning is inferred at read time:
 *
 *   Lookup A: app_versions                    — saved version on default branch?
 *   Lookup B: organization_git_sync_branches  — live branch name in this org?
 *
 *     A hits    → PINNED    ("v1"):        freeze to that saved version
 *     B hits    → UNPINNED  ("feature-1"): follow that branch's latest
 *     neither   → ORPHANED  (deleted branch / cross-org import): best-effort
 *
 * Lookup A runs first so a version named after a branch (e.g. "main")
 * classifies as pinned — explicit user intent wins.
 *
 * Resolution is always scoped to the consumer's branchId (from the
 * x-branch-id header). When the request has no branchId — a public-share
 * URL or an embedded viewer without an auth session — the resolver falls
 * back to the default branch.
 */

/**
 * UI mapping (ModuleViewerInspector dropdown):
 *   pinned   → "Pinned to <versionName>"
 *   unpinned → "Active draft" on the default branch,
 *              "Current branch" on a sub-branch
 *   orphaned → no dedicated label; shares the unpinned ⚠ banner
 */
export type ModuleRef =
  | { kind: 'pinned'; versionName: string }
  | { kind: 'unpinned'; branchName: string }
  | { kind: 'orphaned'; moduleVersionId: string };

function findDefaultBranch(manager: EntityManager, organizationId: string) {
  return manager.findOne(WorkspaceBranch, {
    where: { organizationId, isDefault: true },
  });
}

/**
 * versionType='version' is load-bearing: sub-branches store an editable copy
 * whose `name` equals the branch name with versionType='branch'. That row
 * must never be treated as a pin target.
 */
function findSavedVersionOnDefaultBranch(
  manager: EntityManager,
  moduleAppId: string,
  versionName: string,
  defaultBranchId: string
) {
  return manager.findOne(AppVersion, {
    where: {
      appId: moduleAppId,
      name: versionName,
      branchId: defaultBranchId,
      versionType: AppVersionType.VERSION,
      isStub: false,
    },
  });
}

function findLatestSavedOnDefaultBranch(
  manager: EntityManager,
  moduleAppId: string,
  defaultBranchId: string
) {
  return manager.findOne(AppVersion, {
    where: {
      appId: moduleAppId,
      branchId: defaultBranchId,
      versionType: AppVersionType.VERSION,
      isStub: false,
    },
    order: { createdAt: 'DESC' },
  });
}

export async function classifyModuleRef(
  manager: EntityManager,
  moduleApp: App,
  moduleVersionId: string,
  organizationId: string
): Promise<ModuleRef> {
  const defaultBranch = await findDefaultBranch(manager, organizationId);
  if (defaultBranch) {
    const saved = await findSavedVersionOnDefaultBranch(
      manager,
      moduleApp.id,
      moduleVersionId,
      defaultBranch.id
    );
    if (saved) return { kind: 'pinned', versionName: moduleVersionId };
  }

  // Lookup B — is this string the name of a live branch in this org?
  const branch = await manager.findOne(WorkspaceBranch, {
    where: { organizationId, name: moduleVersionId },
  });
  if (branch) return { kind: 'unpinned', branchName: moduleVersionId };

  return { kind: 'orphaned', moduleVersionId };
}

async function resolvePinned(
  manager: EntityManager,
  moduleApp: App,
  ref: Extract<ModuleRef, { kind: 'pinned' }>,
  consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  if (consumerBranchId) {
    // Prefer a local copy on the consumer's branch (pulled via git sync).
    const local = await manager.findOne(AppVersion, {
      where: {
        appId: moduleApp.id,
        name: ref.versionName,
        branchId: consumerBranchId,
        isStub: false,
      },
    });
    if (local) return local;
  }
  const defaultBranch = await findDefaultBranch(manager, organizationId);
  if (!defaultBranch) return null;
  return findSavedVersionOnDefaultBranch(manager, moduleApp.id, ref.versionName, defaultBranch.id);
}

async function resolveUnpinned(
  manager: EntityManager,
  moduleApp: App,
  _ref: Extract<ModuleRef, { kind: 'unpinned' }>,
  consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  // "Follow my branch" — latest non-stub for this module on the consumer's
  // branch. No branch context (embedded viewer / public access) → default.
  const targetBranchId =
    consumerBranchId ?? (await findDefaultBranch(manager, organizationId))?.id;
  if (!targetBranchId) return null;
  return manager.findOne(AppVersion, {
    where: { appId: moduleApp.id, branchId: targetBranchId, isStub: false },
    order: { createdAt: 'DESC' },
  });
}

async function resolveOrphaned(
  manager: EntityManager,
  moduleApp: App,
  _ref: Extract<ModuleRef, { kind: 'orphaned' }>,
  _consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  const defaultBranch = await findDefaultBranch(manager, organizationId);
  if (!defaultBranch) return null;
  return findLatestSavedOnDefaultBranch(manager, moduleApp.id, defaultBranch.id);
}

export async function resolveModuleRef(
  manager: EntityManager,
  moduleApp: App,
  ref: ModuleRef,
  consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  switch (ref.kind) {
    case 'pinned':
      return resolvePinned(manager, moduleApp, ref, consumerBranchId, organizationId);
    case 'unpinned':
      return resolveUnpinned(manager, moduleApp, ref, consumerBranchId, organizationId);
    case 'orphaned':
      return resolveOrphaned(manager, moduleApp, ref, consumerBranchId, organizationId);
  }
}

/**
 * After hydrating a feature-branch AppVersion, inherit pinned moduleVersionId
 * values from the matching component on the default branch. The component JSON
 * committed to git can be stale pre-pin (pinUnpinnedModuleViewerRefs writes
 * only to the DB; push is manual), so without this pass the feature branch
 * lands with whatever ref was last pushed — usually an unpinned branch-name.
 *
 * Match key: component.co_relation_id.
 *
 * Policy:
 *   - Only `pinned` default-branch refs are eligible to copy.
 *   - A feature-branch component that already classifies as `pinned` is left
 *     alone — the user's explicit pin on this branch wins over main's pin,
 *     even if they differ.
 *   - Unpinned/orphaned feature-branch refs are overwritten with the default's
 *     pin so branch creation doesn't silently drop the pin.
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

  const defaultVersion = await findLatestSavedOnDefaultBranch(
    manager,
    featureVersion.appId,
    defaultBranch.id
  );
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
    if (!def?.moduleAppId || !def?.moduleVersionId) continue;
    if (feat.moduleVersionId === def.moduleVersionId) continue;

    const moduleApp = await manager.findOne(App, {
      where: { co_relation_id: def.moduleAppId, type: APP_TYPES.MODULE, organizationId },
      order: { createdAt: 'ASC' },
    });
    if (!moduleApp) continue;

    // Don't overwrite a manual pin already set on the feature branch.
    if (feat.moduleVersionId) {
      const featRef = await classifyModuleRef(manager, moduleApp, feat.moduleVersionId, organizationId);
      if (featRef.kind === 'pinned') continue;
    }

    const defRef = await classifyModuleRef(manager, moduleApp, def.moduleVersionId, organizationId);
    if (defRef.kind !== 'pinned') continue;

    await manager.query(
      `UPDATE components
       SET properties = jsonb_set(properties::jsonb, '{moduleVersionId,value}', to_jsonb($1::text))
       WHERE id = $2`,
      [def.moduleVersionId, feat.id]
    );
  }
}
