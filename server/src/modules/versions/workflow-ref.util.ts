import { EntityManager } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { readWorkflowQueryRefs } from '@helpers/workflow_query_options.helper';
import { DRAFT_SENTINEL, WORKFLOW_CURRENT_BRANCH_SENTINEL } from './ref-sentinels';

/**
 * Workflow query ref resolution. Twin of module-ref.util.ts minus Tier 1 (workflows have no
 * module_reference_id). One divergence is deliberate and load-bearing: unpinned means "run
 * whatever's released" here, and "follow the consumer's branch" there. Change a tier in one
 * file, check the other.
 */

// Pins that follow a moving draft rather than naming a fixed version.
export function pinIsDraftSentinel(pin?: string | null): boolean {
  return pin === DRAFT_SENTINEL || pin === WORKFLOW_CURRENT_BRANCH_SENTINEL;
}

// Twin of resolveModuleRef minus Tier 1; a set-but-unresolvable pin throws instead of substituting.
export async function resolveWorkflowRef(
  manager: EntityManager,
  options: Record<string, any>,
  organizationId: string,
  defaultBranchId: string | null,
  consumerBranchId?: string
): Promise<{ appId: string | null; appVersionId: string | null }> {
  const { workflowId, workflowVersionId } = readWorkflowQueryRefs(options);
  if (!workflowId) return { appId: null, appVersionId: null };

  const workflowApp = await manager.findOne(App, {
    where: [
      { co_relation_id: workflowId, type: APP_TYPES.WORKFLOW, organizationId },
      { id: workflowId, type: APP_TYPES.WORKFLOW, organizationId },
    ],
  });
  if (!workflowApp) return { appId: null, appVersionId: null };

  // Tier C — follow the consumer app's active branch. Publish and promote callers omit
  // consumerBranchId deliberately: there the question is whether the target is publishable, so
  // this falls through to the default-branch draft and the DRAFT check blocks it.
  // No fall-through on a feature branch though: a missing BRANCH row means the workflow isn't on
  // this branch, and main's copy is not what the pin names. __default_branch_draft__ pins that.
  if (workflowVersionId === WORKFLOW_CURRENT_BRANCH_SENTINEL) {
    if (consumerBranchId && consumerBranchId !== defaultBranchId) {
      // A stub counts as absent; the hydrate cascades make that state self-healing.
      const onBranch = await manager.findOne(AppVersion, {
        where: {
          appId: workflowApp.id,
          branchId: consumerBranchId,
          versionType: AppVersionType.BRANCH,
          isStub: false,
        },
      });
      if (onBranch) return { appId: workflowApp.id, appVersionId: onBranch.id };
      throw new BadRequestException(
        'This workflow has no version on the current branch. Open or pull the workflow on this branch before running it.'
      );
    }

    const draftOnDefault = defaultBranchId
      ? await manager.findOne(AppVersion, {
          where: {
            appId: workflowApp.id,
            branchId: defaultBranchId,
            status: AppVersionStatus.DRAFT,
            versionType: AppVersionType.VERSION,
            isStub: false,
          },
          order: { createdAt: 'DESC' },
        })
      : null;
    if (draftOnDefault) return { appId: workflowApp.id, appVersionId: draftOnDefault.id };
    throw new BadRequestException(`Workflow version "${workflowVersionId}" not available`);
  }

  // Tier D — default-branch draft sentinel.
  if (workflowVersionId === DRAFT_SENTINEL) {
    const draftOnDefault = defaultBranchId
      ? await manager.findOne(AppVersion, {
          where: {
            appId: workflowApp.id,
            branchId: defaultBranchId,
            status: AppVersionStatus.DRAFT,
            versionType: AppVersionType.VERSION,
            isStub: false,
          },
          order: { createdAt: 'DESC' },
        })
      : null;
    if (draftOnDefault) return { appId: workflowApp.id, appVersionId: draftOnDefault.id };
    throw new BadRequestException(`Workflow version "${workflowVersionId}" not available`);
  }

  // Tier 0 — versionName, default-branch PUBLISHED lookup (backed by git tag <coRel>/<versionName>).
  if (workflowVersionId) {
    const pinned = defaultBranchId
      ? await manager.findOne(AppVersion, {
          where: {
            appId: workflowApp.id,
            name: workflowVersionId,
            branchId: defaultBranchId,
            status: AppVersionStatus.PUBLISHED,
            versionType: AppVersionType.VERSION,
            isStub: false,
          },
        })
      : null;
    if (pinned) return { appId: workflowApp.id, appVersionId: pinned.id };

    // Legacy pins name the default-branch DRAFT, which pre-branch-model code resolved and ran.
    // Not a substitution: this runs the version the pin names. Newest first, since an unsynced
    // app may hold several default-branch drafts.
    const draftByName = defaultBranchId
      ? await manager.findOne(AppVersion, {
          where: {
            appId: workflowApp.id,
            name: workflowVersionId,
            branchId: defaultBranchId,
            status: AppVersionStatus.DRAFT,
            versionType: AppVersionType.VERSION,
            isStub: false,
          },
          order: { createdAt: 'DESC' },
        })
      : null;
    if (draftByName) return { appId: workflowApp.id, appVersionId: draftByName.id };

    // Pin was set but nothing resolved it — fail loud, never silently run a different version.
    throw new BadRequestException(`Workflow version "${workflowVersionId}" not available`);
  }

  // Unpinned — run whatever's currently released.
  return { appId: workflowApp.id, appVersionId: workflowApp.currentVersionId ?? null };
}

// Twin of reconcileModuleViewerPinsFromDefault, keyed off DataQuery.co_relation_id instead of ModuleViewer components.
export async function reconcileWorkflowQueryPinsFromDefault(
  manager: EntityManager,
  featureBranchVersionId: string,
  _organizationId: string,
  defaultBranchId: string | null
): Promise<void> {
  const featureVersion = await manager.findOne(AppVersion, {
    where: { id: featureBranchVersionId },
    select: ['id', 'appId'],
  });
  if (!featureVersion) return;

  if (!defaultBranchId) return;

  const defaultVersion = await manager.findOne(AppVersion, {
    where: {
      appId: featureVersion.appId,
      branchId: defaultBranchId,
      versionType: AppVersionType.VERSION,
      isStub: false,
    },
    order: { createdAt: 'DESC' },
  });
  if (!defaultVersion) return;

  type WorkflowQueryRow = { id: string; co_relation_id: string | null; workflowVersionId: string | null };

  const readWorkflowQueries = (appVersionId: string): Promise<WorkflowQueryRow[]> =>
    manager.query(
      `SELECT dq.id, dq.co_relation_id,
              dq.options::jsonb ->> 'workflowVersionId' AS "workflowVersionId"
       FROM data_queries dq
       JOIN data_sources ds ON ds.id = dq.data_source_id
       WHERE dq.app_version_id = $1
         AND ds.kind = 'workflows'
         AND dq.co_relation_id IS NOT NULL`,
      [appVersionId]
    );

  const featureQueries = await readWorkflowQueries(featureBranchVersionId);
  if (featureQueries.length === 0) return;

  const defaultQueries = await readWorkflowQueries(defaultVersion.id);
  const defaultByCoRel = new Map(
    defaultQueries.filter((q) => q.co_relation_id).map((q) => [q.co_relation_id as string, q])
  );

  for (const feat of featureQueries) {
    if (!feat.co_relation_id) continue;
    const def = defaultByCoRel.get(feat.co_relation_id);
    if (!def?.workflowVersionId) continue; // nothing to inherit
    if (feat.workflowVersionId === def.workflowVersionId) continue;

    await manager.query(
      `UPDATE data_queries SET options = jsonb_set(options::jsonb, '{workflowVersionId}', to_jsonb($1::text))
       WHERE id = $2`,
      [def.workflowVersionId, feat.id]
    );
  }
}

/**
 * Reference-detection outcome for one embedded-workflow DataQuery: the co_relation_id of
 * the workflow App it targets.
 */
export interface ResolvedWorkflowRef {
  dataQueryId: string;
  workflowCoRel: string;
}

/**
 * Resolve every workflow-kind DataQuery under parentVersionId to the co_relation_id of the
 * workflow App it embeds. Twin of resolveAllModuleViewersForVersion, but the reference lives
 * on a DataQuery (its DataSource.kind === 'workflows') instead of a ModuleViewer component.
 *
 * `options.workflowId` is a co_relation_id post-B9 migration, but matched against id OR
 * co_relation_id here for rows the migration hasn't reached yet — same tolerance as
 * resolveWorkflowRef. This function only enumerates refs; it does not itself resolve a version
 * pin (see resolveWorkflowRef for that) — `defaultBranchId` is accepted for call-site parity
 * with resolveAllModuleViewersForVersion but unused, since there's no pin-tier work here.
 */
export async function resolveAllWorkflowRefsForVersion(
  manager: EntityManager,
  parentVersionId: string,
  organizationId: string,
  _defaultBranchId: string | null
): Promise<ResolvedWorkflowRef[]> {
  type WorkflowQueryRow = { dataQueryId: string; options: Record<string, any> };
  const rows: WorkflowQueryRow[] = await manager.query(
    `SELECT dq.id AS "dataQueryId", dq.options AS "options"
     FROM data_queries dq
     JOIN data_sources ds ON ds.id = dq.data_source_id
     WHERE dq.app_version_id = $1 AND ds.kind = 'workflows'`,
    [parentVersionId]
  );
  if (rows.length === 0) return [];

  const refs: { dataQueryId: string; workflowId: string }[] = [];
  for (const row of rows) {
    const { workflowId } = readWorkflowQueryRefs(row.options);
    if (workflowId) refs.push({ dataQueryId: row.dataQueryId, workflowId });
  }
  if (refs.length === 0) return [];

  // workflowId is a co_relation_id post-B9, but matched against id OR co_relation_id for
  // rows the migration hasn't reached yet.
  const rawIds = Array.from(new Set(refs.map((r) => r.workflowId)));
  const workflowApps: { id: string; coRel: string }[] = await manager.query(
    `SELECT id, co_relation_id AS "coRel" FROM apps
     WHERE (id::text = ANY($1) OR co_relation_id::text = ANY($1))
       AND type = $2 AND organization_id = $3`,
    [rawIds, APP_TYPES.WORKFLOW, organizationId]
  );
  const coRelByRawId = new Map<string, string>();
  for (const app of workflowApps) {
    coRelByRawId.set(app.id, app.coRel);
    coRelByRawId.set(app.coRel, app.coRel);
  }

  return refs
    .map((r) => ({ dataQueryId: r.dataQueryId, workflowCoRel: coRelByRawId.get(r.workflowId) }))
    .filter((r): r is ResolvedWorkflowRef => !!r.workflowCoRel);
}
