/**
 * PlatformGitPullService.hydrateReferencedWorkflowStubs — creating stubs for workflows this
 * workspace has never pulled.
 *
 * The method's job is to take the workflow references in an app's exported JSON and make each
 * one real: create the `apps` row if it is missing, then hydrate it (honouring a version pin).
 *
 * Phase 11 Step 11.1 fixed the create half, which could never fire: the missing-stub set was
 * derived from `apps` rows that already existed, so a brand-new workflow was absent from it and
 * hit an early return instead. See ../fixes.md entry 21. The first three cases below fail on the
 * pre-11.1 code.
 *
 * Only this method is under test — pullWorkflows and the two hydrate entry points are spied, so
 * no git or real DB is touched. The pullWorkflows spy performs the side effect it stands in for
 * (an `apps` row AND a stub `app_version`), or the loop would `continue` without hydrating and
 * these would pass for the wrong reason.
 *
 * Mutation-tested 2026-09-07: nine mutations of this method are each caught by at least one case
 * below — reverting 11.1, dropping the post-pull re-read, hoisting the pin map above the pull,
 * removing the sentinel guard, widening the pull filter to every ref, dropping the `kind` filter,
 * dropping the pre-B9 app-PK arm, dropping first-wins dedupe, and dropping the `!workflowId`
 * guard. Not covered, deliberately: removing `if (!workflowCoRelIds.size) return` is an
 * equivalent mutant — the loop iterates an empty set either way, so it saves a query rather than
 * changing behaviour. The git tree-SHA freshness arm needs a real repo on disk and belongs in e2e.
 *
 * @group workflows
 * @group gitsync
 */
import { Test } from '@nestjs/testing';
import { PlatformGitPullService } from '@ee/platform-git-sync/pull.service';
import { GitSyncAdapter } from '@ee/git-sync/git-sync-adapter';
import { WorkspaceGitSyncAdapter } from '@ee/git-sync/workspace-git-sync-adapter';
import { ImportExportResourcesService } from '@ee/import-export-resources/service';
import { HTTPSGitSyncUtilityService } from '@ee/git-sync/providers/github-https/util.service';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { GitObjectCacheService } from '@ee/git-sync-configs/services/git-object-cache.service';
import { FoldersUtilService } from '@ee/folders/util.service';
import { FolderAppsUtilService } from '@ee/folder-apps/util.service';
import { AppsUtilService } from '@ee/apps/util.service';
import { GitOperationsUtil } from '@ee/app-git/shared/git-operations.util';
import { TransactionLogger } from '@modules/logging/service';
import { GitSyncConfigsUtilService } from '@ee/git-sync-configs/util.service';
import { SourceControlProviderService } from '@ee/git-sync/source-control-provider';
import { App } from '@entities/app.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

// getConnectionInstance is called inside the method rather than injected, so the module has to
// be mocked. dbTransactionWrap is left real — this method does not use it.
const mockGetConnectionInstance = jest.fn();
jest.mock('@helpers/database.helper', () => ({
  ...jest.requireActual('@helpers/database.helper'),
  getConnectionInstance: () => mockGetConnectionInstance(),
}));

const ORG = 'org-1';
const BRANCH = 'branch-main';
const REPO = '/tmp/does-not-matter';
const USER = { id: 'user-1' } as any;

/** An app JSON carrying one workflow-kind data query per (id, pin) pair. */
const appJsonWith = (refs: Array<{ workflowId: string; pin?: string }>) => ({
  appV2: {
    dataQueries: refs.map((r, i) => ({
      id: `dq-${i}`,
      kind: 'workflows',
      options: { workflowId: r.workflowId, ...(r.pin ? { workflowVersionId: r.pin } : {}) },
    })),
  },
});

describe('PlatformGitPullService.hydrateReferencedWorkflowStubs', () => {
  let service: PlatformGitPullService;
  /** Fake DB. Both tables are mutated by the pullWorkflows spy to simulate stub creation. */
  let appRows: Array<{ id: string; coRel: string }>;
  let versionRows: Array<Record<string, any>>;
  let pullWorkflowsSpy: jest.SpyInstance;
  let hydratePinnedSpy: jest.SpyInstance;
  let hydrateStubAppSpy: jest.SpyInstance;

  /** Seed an existing, already-stubbed workflow — the state a prior pull leaves behind. */
  const seedStubbedWorkflow = (coRel: string, appId = `app-${coRel}`) => {
    appRows.push({ id: appId, coRel });
    versionRows.push({ id: `v-${coRel}`, appId, branchId: BRANCH, isStub: true, status: 'DRAFT' });
  };

  /**
   * `query` is the raw apps lookup, matched on the rawIds it is handed exactly as the SQL does.
   * `findOne` dispatches on entity and matches every field of the where clause, so a lookup that
   * names the wrong column genuinely misses rather than falling through to a lucky row.
   */
  const makeManager = () => ({
    query: jest.fn(async (_sql: string, params: any[]) => {
      const rawIds: string[] = params[0];
      return appRows.filter((r) => rawIds.includes(r.id) || rawIds.includes(r.coRel));
    }),
    findOne: jest.fn(async (entity: any, opts: any) => {
      const where = opts?.where ?? {};
      if (entity === WorkspaceBranch) return { id: BRANCH, isDefault: true };
      if (entity === App) {
        const row = appRows.find((r) => r.coRel === where.co_relation_id);
        return row ? { id: row.id, co_relation_id: row.coRel, organizationId: ORG } : null;
      }
      // AppVersion — match the where clause field-by-field.
      return versionRows.find((v) => Object.entries(where).every(([k, val]) => v[k] === val)) ?? null;
    }),
  });

  beforeEach(async () => {
    appRows = [];
    versionRows = [];
    mockGetConnectionInstance.mockReturnValue({ manager: makeManager() });

    const module = await Test.createTestingModule({
      providers: [
        PlatformGitPullService,
        { provide: GitSyncAdapter, useValue: {} },
        { provide: WorkspaceGitSyncAdapter, useValue: {} },
        { provide: ImportExportResourcesService, useValue: {} },
        { provide: HTTPSGitSyncUtilityService, useValue: {} },
        { provide: OrganizationGitSyncRepository, useValue: {} },
        { provide: FoldersUtilService, useValue: {} },
        { provide: FolderAppsUtilService, useValue: {} },
        { provide: GitOperationsUtil, useValue: {} },
        { provide: TransactionLogger, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: AppsUtilService, useValue: {} },
        { provide: GitSyncConfigsUtilService, useValue: {} },
        { provide: GitObjectCacheService, useValue: {} },
        { provide: SourceControlProviderService, useValue: {} },
      ],
    }).compile();

    service = module.get(PlatformGitPullService);

    // pullWorkflows is what creates the stub rows, so the spy also performs that side effect —
    // otherwise the re-read after it would still see nothing and the test would prove nothing.
    // pullWorkflows is what creates the rows, so the spy performs that side effect: an apps row
    // AND a stub app_version on the target branch. Without the version row the loop below would
    // `continue` without hydrating (pull.service.ts, the `if (!shouldHydrate)` arm) and the test
    // would pass for the wrong reason.
    pullWorkflowsSpy = jest.spyOn(service as any, 'pullWorkflows').mockImplementation(async (..._args: any[]) => {
      const filter: Set<string> = _args[5];
      for (const coRel of filter ?? []) seedStubbedWorkflow(coRel, `app-for-${coRel}`);
      return { imported: filter?.size ?? 0, skipped: 0, stale: 0, outdated: 0 };
    });
    hydratePinnedSpy = jest.spyOn(service as any, 'hydrateWorkflowPinnedVersion').mockResolvedValue(undefined);
    hydrateStubAppSpy = jest.spyOn(service as any, 'hydrateStubApp').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  const run = (json: any) =>
    (service as any).hydrateReferencedWorkflowStubs(json, USER, BRANCH, ORG, REPO, undefined, undefined);

  // ---- the Step 11.1 regression: these three fail on the pre-fix code ----

  it('pulls a workflow that has no apps row yet, using the stored id as the co_relation_id', async () => {
    await run(appJsonWith([{ workflowId: 'co-rel-new' }]));

    expect(pullWorkflowsSpy).toHaveBeenCalledTimes(1);
    const filter = pullWorkflowsSpy.mock.calls[0][5] as Set<string>;
    expect([...filter]).toEqual(['co-rel-new']);
  });

  it('hydrates the workflow it just created, rather than returning early', async () => {
    await run(appJsonWith([{ workflowId: 'co-rel-new' }]));
    expect(hydrateStubAppSpy).toHaveBeenCalled();
    expect(hydrateStubAppSpy.mock.calls[0][0]).toMatchObject({ co_relation_id: 'co-rel-new' });
  });

  it('keeps a version pin across the create, so a pinned workflow does not fall back to HEAD', async () => {
    // The pin map has to be built from the rows re-read AFTER the pull. Built before, a
    // newly-created workflow has no row to key off and its pin is silently dropped.
    await run(appJsonWith([{ workflowId: 'co-rel-new', pin: 'v3' }]));

    expect(hydratePinnedSpy).toHaveBeenCalledTimes(1);
    expect(hydratePinnedSpy.mock.calls[0][3]).toBe('v3');
    expect(hydrateStubAppSpy).not.toHaveBeenCalled();
  });

  // ---- no behaviour change where the row already exists ----

  it('does not pull when every referenced workflow already exists', async () => {
    seedStubbedWorkflow('co-rel-known', 'app-1');
    await run(appJsonWith([{ workflowId: 'co-rel-known' }]));

    expect(pullWorkflowsSpy).not.toHaveBeenCalled();
    expect(hydrateStubAppSpy).toHaveBeenCalled();
  });

  it('resolves a legacy pre-B9 reference stored as the target app PK without pulling', async () => {
    seedStubbedWorkflow('co-rel-known', 'app-1');
    await run(appJsonWith([{ workflowId: 'app-1' }]));

    expect(pullWorkflowsSpy).not.toHaveBeenCalled();
    expect(hydrateStubAppSpy).toHaveBeenCalled();
  });

  it('pulls only the missing one when a mix of known and new workflows is referenced', async () => {
    seedStubbedWorkflow('co-rel-known', 'app-1');
    await run(appJsonWith([{ workflowId: 'co-rel-known' }, { workflowId: 'co-rel-new' }]));

    expect(pullWorkflowsSpy).toHaveBeenCalledTimes(1);
    expect([...(pullWorkflowsSpy.mock.calls[0][5] as Set<string>)]).toEqual(['co-rel-new']);
    // Both end up hydrated.
    expect(hydrateStubAppSpy).toHaveBeenCalledTimes(2);
  });

  // ---- guards that must survive the change ----

  it('treats a draft sentinel as unpinned — a sentinel is not a git tag', async () => {
    await run(appJsonWith([{ workflowId: 'co-rel-new', pin: '__current_branch__' }]));

    expect(pullWorkflowsSpy).toHaveBeenCalledTimes(1);
    expect(hydratePinnedSpy).not.toHaveBeenCalled();
    expect(hydrateStubAppSpy).toHaveBeenCalled();
  });

  it('does nothing when the app has no workflow-kind queries', async () => {
    await run({ appV2: { dataQueries: [{ id: 'dq-0', kind: 'restapi', options: {} }] } });

    expect(pullWorkflowsSpy).not.toHaveBeenCalled();
    expect(hydrateStubAppSpy).not.toHaveBeenCalled();
  });

  it('ignores a non-workflow query even when its options still carry a workflowId', async () => {
    // Reachable state: a query switched away from the workflows data source keeps its old
    // options. Only `kind` says whether a row is a workflow reference, so a stale option must
    // not cause a workflow to be created.
    await run({
      appV2: {
        dataQueries: [{ id: 'dq-0', kind: 'restapi', options: { workflowId: 'co-rel-stale' } }],
      },
    });

    expect(pullWorkflowsSpy).not.toHaveBeenCalled();
    expect(hydrateStubAppSpy).not.toHaveBeenCalled();
  });

  it('keeps the FIRST pin when two queries reference the same workflow with different pins', async () => {
    // First-wins is the documented rule (`pinnedVersionByRawId.has(...)` short-circuit). Two
    // queries against one workflow is the common case, so a later ref must not overwrite.
    await run(
      appJsonWith([
        { workflowId: 'co-rel-new', pin: 'v1' },
        { workflowId: 'co-rel-new', pin: 'v2' },
      ])
    );

    expect(hydratePinnedSpy).toHaveBeenCalledTimes(1);
    expect(hydratePinnedSpy.mock.calls[0][3]).toBe('v1');
  });

  it('ignores an unconfigured workflow query (no workflowId) instead of pulling', async () => {
    await run({ appV2: { dataQueries: [{ id: 'dq-0', kind: 'workflows', options: {} }] } });

    expect(pullWorkflowsSpy).not.toHaveBeenCalled();
    expect(hydrateStubAppSpy).not.toHaveBeenCalled();
  });

  it('does nothing when the JSON carries no data queries at all', async () => {
    await run({ appV2: {} });
    expect(pullWorkflowsSpy).not.toHaveBeenCalled();
  });
});
