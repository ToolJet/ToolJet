import { Test, TestingModule } from '@nestjs/testing';
import { DataQueriesService } from '@modules/data-queries/service';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { AppValidationService } from '@modules/app-validation/service';
import { AppVersionStatus } from '@entities/app_version.entity';

// Builder runs persist options, except on the released version (App.currentVersionId): a non-UI
// client (MCP/PAT) can call the run endpoint against it directly, and it must stay frozen.
const RELEASED_VERSION_ID = 'version-released';
const DRAFT_VERSION_ID = 'version-draft';
const OPTIONS = { url: 'https://example.com' };

describe('DataQueriesService', () => {
  describe('runQueryOnBuilder | Persisting options on the released version', () => {
    let module: TestingModule;
    let service: DataQueriesService;
    let updateOne: jest.Mock;
    let runAndGetResult: jest.SpyInstance;

    async function run(appVersionId: string) {
      const repository = module.get(DataQueryRepository) as unknown as { getOneById: jest.Mock };
      repository.getOneById.mockResolvedValue({
        id: 'query-1',
        appVersionId,
        options: {},
        appVersion: { id: appVersionId, branchId: 'branch-main', isSynced: false, status: AppVersionStatus.DRAFT },
      });
      await service.runQueryOnBuilder(
        { organizationId: 'org-1' } as never,
        'query-1',
        'env-1',
        { options: OPTIONS, resolvedOptions: {} } as never,
        { can: () => true } as never,
        { id: 'data-source-1' } as never,
        {} as never,
        'edit',
        { id: 'app-1', currentVersionId: RELEASED_VERSION_ID } as never
      );
    }

    beforeEach(async () => {
      updateOne = jest.fn();

      module = await Test.createTestingModule({
        providers: [
          DataQueriesService,
          { provide: DataQueryRepository, useValue: { getOneById: jest.fn(), updateOne } },
          { provide: DataQueriesUtilService, useValue: {} },
          { provide: DataSourcesRepository, useValue: {} },
          { provide: AppValidationService, useValue: {} },
          {
            provide: GitSyncConfigsUtilService,
            useValue: {
              getDetails: jest.fn().mockResolvedValue({ isEnabled: false }),
              isGitEditLocked: jest.fn().mockResolvedValue(false),
            },
          },
        ],
      }).compile();

      service = module.get(DataQueriesService);
      // runAndGetResult is protected; not under test.
      runAndGetResult = jest
        .spyOn(service as unknown as { runAndGetResult: () => Promise<unknown> }, 'runAndGetResult')
        .mockResolvedValue({ status: 'ok' });
    });

    it('should run without saving options on the released version', async () => {
      await run(RELEASED_VERSION_ID);

      expect(updateOne).not.toHaveBeenCalled();
      expect(runAndGetResult).toHaveBeenCalled();
    });

    it('should save options on a version that is not released', async () => {
      await run(DRAFT_VERSION_ID);

      expect(updateOne).toHaveBeenCalledWith('query-1', { options: OPTIONS });
      expect(runAndGetResult).toHaveBeenCalled();
    });
  });
});
