/**
 * Components that predate co_relation_id assignment get one the first time their version is copied.
 *
 * The id is written to the source row as well as copied to the new version, so both share one identity from then on.
 * This replaces a backfill: only components that are actually copied are touched.
 */
import { assignMissingComponentCoRelationIds } from '../../../../src/helpers/co_relation_id.helper';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEPT = '11111111-1111-4111-8111-111111111111';

const makeManager = (stored: Record<string, string> = {}) => {
  const rows: Record<string, string | null> = {};
  return {
    rows,
    // The UPDATE keeps an id a concurrent copy already wrote (COALESCE), so the manager's read-back is the truth.
    query: jest.fn().mockImplementation(async (_sql: string, [ids, coRelationIds]: [string[], string[]]) => {
      ids.forEach((id, i) => {
        rows[id] = stored[id] ?? coRelationIds[i];
      });
    }),
    find: jest
      .fn()
      .mockImplementation(async () => Object.entries(rows).map(([id, co_relation_id]) => ({ id, co_relation_id }))),
  };
};

describe('assignMissingComponentCoRelationIds', () => {
  it('gives each component without a co_relation_id a distinct one, in memory and in the database', async () => {
    const manager = makeManager();
    const components: any[] = [
      { id: 'a', co_relation_id: null },
      { id: 'b', co_relation_id: undefined },
    ];

    await assignMissingComponentCoRelationIds(components, manager as any);

    expect(components[0].co_relation_id).toMatch(UUID);
    expect(components[1].co_relation_id).toMatch(UUID);
    expect(components[0].co_relation_id).not.toBe(components[1].co_relation_id);
    expect(manager.rows).toEqual({ a: components[0].co_relation_id, b: components[1].co_relation_id });
  });

  it('leaves a component that already has a co_relation_id alone', async () => {
    const manager = makeManager();
    const components: any[] = [
      { id: 'a', co_relation_id: KEPT },
      { id: 'b', co_relation_id: null },
    ];

    await assignMissingComponentCoRelationIds(components, manager as any);

    expect(components[0].co_relation_id).toBe(KEPT);
    expect(Object.keys(manager.rows)).toEqual(['b']);
  });

  it('does not touch the database when every component already has one', async () => {
    const manager = makeManager();

    await assignMissingComponentCoRelationIds([{ id: 'a', co_relation_id: KEPT }] as any, manager as any);

    expect(manager.query).not.toHaveBeenCalled();
    expect(manager.find).not.toHaveBeenCalled();
  });

  it('uses the id a concurrent copy wrote first, so the copy and its source still match', async () => {
    const manager = makeManager({ a: '22222222-2222-4222-8222-222222222222' });
    const components: any[] = [{ id: 'a', co_relation_id: null }];

    await assignMissingComponentCoRelationIds(components, manager as any);

    expect(components[0].co_relation_id).toBe('22222222-2222-4222-8222-222222222222');
  });
});
