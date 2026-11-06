import { EntityManager } from 'typeorm';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { withLibraryImportLocks, lockLibraryPins } from '@modules/query-library/locking';

const first = '11111111-1111-4111-8111-111111111111';
const second = '22222222-2222-4222-8222-222222222222';
const versionId = '33333333-3333-4333-8333-333333333333';
const pin = (id: string) => ({ kind: 'library', options: { libraryQueryId: id, libraryQueryVersionId: versionId } });
/** @group platform */
describe('Library pin locking', () => {
  it('locks distinct parents in a stable order before resolving any snapshots', async () => {
    const events = [];
    const manager = {
      query: jest.fn(async (_sql, [id]) => {
        events.push(`lock:${id}`);
      }),
      findOne: jest.fn(async (entity, { where }) => {
        if (entity === LibraryQuery) return { ...where };
        if (entity === LibraryQueryVersion) {
          events.push(`resolve:${where.libraryQueryId}`);
          return where;
        }
      }),
    } as unknown as EntityManager;
    await lockLibraryPins(manager, 'workspace', [pin(second), pin(first), pin(second)]);
    expect(events).toEqual([
      `lock:${first}`,
      `lock:${second}`,
      `resolve:${second}`,
      `resolve:${first}`,
      `resolve:${second}`,
    ]);
  });
  it('does not resolve snapshots of a missing or foreign parent', async () => {
    const manager = { query: jest.fn(), findOne: jest.fn().mockResolvedValue(null) } as unknown as EntityManager;
    await expect(lockLibraryPins(manager, 'workspace', [pin(first)])).rejects.toMatchObject({ status: 404 });
    expect(manager.findOne).toHaveBeenCalledTimes(1);
    expect(manager.findOne).toHaveBeenCalledWith(LibraryQuery, { where: { id: first, organizationId: 'workspace' } });
  });
});

describe('Recursive import lock plan', () => {
  it('locks the complete nested bundle before any child operation, regardless of nesting order', async () => {
    const events = [];
    const manager = {
      query: jest.fn(async (_sql, [id]) => {
        events.push(`lock:${id}`);
      }),
      find: jest.fn().mockResolvedValue([
        { id: first, name: 'A' },
        { id: second, name: 'B' },
      ]),
      findOne: jest.fn(async (_entity, { where }) => where),
    } as unknown as EntityManager;
    const child = (id) => ({ appV2: { dataQueries: [pin(id)], dataSources: [] } });
    const bundle = { appV2: { modules: [child(second), child(first)] } };
    await withLibraryImportLocks(manager, 'workspace', bundle, false, async () => {
      events.push('child write');
      await withLibraryImportLocks(manager, 'workspace', child(second), false, async () => {});
    });
    expect(events).toEqual([`lock:${first}`, `lock:${second}`, 'child write']);
  });
});

it('refuses an unplanned existing parent rather than acquiring an out-of-order import lock', async () => {
  const manager = {
    find: jest.fn().mockResolvedValue([
      { id: first, name: 'A' },
      { id: second, name: 'B' },
    ]),
    query: jest.fn(),
    findOne: jest.fn(async (_entity, { where }) => where),
  } as unknown as EntityManager;
  await expect(
    withLibraryImportLocks(manager, 'workspace', { dataQueries: [pin(second)] }, false, () =>
      lockLibraryPins(manager, 'workspace', [pin(first)])
    )
  ).rejects.toMatchObject({ status: 409 });
  expect(manager.query).toHaveBeenCalledTimes(1);
});
