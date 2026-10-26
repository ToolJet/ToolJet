/** @group gitsync */
import { Test, TestingModule } from '@nestjs/testing';
import { DataQueriesService } from '@modules/data-queries/service';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';
import { AppVersionStatus } from '@entities/app_version.entity';

// Builder runs persist options, except on read-only versions (synced default-branch draft under branching).
const DEFAULT_BRANCH_ID = 'branch-main';
const FEATURE_BRANCH_ID = 'branch-feature';
const OPTIONS = { operation: 'delete_rows', delete_rows: { order_column_id: 'column-id' } };

describe('DataQueriesService', () => {
  describe('runQueryOnBuilder | Persisting options under git sync', () => {
    let module: TestingModule;
    let service: DataQueriesService;
    let updateOne: jest.Mock;
    let getDetails: jest.Mock;
    let runAndGetResult: jest.SpyInstance;

    async function run(appVersion: { branchId: string; isSynced: boolean; status: AppVersionStatus }) {
      const repository = module.get(DataQueryRepository) as unknown as { getOneById: jest.Mock };
      repository.getOneById.mockResolvedValue({ id: 'query-1', options: {}, appVersion });
      await service.runQueryOnBuilder(
        { organizationId: 'org-1' } as never,
        'query-1',
        'env-1',
        { options: OPTIONS, resolvedOptions: {} } as never,
        { can: () => true } as never,
        { id: 'data-source-1' } as never,
        {} as never,
        'edit'
      );
    }

    beforeEach(async () => {
      updateOne = jest.fn();
      getDetails = jest.fn().mockResolvedValue({
        isEnabled: true,
        isMultiBranchingEnabled: true,
        options: { defaultBranch: { id: DEFAULT_BRANCH_ID } },
      });

      module = await Test.createTestingModule({
        providers: [
          DataQueriesService,
          { provide: DataQueryRepository, useValue: { getOneById: jest.fn(), updateOne } },
          { provide: DataQueriesUtilService, useValue: {} },
          { provide: DataSourcesRepository, useValue: {} },
          {
            provide: GitSyncConfigsUtilService,
            useValue: { getDetails, isGitEditLocked: jest.fn().mockResolvedValue(false) },
          },
        ],
      }).compile();

      service = module.get(DataQueriesService);
      // runAndGetResult is protected; not under test.
      runAndGetResult = jest
        .spyOn(service as unknown as { runAndGetResult: () => Promise<unknown> }, 'runAndGetResult')
        .mockResolvedValue({ status: 'ok' });
    });

    it('should run without saving options on a synced draft on the default branch', async () => {
      await run({ branchId: DEFAULT_BRANCH_ID, isSynced: true, status: AppVersionStatus.DRAFT });

      expect(updateOne).not.toHaveBeenCalled();
      expect(runAndGetResult).toHaveBeenCalled();
    });

    it('should save options on a feature branch', async () => {
      await run({ branchId: FEATURE_BRANCH_ID, isSynced: true, status: AppVersionStatus.DRAFT });

      expect(updateOne).toHaveBeenCalledWith('query-1', { options: OPTIONS });
    });

    it('should save options on a default-branch draft that is not yet synced', async () => {
      await run({ branchId: DEFAULT_BRANCH_ID, isSynced: false, status: AppVersionStatus.DRAFT });

      expect(updateOne).toHaveBeenCalledWith('query-1', { options: OPTIONS });
    });

    it('should save options when branching is disabled', async () => {
      getDetails.mockResolvedValue({
        isEnabled: true,
        isMultiBranchingEnabled: false,
        options: { defaultBranch: { id: DEFAULT_BRANCH_ID } },
      });

      await run({ branchId: DEFAULT_BRANCH_ID, isSynced: true, status: AppVersionStatus.DRAFT });

      expect(updateOne).toHaveBeenCalledWith('query-1', { options: OPTIONS });
    });
  });
});
