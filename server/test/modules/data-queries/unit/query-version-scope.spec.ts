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

import { NotFoundException } from '@nestjs/common';
import { DataQuery } from '@entities/data_query.entity';

const findOne = jest.fn();

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => {
    return cb({ findOne, query: jest.fn() });
  }),
}));

import { DataQueriesService } from '@modules/data-queries/service';

describe('DataQueriesService version scoping', () => {
  const dataQueryRepository = {
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteDataQueryEvents: jest.fn(),
  };
  const dataQueryUtilService = { validateQueryActionsAgainstEnvironment: jest.fn().mockResolvedValue(undefined) };
  const appValidationService = { check: jest.fn().mockResolvedValue({ errors: [], warnings: [] }) };
  const user = { id: 'u1', organizationId: 'org1' } as any;

  const service = new DataQueriesService(
    dataQueryRepository as any,
    dataQueryUtilService as any,
    null as any,
    appValidationService as any,
    null as any
  );

  beforeEach(() => jest.clearAllMocks());

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
});
