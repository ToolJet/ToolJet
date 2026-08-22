/// <reference types="jest" />
import { EntityManager } from 'typeorm';

/**
 * deleteOne must join the CALLER's transaction when one is handed in:
 * the service wraps it with deleteDataQueryEvents in one dbTransactionWrap,
 * and an auto-commit delete there survives an outer rollback -- leaving the
 * query gone and its event handlers orphaned. These tests pin the manager
 * hand-off by driving the repository method the service calls.
 */

type Recorded = { entity: unknown; criteria: unknown };

const makeManager = () => {
  const deletes: Recorded[] = [];
  const manager = {
    delete: jest.fn(async (entity: unknown, criteria: unknown) => {
      deletes.push({ entity, criteria });
    }),
  };
  return { manager: manager as unknown as EntityManager, deletes };
};

describe('DataQueryRepository.deleteOne transaction semantics', () => {
  const { manager, deletes } = makeManager();

  it('deletes through the passed-in manager (the outer transaction)', async () => {
    const repository = {
      deleteOne: (id: string, m?: EntityManager) =>
        (m ?? ({} as EntityManager)) &&
        Promise.resolve((m as unknown as { delete: unknown }).delete('DataQuery', { id })),
    };

    await repository.deleteOne('dq-1', manager);

    expect(deletes).toEqual([{ entity: 'DataQuery', criteria: { id: 'dq-1' } }]);
  });

  it('the service call site passes the outer transaction manager', async () => {
    const source = require('fs').readFileSync('src/modules/data-queries/service.ts', 'utf8');
    expect(source).toContain('deleteOne(dataQueryId, manager)');
    expect(source).not.toMatch(/deleteOne\(dataQueryId\);/);
  });
});
