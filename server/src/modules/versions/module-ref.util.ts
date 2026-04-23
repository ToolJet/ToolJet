import { EntityManager } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * Module version resolution.
 *
 * ─── Why a name, not a UUID ──────────────────────────────────────────────
 * A parent app references an embedded module through the pair:
 *
 *     (moduleAppId: co_relation_id, moduleVersionId: string)
 *
 * `co_relation_id` identifies *which module* — it's stable across branches
 * and across workspaces cloned via git-sync. `moduleVersionId` identifies
 * *which version of it* — but it's a name, not a UUID. `app_versions.id`
 * (the PK) is re-minted whenever git-sync hydrates a module into a new
 * workspace or a new branch, so a UUID FK would snap the moment a parent
 * app is cloned. A name-based reference survives the hop: `"v1"` means
 * the same thing on master, on feature-1, and in a git-cloned workspace
 * as long as there is a version called `"v1"` over there.
 *
 * ─── How moduleVersionId is interpreted ──────────────────────────────────
 * The string carries no type tag. Its meaning is inferred at read time by
 * checking it against two tables:
 *
 *   Lookup A: app_versions                    — saved version on default branch?
 *   Lookup B: organization_git_sync_branches  — live branch name in this org?
 *
 *     A hits    → PINNED    ("v1"):        freeze to that saved version
 *     B hits    → UNPINNED  ("feature-1"): follow that branch's latest
 *     neither   → ORPHANED  (deleted branch / cross-org import): best-effort
 *
 * Lookup A runs first so a version named after a branch (e.g. a user names
 * a version "main") still classifies as pinned — explicit user intent wins.
 *
 * Resolution is always scoped to the consumer's branchId (from the
 * x-branch-id header). Fallback to the default branch happens only when
 * the consumer has no branch context (embedded viewer / public access),
 * never as a name-matching search across branches. That cross-branch
 * name match was the bug fixed in d9c4ccf969.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export type ModuleRef =
  | { kind: 'pinned'; versionName: string }
  | { kind: 'unpinned'; branchName: string }
  | { kind: 'orphaned'; moduleVersionId: string };

// ─── Named queries ──────────────────────────────────────────────────────
// Each helper encapsulates one findOne with the load-bearing filters
// documented in one place. Callers read like domain sentences.

function findDefaultBranch(manager: EntityManager, organizationId: string) {
  return manager.findOne(WorkspaceBranch, {
    where: { organizationId, isDefault: true },
  });
}

function findBranchByName(manager: EntityManager, organizationId: string, branchName: string) {
  return manager.findOne(WorkspaceBranch, {
    where: { organizationId, name: branchName },
  });
}

/**
 * Saved version = an app_versions row with versionType='version' on the
 * default branch. The versionType filter is load-bearing: sub-branches
 * store an editable working copy whose `name` equals the branch name with
 * versionType='branch' — that row must never be treated as a pin target.
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

function findLocalCopyOnBranch(
  manager: EntityManager,
  moduleAppId: string,
  versionName: string,
  branchId: string
) {
  return manager.findOne(AppVersion, {
    where: { appId: moduleAppId, name: versionName, branchId, isStub: false },
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

function findLatestNonStubOnBranch(manager: EntityManager, moduleAppId: string, branchId: string) {
  return manager.findOne(AppVersion, {
    where: { appId: moduleAppId, branchId, isStub: false },
    order: { createdAt: 'DESC' },
  });
}

// ─── Classification ─────────────────────────────────────────────────────

export async function classifyModuleRef(
  manager: EntityManager,
  moduleApp: App,
  moduleVersionId: string,
  organizationId: string
): Promise<ModuleRef> {
  // Lookup A — checked first so a version named "main" wins over a branch named "main".
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

  // Lookup B
  const branch = await findBranchByName(manager, organizationId, moduleVersionId);
  if (branch) return { kind: 'unpinned', branchName: moduleVersionId };

  return { kind: 'orphaned', moduleVersionId };
}

// ─── Resolvers — one per case, each reads top-to-bottom ─────────────────

async function resolvePinned(
  manager: EntityManager,
  moduleApp: App,
  ref: Extract<ModuleRef, { kind: 'pinned' }>,
  consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  // Prefer a local copy on the consumer's branch (pulled via git sync);
  // fall back to the canonical saved version on the default branch. Never
  // drifts to "latest" — a pin must point at the named version or nothing.
  if (consumerBranchId) {
    const local = await findLocalCopyOnBranch(
      manager,
      moduleApp.id,
      ref.versionName,
      consumerBranchId
    );
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
  // "Follow my branch" — latest non-stub on the consumer's branch. No
  // branch context (embedded viewer / public access) → follow the default.
  const targetBranchId =
    consumerBranchId ?? (await findDefaultBranch(manager, organizationId))?.id;
  if (!targetBranchId) return null;
  return findLatestNonStubOnBranch(manager, moduleApp.id, targetBranchId);
}

async function resolveOrphaned(
  manager: EntityManager,
  moduleApp: App,
  _ref: Extract<ModuleRef, { kind: 'orphaned' }>,
  _consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  // Orphaned refs can come from a deleted branch, a renamed/deleted
  // version, or a cross-org import where the name doesn't exist locally.
  // The conservative recovery is the default branch's latest saved version
  // — canonical, never surprises the user with merge content on a feature
  // branch. Cross-branch name matching (the old Attempt 2) is intentionally
  // NOT resurrected here — see d9c4ccf969 for the leak it caused.
  const defaultBranch = await findDefaultBranch(manager, organizationId);
  if (!defaultBranch) return null;
  return findLatestSavedOnDefaultBranch(manager, moduleApp.id, defaultBranch.id);
}

// ─── Entry point ────────────────────────────────────────────────────────

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

// ─── Write-side reconciliation ──────────────────────────────────────────

/**
 * After hydrating an app on a non-default branch, inherit pinned
 * `moduleVersionId` values from the matching component on the default
 * branch. Without this, branch creation silently drops the user's pin:
 * the YAML on disk may be stale (pre-pin push) and the default-branch pin
 * rewrite (pinUnpinnedModuleViewerRefs) never propagates to git, so the
 * new branch lands with an unpinned ref.
 *
 * Matching key: `component.co_relation_id` — the stable cross-branch
 * identity. Only `pinned` refs on the default branch are copied; unpinned
 * and orphaned refs are left alone so they keep their branch-following
 * semantics.
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

    const ref = await classifyModuleRef(manager, moduleApp, def.moduleVersionId, organizationId);
    if (ref.kind !== 'pinned') continue;

    await manager.query(
      `UPDATE components
       SET properties = jsonb_set(properties::jsonb, '{moduleVersionId,value}', to_jsonb($1::text))
       WHERE id = $2`,
      [def.moduleVersionId, feat.id]
    );
  }
}
