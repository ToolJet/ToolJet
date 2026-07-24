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
const DRAFT_SENTINEL = '__default_branch_draft__';

/**
 * Resolve a ModuleViewer reference to an actual AppVersion row.
 *
 *   ref is a non-UUID string (versionName)  → Tier 0: look by name on consumer branch
 *                                              then default. Cross-workspace stable
 *                                              because versionName is backed by a git tag.
 *   ref is a valid UUID (moduleReferenceId) → Tier 1: look by module_reference_id on
 *                                              consumer branch then default. Same-workspace
 *                                              fast path.
 *   ref absent / no match                   → unpinned/orphaned fallback: latest non-stub
 *                                              on the consumer's branch (or default).
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
  const defaultBranch = await findDefaultBranch(manager, organizationId);
  const isGitSyncEnabled = !!defaultBranch;

  // Tier D — default-branch draft sentinel. Resolves to the DRAFT on the default branch
  // at query time, ignoring consumerBranchId entirely. Stored when the user explicitly
  // pins to "main draft" in the inspector. Follows default branch renames automatically
  // because findDefaultBranch uses isDefault:true, not a hardcoded name.
  if (moduleReferenceId === DRAFT_SENTINEL) {
    if (defaultBranch) {
      const draftOnDefault = await manager.findOne(AppVersion, {
        where: {
          appId: moduleApp.id,
          branchId: defaultBranch.id,
          status: AppVersionStatus.DRAFT,
          versionType: AppVersionType.VERSION,
          isStub: false,
        },
        order: { createdAt: 'DESC' },
      });
      if (draftOnDefault) return draftOnDefault;
    }
    // Default branch or draft not found — explicit pin, so fail clean instead of silent fallback.
    return null;
  }

  // Tier 0 — versionName lookup (non-UUID ref, cross-workspace stable).
  // git-sync: branchless PUBLISHED only — branched rows are always DRAFTs by constraint
  //   chk_app_versions_branched_implies_draft, so checking PUBLISHED first prevents a
  //   same-named branch DRAFT shadowing the real release.
  // non-git-sync: also check branchless any-status — DRAFTs are valid specific pins and
  //   all rows are branchless (no WorkspaceBranch rows exist).
  if (moduleReferenceId && !UUID_RE.test(moduleReferenceId)) {
    const versionName = moduleReferenceId;
    const branchlessForName = await manager.findOne(AppVersion, {
      where: {
        appId: moduleApp.id,
        name: versionName,
        branchId: IsNull(),
        status: AppVersionStatus.PUBLISHED,
        versionType: AppVersionType.VERSION,
        isStub: false,
      },
    });
    if (branchlessForName) return branchlessForName;
    if (!isGitSyncEnabled) {
      const branchlessDraft = await manager.findOne(AppVersion, {
        where: { appId: moduleApp.id, name: versionName, branchId: IsNull(),
                 versionType: AppVersionType.VERSION, isStub: false },
      });
      if (branchlessDraft) return branchlessDraft;
    }
    // Name not found — fall through to orphan guard.
  }

  // Tier 1 — UUID lookup (moduleReferenceId, same-workspace fast path).
  // git-sync: branched rows are always DRAFTs (chk_app_versions_branched_implies_draft) —
  // a pin must only resolve to a branchless PUBLISHED row.
  // non-git-sync: no branch rows exist; branchless lookup with no status filter is correct.
  if (moduleReferenceId && UUID_RE.test(moduleReferenceId)) {
    if (isGitSyncEnabled) {
      // git-sync: only branchless PUBLISHED.
      const published = await manager.findOne(AppVersion, {
        where: {
          appId: moduleApp.id,
          moduleReferenceId,
          branchId: IsNull(),
          status: AppVersionStatus.PUBLISHED,
          isStub: false,
        },
      });
      if (published) return published;
    } else {
      // Non-git-sync: branchless (all rows are valid, no status filter needed).
      const byMref = await manager.findOne(AppVersion, {
        where: { appId: moduleApp.id, moduleReferenceId, branchId: IsNull(), isStub: false },
      });
      if (byMref) return byMref;
    }
    // id present but no match — orphan fallback below.
  }

  // Unpinned OR orphaned: latest non-stub on consumer's branch (or default).
  // If a ref was provided but no tier matched, return null — don't silently load the wrong version.
  if (moduleReferenceId) return null;

  const targetBranchId = consumerBranchId ?? defaultBranch?.id;
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
    moduleVersionName: string | null;
  };

  const readViewers = (appVersionId: string): Promise<ViewerRow[]> =>
    manager.query(
      `SELECT c.id, c.co_relation_id,
              c.properties->'moduleAppId'->>'value' AS "moduleAppId",
              c.properties->'moduleVersionId'->>'value' AS "moduleVersionId",
              c.properties->'moduleVersionId'->>'versionName' AS "moduleVersionName"
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
    if (feat.moduleVersionId === def.moduleVersionId && feat.moduleVersionName === def.moduleVersionName) continue;

    const moduleApp = def.moduleAppId
      ? await manager.findOne(App, {
          where: { co_relation_id: def.moduleAppId, type: APP_TYPES.MODULE, organizationId },
          order: { createdAt: 'ASC' },
        })
      : null;
    if (!moduleApp) continue;

    await manager.query(
      `UPDATE components
       SET properties = jsonb_set(
                          jsonb_set(properties::jsonb, '{moduleVersionId,value}', to_jsonb($1::text)),
                          '{moduleVersionId,versionName}', to_jsonb($2::text)
                        )
       WHERE id = $3`,
      [def.moduleVersionId, def.moduleVersionName ?? '', feat.id]
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
 *   0. __default_branch_draft__ sentinel → DRAFT on default branch
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
            COALESCE(
              NULLIF(c.properties::jsonb -> 'moduleVersionId' ->> 'versionName', ''),
              COALESCE(c.properties::jsonb -> 'moduleVersionId' ->> 'value', '')
            ) AS "pinnedValue"
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
      if (isGitSyncEnabled) {
        // git-sync: only branchless PUBLISHED (branched rows are always DRAFTs by constraint).
        const published = candidates.find(
          (r) =>
            r.moduleReferenceId === pin &&
            r.branchId === null &&
            r.status === AppVersionStatus.PUBLISHED &&
            r.isStub === false
        );
        if (published) return pickKind(published, 'pin-hit');
      } else {
        // Non-git-sync: branchless, no status filter.
        const byMref = candidates.find(
          (r) => r.moduleReferenceId === pin && r.branchId === null && r.isStub === false
        );
        if (byMref) return pickKind(byMref, 'pin-hit');
      }
    } else if (pin) {
      // Clause 0: default-branch draft sentinel
      if (pin === DRAFT_SENTINEL && defaultBranch) {
        const draftOnDefault = candidates.find(
          (r) =>
            r.branchId === defaultBranch.id &&
            r.status === AppVersionStatus.DRAFT &&
            r.versionType === AppVersionType.VERSION
        );
        if (draftOnDefault) return pickKind(draftOnDefault, 'pin-hit');
      }
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
