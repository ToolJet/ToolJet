import { Test, TestingModule } from '@nestjs/testing';
import { DataQueryRepository } from '../../../../src/modules/data-queries/repository';
import { DataQueriesService } from '../../../../src/modules/data-queries/service';
import { EntityManager } from 'typeorm';
import { DataQueriesUtilService } from '../../../../src/modules/data-queries/util.service';

jest.mock('src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb) => {
    const fakeManager = {} as EntityManager;
    return cb(fakeManager);
  }),
}));

describe('DataQueriesService', () => {
  describe('delete', () => {
    let service: DataQueriesService;
    let repoDeleteEvents: jest.Mock;
    let repoDeleteOne: jest.Mock;

    beforeEach(async () => {
      repoDeleteEvents = jest.fn().mockResolvedValue(undefined);
      repoDeleteOne = jest.fn().mockResolvedValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DataQueriesService,
          {
            provide: DataQueryRepository,
            useValue: {
              deleteDataQueryEvents: repoDeleteEvents,
              deleteOne: repoDeleteOne,
              findOneOrFail: jest.fn(),
            },
          },
          {
            provide: DataQueriesUtilService,
            useValue: {
              getQueryContext: jest.fn().mockResolvedValue({}),
              emitAfterDeleteHooks: jest.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<DataQueriesService>(DataQueriesService);
      // Suppress fire-and-forget afterQueryDelete errors in test output
      jest.spyOn(service as any, 'afterQueryDelete').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'beforeQueryDelete').mockResolvedValue({});
    });

    it('passes the transaction manager to deleteOne so both ops share the same transaction', async () => {
      await service.delete('query-id-1');

      // Both calls should have received the same fake manager from dbTransactionWrap
      expect(repoDeleteEvents).toHaveBeenCalledWith('query-id-1', expect.anything());
      expect(repoDeleteOne).toHaveBeenCalledWith('query-id-1', expect.anything());

      // The manager arg must be the same object passed to both
      const eventsManager = repoDeleteEvents.mock.calls[0][1];
      const deleteOneManager = repoDeleteOne.mock.calls[0][1];
      expect(eventsManager).toBe(deleteOneManager);
    });
  });
});
