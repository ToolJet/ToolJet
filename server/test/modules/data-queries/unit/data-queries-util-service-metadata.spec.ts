import { Test } from '@nestjs/testing';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { VersionRepository } from '@modules/versions/repository';
import { ConfigService } from '@nestjs/config';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { PluginsServiceSelector } from '@modules/data-sources/services/plugin-selector.service';

describe('DataQueriesUtilService.runQuery — isPublic/appName resolution', () => {
  let service: DataQueriesUtilService;
  let runMock: jest.Mock;

  beforeEach(async () => {
    runMock = jest.fn().mockResolvedValue({ status: 'ok' });

    const module = await Test.createTestingModule({
      providers: [
        DataQueriesUtilService,
        { provide: VersionRepository, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('false') } },
        {
          provide: AppEnvironmentUtilService,
          useValue: { getOptions: jest.fn().mockResolvedValue({ environmentId: 'env-1', options: {} }) },
        },
        {
          provide: DataSourcesUtilService,
          useValue: { parseSourceOptions: jest.fn().mockResolvedValue({}) },
        },
        {
          provide: PluginsServiceSelector,
          useValue: { getService: jest.fn().mockResolvedValue({ run: runMock }) },
        },
      ],
    }).compile();

    service = module.get(DataQueriesUtilService);
    jest.spyOn(service as any, 'parseQueryOptions').mockResolvedValue({});
  });

  it('should use the app_versions row (not the raw App) for isPublic on a workflow', async () => {
    const appToUse = { id: 'app-1', type: 'workflow', isPublic: true, name: 'Old Name', organizationId: 'org-1' } as any;
    const dataQuery = {
      dataSource: { id: 'ds-1', kind: 'other', pluginId: 'plugin-1', options: {} },
      appVersion: { isPublic: false, appName: 'New Name', branchId: null },
    } as any;
    const response = { cookie: jest.fn(), setHeader: jest.fn() } as any;

    await service.runQuery(undefined as any, dataQuery, {}, response, undefined, undefined, appToUse);

    expect(runMock).toHaveBeenCalled();
    const runArgs = runMock.mock.calls[0];
    expect(runArgs[4]).toMatchObject({ app: { id: 'app-1', isPublic: false } });
  });
});
