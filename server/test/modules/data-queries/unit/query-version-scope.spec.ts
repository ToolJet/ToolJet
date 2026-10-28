/**
 * Version scoping of data query update/delete (MCP validation report 2026-10-15, G1).
 *
 * The routes carry /versions/:versionId, but the service looked rows up by id alone:
 * a query of ANY app the caller could name was updatable/deletable through any other
 * app's version URL — and the promoted-version and git-sync guards had evaluated
 * against the URL's version, not the one actually written. Both methods must scope
 * the lookup to the URL's version and 404 on a miss.
 *
 * Strategy (repo precedent: apps-service-delete-guard.spec.ts): mock dbTransactionWrap,
 * stub the constructor dependencies, and drive findOne per test.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataQuery } from '@entities/data_query.entity';

const findOne = jest.fn();
const query = jest.fn();

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => {
    return cb({ findOne, query });
  }),
}));

import { DataQueriesService } from '@modules/data-queries/service';

describe('DataQueriesService version scoping', () => {
  const dataQueryRepository = {
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteDataQueryEvents: jest.fn(),
    // Not a library query: the library guards skip without touching the database.
    getOneById: jest.fn().mockResolvedValue(null),
    findLibraryConsumers: jest.fn().mockResolvedValue([]),
    manager: { query },
  };
  const dataQueryUtilService = { validateQueryActionsAgainstEnvironment: jest.fn().mockResolvedValue(undefined) };
  const appValidationService = { check: jest.fn().mockResolvedValue({ errors: [], warnings: [] }) };
  const user = { id: 'u1', organizationId: 'org1' } as any;

  const service = new DataQueriesService(
    dataQueryRepository as any,
    dataQueryUtilService as any,
    null as any,
    appValidationService as any
  );

  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks keeps queued once-values; drop them so tests don't leak into each other.
    findOne.mockReset();
    query.mockReset();
    dataQueryRepository.getOneById.mockResolvedValue(null);
    dataQueryRepository.findLibraryConsumers.mockResolvedValue([]);
  });

  describe('delete', () => {
    it("rejects a query id that is not in the URL's version with 404, writing nothing", async () => {
      findOne.mockResolvedValue(null); // scoped lookup: not in this version

      await expect(service.delete('foreign-query', 'v1')).rejects.toBeInstanceOf(NotFoundException);

      expect(findOne).toHaveBeenCalledWith(
        DataQuery,
        expect.objectContaining({ where: { id: 'foreign-query', appVersionId: 'v1' } })
      );
      expect(dataQueryRepository.deleteOne).not.toHaveBeenCalled();
      expect(dataQueryRepository.deleteDataQueryEvents).not.toHaveBeenCalled();
    });

    it("deletes a query of the URL's version", async () => {
      findOne.mockResolvedValue({ id: 'q1', name: 'getOrders', appVersionId: 'v1' });

      await service.delete('q1', 'v1');

      expect(dataQueryRepository.deleteDataQueryEvents).toHaveBeenCalledWith('q1', expect.anything());
      expect(dataQueryRepository.deleteOne).toHaveBeenCalledWith('q1');
    });
  });

  describe('update', () => {
    it("rejects a query id that is not in the URL's version with 404, writing nothing", async () => {
      findOne.mockResolvedValue(null);

      await expect(service.update(user, 'v1', 'foreign-query', { options: {} } as any)).rejects.toBeInstanceOf(
        NotFoundException
      );

      expect(findOne).toHaveBeenCalledWith(
        DataQuery,
        expect.objectContaining({ where: expect.objectContaining({ id: 'foreign-query', appVersionId: 'v1' }) })
      );
      expect(dataQueryRepository.updateOne).not.toHaveBeenCalled();
    });

    it("updates a query of the URL's version", async () => {
      findOne.mockResolvedValue({ id: 'q1', name: 'getOrders', appVersionId: 'v1', dataSourceId: 'ds1' });

      await service.update(user, 'v1', 'q1', { options: { code: '1' } } as any);

      expect(dataQueryRepository.updateOne).toHaveBeenCalledWith(
        'q1',
        { name: undefined, options: { code: '1' } },
        expect.anything()
      );
    });
  });
  describe('library query guards', () => {
    const libraryQuery = { id: 'q1', name: 'getCustomer', appVersionId: 'lav1' };
    const inLibrary = () =>
      dataQueryRepository.getOneById.mockResolvedValue({
        ...libraryQuery,
        appVersion: { app: { type: 'query_library', organizationId: 'org1' } },
      });
    const releasedCaller = () =>
      query.mockResolvedValue([
        { queryId: 'x', queryName: 'formatAddress', versionNumber: 1, code: 'return queries.getCustomer.run()' },
      ]);
    const CALLED_BY =
      "getCustomer is called by formatAddress v1. Release a version of formatAddress that doesn't call it, then delete the older versions that do.";

    it('should refuse deleting a query a released version calls', async () => {
      inLibrary();
      releasedCaller();
      await expect(service.delete('q1', 'lav1')).rejects.toThrow(new BadRequestException(CALLED_BY));
      expect(dataQueryRepository.deleteOne).not.toHaveBeenCalled();
    });

    it('should refuse deleting a query an app or module uses, naming the app version', async () => {
      inLibrary();
      dataQueryRepository.findLibraryConsumers.mockResolvedValue([
        {
          appId: 'a1',
          appName: 'Sales CRM',
          appType: 'front-end',
          appVersionName: 'v1',
          queryId: 'c1',
          queryName: 'x',
          libraryQueryId: 'q1',
          versionName: 'v1',
        },
        {
          appId: 'm1',
          appName: 'Address block',
          appType: 'module',
          appVersionName: 'v2',
          queryId: 'c2',
          queryName: 'y',
          libraryQueryId: 'q1',
          versionName: 'draft',
        },
      ]);
      await expect(service.delete('q1', 'lav1')).rejects.toMatchObject({
        message: 'Used by 1 app(s) and 1 module(s): Sales CRM · v1, Address block · v2. Remove it from those first.',
      });
      expect(dataQueryRepository.findLibraryConsumers).toHaveBeenCalledWith('org1', 'lav1', 'q1');
    });

    it('should delete a library query nothing uses or calls', async () => {
      inLibrary();
      query.mockResolvedValue([]);
      findOne.mockResolvedValue({ id: 'q1', name: 'getCustomer', appVersionId: 'lav1' });
      await service.delete('q1', 'lav1');
      expect(dataQueryRepository.deleteOne).toHaveBeenCalledWith('q1');
    });

    it('should refuse renaming a query a released version calls', async () => {
      inLibrary();
      releasedCaller();
      findOne.mockResolvedValueOnce({ id: 'q1', name: 'getCustomer', appVersionId: 'lav1', dataSourceId: 'ds1' });
      findOne.mockResolvedValueOnce(null); // no name clash
      await expect(service.update(user, 'lav1', 'q1', { name: 'getClient' } as any)).rejects.toThrow(
        new BadRequestException(CALLED_BY)
      );
      expect(dataQueryRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should allow renaming a query only drafts call', async () => {
      inLibrary();
      query.mockResolvedValue([]); // no released version calls it
      findOne.mockResolvedValueOnce({ id: 'q1', name: 'getCustomer', appVersionId: 'lav1', dataSourceId: 'ds1' });
      findOne.mockResolvedValueOnce(null);
      await service.update(user, 'lav1', 'q1', { name: 'getClient' } as any);
      expect(dataQueryRepository.updateOne).toHaveBeenCalledWith(
        'q1',
        { name: 'getClient', options: undefined },
        expect.anything()
      );
    });

    it('should 404 a library query of another version before naming any consumer or caller', async () => {
      dataQueryRepository.getOneById.mockResolvedValue({
        ...libraryQuery,
        appVersion: { app: { type: 'query_library', organizationId: 'org1' } },
      });
      dataQueryRepository.findLibraryConsumers.mockResolvedValue([{ appName: 'Secret app' }]);
      releasedCaller();

      await expect(service.delete('q1', 'other-version')).rejects.toBeInstanceOf(NotFoundException);
      expect(dataQueryRepository.findLibraryConsumers).not.toHaveBeenCalled();
      expect(query).not.toHaveBeenCalled();
      expect(dataQueryRepository.deleteOne).not.toHaveBeenCalled();
    });

    it('should 404 a rename through another version before checking callers', async () => {
      dataQueryRepository.getOneById.mockResolvedValue({
        ...libraryQuery,
        appVersion: { app: { type: 'query_library', organizationId: 'org1' } },
      });
      releasedCaller();
      // The scoped lookup finds the row in the URL's version, but the library query id belongs to another one.
      findOne.mockResolvedValueOnce({
        id: 'q1',
        name: 'getCustomer',
        appVersionId: 'other-version',
        dataSourceId: 'ds1',
      });
      findOne.mockResolvedValueOnce(null);

      await expect(service.update(user, 'other-version', 'q1', { name: 'getClient' } as any)).rejects.toBeInstanceOf(
        NotFoundException
      );
      // Only the name-uniqueness advisory lock ran; the library versions were never read.
      expect(query.mock.calls.filter(([sql]) => String(sql).includes('library_query_versions'))).toEqual([]);
      expect(dataQueryRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should never let a query own released versions block its rename', async () => {
      inLibrary();
      query.mockResolvedValue([
        { queryId: 'q1', queryName: 'getCustomer', versionNumber: 1, code: 'return queries.getCustomer.run()' },
      ]);
      findOne.mockResolvedValueOnce({ id: 'q1', name: 'getCustomer', appVersionId: 'lav1', dataSourceId: 'ds1' });
      findOne.mockResolvedValueOnce(null);
      await service.update(user, 'lav1', 'q1', { name: 'getClient' } as any);
      expect(dataQueryRepository.updateOne).toHaveBeenCalled();
    });

    it('should not check callers when the name is unchanged or the query is not in a library', async () => {
      inLibrary();
      findOne.mockResolvedValue({ id: 'q1', name: 'getCustomer', appVersionId: 'lav1', dataSourceId: 'ds1' });
      await service.update(user, 'lav1', 'q1', { name: 'getCustomer', options: {} } as any);
      expect(query).not.toHaveBeenCalled();

      dataQueryRepository.getOneById.mockResolvedValue({ appVersion: { app: { type: 'front-end' } } });
      findOne.mockResolvedValueOnce({ id: 'q1', name: 'getCustomer', appVersionId: 'lav1', dataSourceId: 'ds1' });
      findOne.mockResolvedValueOnce(null);
      await service.update(user, 'lav1', 'q1', { name: 'renamed' } as any);
      expect(dataQueryRepository.updateOne).toHaveBeenCalled();
    });
  });
});
