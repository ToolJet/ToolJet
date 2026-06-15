import { EntityManager, IsNull } from 'typeorm';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * Module version resolution.
 *
 * A ModuleViewer stores two strings in its component properties:
 *   moduleAppId       — the module's co_relation_id; stable across branches
 *                       and git-cloned workspaces.
 *   moduleVersionId   — the version's module_reference_id (uuid). Stable across
 *                       branches and across instances; round-trips through
 *                       git push/pull and zip export/import via JSON. Empty
 *                       string signals "unpinned" (follow the consumer's
 *                       current branch).
 *
 * Resolution rules:
 *
 *   value present + matches a row's module_reference_id  → pinned, prefer
 *                                                          consumer's branch row
 *                                                          else default-branch row
 *   value absent (null/empty)                            → unpinned, latest
 *                                                          non-stub on consumer
 *                                                          branch (or default)
 *   value present but no row matches                     → orphaned, fall back
 *                                                          to latest saved on
 *                                                          default
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
  if (!defaultBranch) {
    // Non-git-sync workspace: versions have branch_id = NULL.
    return manager.find(AppVersion, {
      where: { appId: moduleApp.id, branchId: IsNull(), versionType: AppVersionType.VERSION, isStub: false },
      order: { createdAt: 'DESC' },
    });
  }
  // Include both the DRAFT on the default branch AND branchless PUBLISHED versions.
  // Published versions have branch_id = NULL after the metadata migration detached them.
  const [onBranch, published] = await Promise.all([
    manager.find(AppVersion, {
      where: {
        appId: moduleApp.id,
        branchId: defaultBranch.id,
        versionType: AppVersionType.VERSION,
        isStub: false,
      },
      order: { createdAt: 'DESC' },
    }),
    manager.find(AppVersion, {
      where: {
        appId: moduleApp.id,
        branchId: IsNull(),
        versionType: AppVersionType.VERSION,
        status: AppVersionStatus.PUBLISHED,
        isStub: false,
      },
      order: { createdAt: 'DESC' },
    }),
  ]);
  // Dedupe by id in case any overlap
  const seen = new Set(onBranch.map((v) => v.id));
  return [...onBranch, ...published.filter((v) => !seen.has(v.id))];
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
 *   moduleReferenceId is a valid UUID + matches → pinned. Prefer the consumer-branch
 *                                                copy (post git pull); fall back to
 *                                                the default-branch copy.
 *   moduleReferenceId absent / not a UUID       → unpinned. Latest non-stub on the
 *                                                consumer's branch (or default).
 *   moduleReferenceId is a UUID, no match       → orphaned. Fall back to latest saved
 *                                                on the default branch.
 *
 * The UUID guard prevents `where: { moduleReferenceId: <non-uuid> }` from crashing
 * the postgres uuid-typed column lookup with `invalid input syntax for type uuid`.
 */
export async function resolveModuleRef(
  manager: EntityManager,
  moduleApp: App,
  moduleReferenceId: string | null | undefined,
  consumerBranchId: string | undefined,
  organizationId: string
): Promise<AppVersion | null> {
  if (moduleReferenceId && UUID_RE.test(moduleReferenceId)) {
    if (consumerBranchId) {
      const local = await manager.findOne(AppVersion, {
        where: {
          appId: moduleApp.id,
          moduleReferenceId,
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
          appId: moduleApp.id,
          moduleReferenceId,
          branchId: defaultBranch.id,
          isStub: false,
        },
      });
      if (onDefault) return onDefault;
    } else {
      // Non-git-sync workspace: defaultBranch === null means no WorkspaceBranch rows exist.
      const noGitSync = await manager.findOne(AppVersion, {
        where: { appId: moduleApp.id, moduleReferenceId, branchId: IsNull(), isStub: false },
      });
      if (noGitSync) return noGitSync;
    }
    // Branchless PUBLISHED versions (branch_id = NULL after metadata migration)
    const branchless = await manager.findOne(AppVersion, {
      where: {
        appId: moduleApp.id,
        moduleReferenceId,
        branchId: IsNull(),
        isStub: false,
      },
    });
    if (branchless) return branchless;
    // id present but no branch/branchless match — orphan fallback below.
  }

  // Unpinned OR orphaned: latest non-stub on consumer's branch (or default).
  const targetBranchId =
    consumerBranchId ?? (await findDefaultBranch(manager, organizationId))?.id;
  if (!targetBranchId) {
    // Non-git-sync workspace: no WorkspaceBranch rows exist, versions have branch_id = NULL.
    // Prefer the active draft — saved versions have a newer createdAt (they are created from
    // the draft), so a plain DESC sort would return a released version instead of the draft.
    const draft = await manager.findOne(AppVersion, {
      where: { appId: moduleApp.id, branchId: IsNull(), isStub: false, status: AppVersionStatus.DRAFT },
    });
    return (
      draft ??
      (await manager.findOne(AppVersion, {
        where: { appId: moduleApp.id, branchId: IsNull(), isStub: false },
        order: { createdAt: 'DESC' },
      }))
    );
  }
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

    const moduleApp = def.moduleAppId
      ? await manager.findOne(App, {
          where: { co_relation_id: def.moduleAppId, type: APP_TYPES.MODULE, organizationId },
          order: { createdAt: 'ASC' },
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

/**
 * Pin resolution outcome from resolveAllModuleViewersForVersion.
 *
 *   pin-hit            — pin matched a row by id, module_reference_id, version name,
 *                        or branch-name shorthand. Reflects user's choice.
 *   orphan-fallback    — pin non-empty, no row matched; fell back to latest non-stub
 *                        on consumer branch then default (mirrors resolveModuleRef).
 *   unpinned-fallback  — pin empty/missing; same fallback path.
 *   no-row             — no module app OR no usable rows. Module unrenderable.
 */
export type ModuleResolutionMatch =
  | 'pin-hit'
  | 'orphan-fallback'
  | 'unpinned-fallback'
  | 'no-row';

export interface ResolvedModuleViewer {
  componentId: string;
  moduleAppCoRel: string;
  moduleAppId: string | null;
  moduleName: string | null;
  pinnedValue: string;
  matchKind: ModuleResolutionMatch;
  resolved: {
    rowId: string;
    versionName: string;
    status: AppVersionStatus | null;
    versionType: AppVersionType;
    branchId: string | null;
    moduleReferenceId: string | null;
    currentEnvironmentId: string | null;
    envPriority: number | null;
    moduleCurrentVersionId: string | null;
  } | null;
}

/**
 * Resolve every ModuleViewer under parentVersionId to the row runtime renders.
 * Priority (mirrors resolveModuleRef):
 *   1. UUID pin → row.module_reference_id on consumer branch
 *   2. UUID pin → row.module_reference_id on default branch
 *   3. legacy version name → version_type='version' row
 *   4. branch_name shorthand → default-branch version_type='version' row
 *   5. orphan (non-empty, no match) → latest non-stub on consumer then default
 *   6. unpinned (empty) → same fallback as orphan
 *
 * Save/promote/release guards filter resolved rows for DRAFT / under target env /
 * not module's current_version_id, instead of replicating JOIN logic per guard.
 */
export async function resolveAllModuleViewersForVersion(
  manager: EntityManager,
  parentVersionId: string,
  organizationId: string
): Promise<ResolvedModuleViewer[]> {
  const parent = await manager.findOne(AppVersion, {
    where: { id: parentVersionId },
    select: ['id', 'branchId'],
  });
  if (!parent) return [];

  const defaultBranch = await findDefaultBranch(manager, organizationId);
  const isGitSyncEnabled = !!defaultBranch;

  type ViewerRaw = { componentId: string; moduleAppCoRel: string | null; pinnedValue: string };
  const viewers: ViewerRaw[] = await manager.query(
    `SELECT c.id AS "componentId",
            c.properties::jsonb -> 'moduleAppId' ->> 'value' AS "moduleAppCoRel",
            COALESCE(c.properties::jsonb -> 'moduleVersionId' ->> 'value', '') AS "pinnedValue"
     FROM components c
     JOIN pages p ON p.id = c.page_id
     WHERE p.app_version_id = $1 AND c.type = 'ModuleViewer'`,
    [parentVersionId]
  );
  if (viewers.length === 0) return [];

  const coRels = Array.from(new Set(viewers.map((v) => v.moduleAppCoRel).filter((x): x is string => !!x)));

  // Oldest app per co_relation_id wins — mirrors guard's findOne ASC. Hydrate may dup.
  // COALESCE: apps.name can be null for modules created via certain paths; fall back to
  // app_versions.app_name (snapshotted at version creation, reliably populated).
  type ModuleAppRow = { id: string; coRel: string; name: string; currentVersionId: string | null };
  const moduleApps: ModuleAppRow[] = coRels.length
    ? await manager.query(
        `SELECT DISTINCT ON (a.co_relation_id)
                a.id,
                a.co_relation_id AS "coRel",
                COALESCE(a.name, (
                  SELECT av.app_name FROM app_versions av
                  WHERE av.app_id = a.id AND av.app_name IS NOT NULL
                  ORDER BY av.created_at DESC LIMIT 1
                )) AS "name",
                a.current_version_id AS "currentVersionId"
         FROM apps a
         WHERE a.co_relation_id::text = ANY($1)
           AND a.type = $2
           AND a.organization_id = $3
         ORDER BY a.co_relation_id, a.created_at ASC`,
        [coRels, APP_TYPES.MODULE, organizationId]
      )
    : [];
  const moduleAppByCoRel = new Map(moduleApps.map((m) => [m.coRel, m]));

  // Scope: non-stub rows on consumer branch, default branch, or branch-null
  // (non-git-sync). Anything else unreachable at runtime — widening inflates payload.
  type ModVerRow = {
    id: string;
    name: string;
    appId: string;
    versionType: AppVersionType;
    status: AppVersionStatus | null;
    branchId: string | null;
    moduleReferenceId: string | null;
    currentEnvironmentId: string | null;
    envPriority: number | null;
    createdAt: Date;
    isStub: boolean;
  };
  const moduleAppIds = moduleApps.map((m) => m.id);
  const relevantBranchIds = [parent.branchId, defaultBranch?.id].filter((x): x is string => !!x);
  const candidateRows: ModVerRow[] = moduleAppIds.length
    ? await manager.query(
        `SELECT v.id, v.name, v.app_id AS "appId",
                v.version_type AS "versionType", v.status,
                v.branch_id AS "branchId",
                v.module_reference_id AS "moduleReferenceId",
                v.current_environment_id AS "currentEnvironmentId",
                e.priority AS "envPriority",
                v.created_at AS "createdAt",
                v.is_stub AS "isStub"
         FROM app_versions v
         LEFT JOIN app_environments e ON e.id = v.current_environment_id
         WHERE v.app_id = ANY($1)
           AND v.is_stub = false
           AND (v.branch_id = ANY($2) OR v.branch_id IS NULL)`,
        [moduleAppIds, relevantBranchIds]
      )
    : [];

  // Index by app for O(1) per-viewer lookup. Sort createdAt DESC for orphan fallback.
  const rowsByApp = new Map<string, ModVerRow[]>();
  for (const r of candidateRows) {
    const list = rowsByApp.get(r.appId) ?? [];
    list.push(r);
    rowsByApp.set(r.appId, list);
  }
  for (const list of rowsByApp.values()) {
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  // Legacy clause #3: pin = branch_name → look up to confirm it's a real branch.
  const branchNames = viewers.map((v) => v.pinnedValue).filter((p) => p && !UUID_RE.test(p));
  type BranchRow = { id: string; branchName: string; isDefault: boolean };
  const branchRows: BranchRow[] = branchNames.length
    ? await manager.query(
        `SELECT id, branch_name AS "branchName", is_default AS "isDefault"
         FROM organization_git_sync_branches
         WHERE organization_id = $1
           AND branch_name = ANY($2)`,
        [organizationId, branchNames]
      )
    : [];
  const branchNameSet = new Set(branchRows.map((b) => b.branchName));

  const toResolved = (r: ModVerRow) => ({
    rowId: r.id,
    versionName: r.name,
    status: r.status,
    versionType: r.versionType,
    branchId: r.branchId,
    moduleReferenceId: r.moduleReferenceId,
    currentEnvironmentId: r.currentEnvironmentId,
    envPriority: r.envPriority,
    moduleCurrentVersionId: null as string | null, // filled in below
  });

  return viewers.map<ResolvedModuleViewer>((v) => {
    const moduleApp = v.moduleAppCoRel ? moduleAppByCoRel.get(v.moduleAppCoRel) : undefined;
    if (!moduleApp) {
      return {
        componentId: v.componentId,
        moduleAppCoRel: v.moduleAppCoRel ?? '',
        moduleAppId: null,
        moduleName: null,
        pinnedValue: v.pinnedValue,
        matchKind: 'no-row',
        resolved: null,
      };
    }
    const candidates = rowsByApp.get(moduleApp.id) ?? [];
    const pin = v.pinnedValue;
    const moduleCurrentVersionId = moduleApp.currentVersionId;

    const pickKind = (row: ModVerRow, kind: ModuleResolutionMatch): ResolvedModuleViewer => {
      const r = toResolved(row);
      r.moduleCurrentVersionId = moduleCurrentVersionId;
      return {
        componentId: v.componentId,
        moduleAppCoRel: v.moduleAppCoRel ?? '',
        moduleAppId: moduleApp.id,
        moduleName: moduleApp.name,
        pinnedValue: pin,
        matchKind: kind,
        resolved: r,
      };
    };

    if (pin && UUID_RE.test(pin)) {
      // Clause 1: id match
      const byId = candidates.find((r) => r.id === pin);
      if (byId) return pickKind(byId, 'pin-hit');
      // Clause 4: module_reference_id on consumer's branch then default then branchless
      const onConsumer = parent.branchId
        ? candidates.find(
            (r) =>
              r.moduleReferenceId === pin &&
              r.branchId === parent.branchId &&
              r.isStub === false
          )
        : undefined;
      if (onConsumer) return pickKind(onConsumer, 'pin-hit');
      if (defaultBranch) {
        const onDefault = candidates.find(
          (r) =>
            r.moduleReferenceId === pin &&
            r.branchId === defaultBranch.id &&
            r.isStub === false
        );
        if (onDefault) return pickKind(onDefault, 'pin-hit');
      } else {
        // Non-git-sync: defaultBranch === null means no WorkspaceBranch rows exist.
        const onNullBranch = candidates.find(
          (r) => r.moduleReferenceId === pin && r.branchId === null && r.isStub === false
        );
        if (onNullBranch) return pickKind(onNullBranch, 'pin-hit');
      }
      // Clause 4b: module_reference_id on branchless PUBLISHED versions
      const branchless = candidates.find(
        (r) =>
          r.moduleReferenceId === pin &&
          r.branchId === null &&
          r.isStub === false
      );
      if (branchless) return pickKind(branchless, 'pin-hit');
    } else if (pin) {
      // Clause 2: version name on a version_type='version' row in this module's app
      const byName = candidates.find((r) => r.name === pin && r.versionType === AppVersionType.VERSION);
      if (byName) return pickKind(byName, 'pin-hit');
      // Clause 3: pin is a branch_name → default-branch version_type='version' row
      if (branchNameSet.has(pin) && defaultBranch) {
        const onDefault = candidates.find(
          (r) =>
            r.branchId === defaultBranch.id && r.versionType === AppVersionType.VERSION && r.isStub === false
        );
        if (onDefault) return pickKind(onDefault, 'pin-hit');
      }
    }

    // Orphan / unpinned fallback: latest non-stub on consumer's branch, else default, else null-branch when !isGitSyncEnabled.
    const fallback =
      (parent.branchId && candidates.find((r) => r.branchId === parent.branchId && r.isStub === false)) ||
      (defaultBranch && candidates.find((r) => r.branchId === defaultBranch.id && r.isStub === false)) ||
      // Non-git-sync: prefer active draft over latest-by-date (saved versions have newer
      // createdAt than the draft they were forked from, so DESC sort would pick the wrong row).
      (!isGitSyncEnabled &&
        (candidates.find((r) => r.branchId === null && r.isStub === false && r.status === AppVersionStatus.DRAFT) ||
          candidates.find((r) => r.branchId === null && r.isStub === false))) ||
      undefined;
    if (fallback) {
      return pickKind(fallback, pin ? 'orphan-fallback' : 'unpinned-fallback');
    }

    return {
      componentId: v.componentId,
      moduleAppCoRel: v.moduleAppCoRel ?? '',
      moduleAppId: moduleApp.id,
      moduleName: moduleApp.name,
      pinnedValue: pin,
      matchKind: 'no-row',
      resolved: null,
    };
  });
}
