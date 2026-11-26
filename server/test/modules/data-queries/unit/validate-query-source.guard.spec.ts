// server/test/modules/data-queries/unit/validate-query-source.guard.spec.ts
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ValidateQuerySourceGuard } from '@modules/data-queries/guards/validate-query-source.guard';

jest.mock('@modules/data-sources/repository', () => ({ DataSourcesRepository: class {} }));
jest.mock('@modules/logging/service', () => ({ TransactionLogger: class {} }));

/** @group platform */
describe('ValidateQuerySourceGuard', () => {
  const ORGANIZATION_ID = 'workspace-1';
  const DATA_SOURCE_UUID = '8cdcdb39-8c6a-4386-ae59-bb3842b1b2f3';

  let dataSourceRepository: {
    findById: jest.Mock;
    findByQuery: jest.Mock;
    findStaticDataSourceByKind: jest.Mock;
  };
  let guard: ValidateQuerySourceGuard;
  let request: Record<string, any>;

  const makeContext = () =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext);

  beforeEach(() => {
    dataSourceRepository = {
      findById: jest.fn(),
      findByQuery: jest.fn(),
      findStaticDataSourceByKind: jest.fn(),
    };
    guard = new ValidateQuerySourceGuard(dataSourceRepository as any, { log: jest.fn() } as any);
    request = { params: {}, user: { organizationId: ORGANIZATION_ID } };
  });

  afterEach(() => jest.clearAllMocks());

  describe('built-in data sources', () => {
    it.each(['restapi', 'runjs', 'runpy', 'tooljetdb', 'workflows'])(
      'resolves %s by kind instead of looking it up as an id',
      async (kind) => {
        const dataSource = { id: DATA_SOURCE_UUID, kind, organizationId: ORGANIZATION_ID };
        request.params.dataSourceId = kind;
        dataSourceRepository.findStaticDataSourceByKind.mockResolvedValue(dataSource);

        await expect(guard.canActivate(makeContext())).resolves.toBe(true);

        expect(dataSourceRepository.findStaticDataSourceByKind).toHaveBeenCalledWith(ORGANIZATION_ID, kind);
        expect(dataSourceRepository.findById).not.toHaveBeenCalled();
        expect(request.tj_data_source).toBe(dataSource);
        expect(request.tj_resource_id).toBe(dataSource.id);
      }
    );

    it('throws NotFoundException when the workspace has no such built-in source', async () => {
      request.params.dataSourceId = 'runjs';
      dataSourceRepository.findStaticDataSourceByKind.mockResolvedValue(null);

      await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(NotFoundException);
      expect(request.tj_data_source).toBeUndefined();
    });
  });

  describe('regular data sources', () => {
    it('looks up a data source by id', async () => {
      const dataSource = { id: DATA_SOURCE_UUID, organizationId: ORGANIZATION_ID };
      request.params.dataSourceId = DATA_SOURCE_UUID;
      dataSourceRepository.findById.mockResolvedValue(dataSource);

      await expect(guard.canActivate(makeContext())).resolves.toBe(true);

      expect(dataSourceRepository.findById).toHaveBeenCalledWith(DATA_SOURCE_UUID, ORGANIZATION_ID);
      expect(dataSourceRepository.findStaticDataSourceByKind).not.toHaveBeenCalled();
    });
  });

  describe('query lookups', () => {
    it('keeps resolving the data source through the query', async () => {
      const dataSource = { id: DATA_SOURCE_UUID, organizationId: ORGANIZATION_ID };
      request.params.id = 'query-uuid';
      dataSourceRepository.findByQuery.mockResolvedValue(dataSource);

      await expect(guard.canActivate(makeContext())).resolves.toBe(true);

      expect(dataSourceRepository.findByQuery).toHaveBeenCalledWith('query-uuid', ORGANIZATION_ID, undefined);
      expect(dataSourceRepository.findStaticDataSourceByKind).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated requests', () => {
    it('throws ForbiddenException without touching the repository', async () => {
      request.params.dataSourceId = 'runjs';
      delete request.user;

      await expect(guard.canActivate(makeContext())).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSourceRepository.findStaticDataSourceByKind).not.toHaveBeenCalled();
    });
  });
});
