/**
 * PlatformGitPullService.removeOrphanedResources — BullMQ schedule cleanup on pull-deleted apps.
 *
 * removeOrphanedResources deletes the AppVersion row(s) of anything that vanished from git
 * upstream. Postgres cascades (workflow_schedules.workflow_id -> app_versions.id ON DELETE
 * CASCADE) clean up the DB-side WorkflowSchedule row for free, but the corresponding BullMQ
 * repeatable job in Redis has no idea a Postgres row disappeared — it is only deregistered when
 * application code emits 'app.deleted' (AppsActionsListener.handleAppDeletion ->
 * WorkflowSchedulerService.removeSchedule). AppsService.delete() (both editions) already emits
 * this event before its own AppVersion deletes; removeOrphanedResources is a second, independent
 * AppVersion-delete path that was missing it — invisible on `main` because `main`'s PullKind has
 * no 'workflow' member, so this function could never reach a schedule-bearing row there. This
 * branch adds workflow-kind pulls (`type PullKind = 'app' | 'module' | 'workflow'`), which is
 * what first lets a real, schedule-bearing AppVersion reach this delete.
 *
 * Only removeOrphanedResources is under test — no git or real DB is touched; the DB layer is a
 * hand-rolled in-memory double keyed the same way the real query builders are.
 *
 * @group workflows
 * @group gitsync
 */
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { AppVersion } from '@entities/app_version.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

// removeOrphanedResources calls dbTransactionWrap(operation) with no manager arg. The real
// dbTransactionWrap's own internal call to getConnectionInstance() is a closure over its own
// module instance — overriding getConnectionInstance as a sibling export does NOT redirect it
// (jest.requireActual gives back the genuine function, whose internal binding is untouched by
// what the mock factory's export object contains). Mock dbTransactionWrap itself instead so the
// operation callback runs directly against the fake manager, no real connection involved.
const mockMakeManager = jest.fn();
jest.mock('@helpers/database.helper', () => ({
  ...jest.requireActual('@helpers/database.helper'),
  dbTransactionWrap: async (operation: (m: any) => any, manager?: any) => operation(manager ?? mockMakeManager()),
}));

const ORG = 'org-1';
const BRANCH = 'branch-1';

describe('PlatformGitPullService.removeOrphanedResources — schedule cleanup', () => {
  let service: PlatformGitPullService;
  let emitSpy: jest.SpyInstance;
  let deleteSpy: jest.Mock;
  /** dbApps rows the first query (orphan candidates) returns — seeded per test. */
  let dbAppRows: Array<{ appId: string; coRelationId: string; versionId: string }>;
  /** WorkflowSchedule rows, keyed by the AppVersion id they belong to (ws.workflow_id). */
  let scheduleRows: Array<{ id: string; workflowId: string }>;

  const makeManager = () => {
    const manager: any = {
      transaction: jest.fn(async (cb: (m: any) => any) => cb(manager)),
      delete: deleteSpy,
      createQueryBuilder: jest.fn((entity: any) => {
        let whereParams: Record<string, any> = {};
        const qb: any = {
          innerJoin: jest.fn(() => qb),
          where: jest.fn((_cond: string, params: Record<string, any> = {}) => {
            whereParams = { ...whereParams, ...params };
            return qb;
          }),
          andWhere: jest.fn((_cond: string, params: Record<string, any> = {}) => {
            whereParams = { ...whereParams, ...params };
            return qb;
          }),
          select: jest.fn(() => qb),
          distinct: jest.fn(() => qb),
          getRawMany: jest.fn(async () => (entity === App ? dbAppRows : [])),
          getMany: jest.fn(async () => {
            if (entity !== WorkflowSchedule) return [];
            const versionIds: string[] = whereParams.versionIds ?? [];
            return scheduleRows.filter((s) => versionIds.includes(s.workflowId));
          }),
        };
        return qb;
      }),
    };
    return manager;
  };

  beforeEach(async () => {
    dbAppRows = [];
    scheduleRows = [];
    deleteSpy = jest.fn(async () => ({ affected: 1 }));
    mockMakeManager.mockImplementation(() => makeManager());

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
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(PlatformGitPullService);
    emitSpy = jest.spyOn(module.get(EventEmitter2), 'emit');
  });

  afterEach(() => jest.restoreAllMocks());

  const run = (metaCoRelIds: Set<string> = new Set()) =>
    (service as any).removeOrphanedResources(ORG, BRANCH, 'workflow', metaCoRelIds);

  it('emits app.deleted with the schedule id when the orphaned workflow has an active schedule', async () => {
    dbAppRows = [{ appId: 'app-1', coRelationId: 'co-rel-1', versionId: 'v-1' }];
    scheduleRows = [{ id: 'sched-1', workflowId: 'v-1' }];

    await run();

    expect(emitSpy).toHaveBeenCalledWith('app.deleted', { appId: 'app-1', scheduleIds: ['sched-1'] });
  });

  it('still deletes the AppVersion row when a schedule was cleaned up', async () => {
    dbAppRows = [{ appId: 'app-1', coRelationId: 'co-rel-1', versionId: 'v-1' }];
    scheduleRows = [{ id: 'sched-1', workflowId: 'v-1' }];

    await run();

    expect(deleteSpy).toHaveBeenCalledWith(AppVersion, { appId: 'app-1', branchId: BRANCH });
  });

  it('does not emit when the orphaned workflow has no schedule', async () => {
    dbAppRows = [{ appId: 'app-1', coRelationId: 'co-rel-1', versionId: 'v-1' }];
    scheduleRows = [];

    await run();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith(AppVersion, { appId: 'app-1', branchId: BRANCH });
  });

  it('emits only for the orphaned app that actually has a schedule, not its schedule-less sibling', async () => {
    dbAppRows = [
      { appId: 'app-1', coRelationId: 'co-rel-1', versionId: 'v-1' },
      { appId: 'app-2', coRelationId: 'co-rel-2', versionId: 'v-2' },
    ];
    scheduleRows = [{ id: 'sched-1', workflowId: 'v-1' }];

    await run();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith('app.deleted', { appId: 'app-1', scheduleIds: ['sched-1'] });
  });

  it('does nothing at all when nothing is orphaned', async () => {
    dbAppRows = [{ appId: 'app-1', coRelationId: 'co-rel-1', versionId: 'v-1' }];
    scheduleRows = [{ id: 'sched-1', workflowId: 'v-1' }];

    // Present in git meta -> not orphaned.
    await run(new Set(['co-rel-1']));

    expect(emitSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
