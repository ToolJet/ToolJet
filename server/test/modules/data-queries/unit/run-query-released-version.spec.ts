import { Response } from 'express';
import { DataQueriesService } from '@modules/data-queries/service';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { UpdateDataQueryDto } from '@modules/data-queries/dto';
import { AppAbility } from '@modules/app/decorators/ability.decorator';
import { App } from '@entities/app.entity';
import { DataSource } from '@entities/data_source.entity';
import { User } from '@entities/user.entity';
import { AppValidationService } from '@modules/app-validation/service';
import { GitSyncConfigsUtilService } from '@modules/git-sync-configs/util.service';

/**
 * Running a query from the editor writes the posted options back to the query (an authoring
 * convenience). A non-UI client (MCP/PAT) can call that run endpoint against the released version
 * directly, so the write-back has to be skipped there while the query itself still runs.
 */
describe('DataQueriesService.runQueryOnBuilder on the released version', () => {
  const RELEASED_VERSION_ID = 'released-version-id';
  const DRAFT_VERSION_ID = 'draft-version-id';
  const app = { id: 'app-id', currentVersionId: RELEASED_VERSION_ID } as App;
  const dataSource = { id: 'data-source-id' } as DataSource;
  const ability = { can: jest.fn().mockReturnValue(true) } as unknown as AppAbility;
  const options = { url: 'https://example.com' };

  let dataQueryRepository: { getOneById: jest.Mock; updateOne: jest.Mock };
  let service: DataQueriesService;
  let runAndGetResult: jest.SpyInstance;

  // The query row as the run endpoint loads it: appVersionId is a plain column, always present.
  const runQueryOn = (appVersionId: string) => {
    dataQueryRepository.getOneById.mockResolvedValue({ id: 'query-id', appVersionId, options: {}, dataSource });
    return service.runQueryOnBuilder(
      {} as User,
      'query-id',
      'environment-id',
      { options, resolvedOptions: {} } as unknown as UpdateDataQueryDto,
      ability,
      dataSource,
      {} as Response,
      undefined,
      app,
      ability
    );
  };

  beforeEach(() => {
    dataQueryRepository = { getOneById: jest.fn(), updateOne: jest.fn() };
    service = new DataQueriesService(
      dataQueryRepository as unknown as DataQueryRepository,
      {} as DataQueriesUtilService,
      {} as DataSourcesRepository,
      {} as AppValidationService,
      {} as GitSyncConfigsUtilService
    );
    runAndGetResult = jest.spyOn(service as any, 'runAndGetResult').mockResolvedValue({ status: 'ok' });
  });

  it('does not write the run options back to a query on the released version', async () => {
    await runQueryOn(RELEASED_VERSION_ID);

    expect(dataQueryRepository.updateOne).not.toHaveBeenCalled();
    expect(runAndGetResult).toHaveBeenCalledTimes(1);
  });

  it('still writes the run options back to a query on a draft version', async () => {
    await runQueryOn(DRAFT_VERSION_ID);

    expect(dataQueryRepository.updateOne).toHaveBeenCalledWith('query-id', { options });
    expect(runAndGetResult).toHaveBeenCalledTimes(1);
  });
});
