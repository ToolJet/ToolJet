/**
 * FlexContainers built in UI 2.0 apps before the layout flag existed keep the new layout: the data migration stamps
 * layoutVersion '2' (and Equal heights, on, as a new container gets) onto them. Run through a fake query runner (no
 * database): this checks which rows the statements select and what they write. The statements themselves were run
 * against a copy of staging data (see the review notes).
 */
import { StampFlexLayoutVersionOnUi2Containers1792180000000 as Migration } from '../../../../data-migrations/1792180000000-StampFlexLayoutVersionOnUi2Containers';

const cleared: string[][] = [];
jest.mock('@helpers/migration.helper', () => ({
  deleteAppHistoryForStructuralMigration: async (_manager: unknown, options: { appVersionIds: string[] }) => {
    cleared.push([...options.appVersionIds].sort());
  },
}));

type Call = [string, any[]];

/** A query runner whose SELECT returns `batches` in turn (then nothing), recording every statement. */
function fakeQueryRunner(batches: Array<Array<{ id: string; app_version_id: string }>>) {
  const calls: Call[] = [];
  let next = 0;
  const query = jest.fn(async (sql: string, params: any[] = []) => {
    calls.push([sql, params]);
    if (/^\s*SELECT c\.id, p\.app_version_id/.test(sql)) return batches[next++] ?? [];
    if (/^\s*UPDATE components c/.test(sql)) return [[], params[1].length];
    throw new Error(`unexpected query: ${sql}`);
  });
  return { queryRunner: { query, manager: { query } } as any, calls };
}

const run = async (batches: Array<Array<{ id: string; app_version_id: string }>> = []) => {
  const { queryRunner, calls } = fakeQueryRunner(batches);
  await new Migration().up(queryRunner);
  return {
    selects: calls.filter(([sql]) => /^\s*SELECT/.test(sql)),
    updates: calls.filter(([sql]) => /^\s*UPDATE/.test(sql)),
  };
};

const squash = (sql: string) => sql.replace(/\s+/g, ' ');

describe('StampFlexLayoutVersionOnUi2Containers data migration', () => {
  beforeEach(() => {
    cleared.length = 0;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  describe('selection', () => {
    const selectSql = async () => squash((await run()).selects[0][0]);

    it('selects only FlexContainers that have no layout version yet', async () => {
      const sql = await selectSql();
      expect(sql).toContain("c.type = 'FlexContainer'");
      expect(sql).toContain("c.properties -> 'layoutVersion' IS NULL");
      // A property bag that is not an object (never written by ToolJet) is left alone rather than failing the run.
      expect(sql).toContain("(c.properties IS NULL OR json_typeof(c.properties) = 'object')");
    });

    // Mirrors componentLibraryFor (src/helpers/component_library.helper.ts): a saved library wins; without one, a
    // version with any Shad* widget is UI 2.0.
    it('selects versions saved as UI 2.0, or with no saved library and a UI 2.0 widget', async () => {
      const sql = await selectSql();
      expect(sql).toContain("av.global_settings ->> 'componentLibrary' = 'ui2'");
      expect(sql).toContain("COALESCE(av.global_settings ->> 'componentLibrary', '') NOT IN ('ui1', 'ui2')");
      expect(sql).toMatch(
        /EXISTS \( SELECT 1 FROM components s JOIN pages sp ON sp\.id = s\.page_id WHERE sp\.app_version_id = av\.id AND s\.type ~ '\^Shad\[A-Z\]' \)/
      );
    });

    it('never selects a version saved as UI 1.0', async () => {
      const sql = await selectSql();
      // The only paths in are a saved 'ui2' or a library that is neither 'ui1' nor 'ui2'.
      expect(sql.match(/'componentLibrary'/g)).toHaveLength(2);
      expect(sql).not.toMatch(/componentLibrary' = 'ui1'/);
    });

    it('pages through the rows by id, not by offset', async () => {
      const { selects } = await run([
        [
          { id: '00000000-0000-0000-0000-00000000000a', app_version_id: 'v1' },
          { id: '00000000-0000-0000-0000-00000000000b', app_version_id: 'v2' },
        ],
      ]);
      expect(selects).toHaveLength(2);
      expect(squash(selects[0][0])).toMatch(/AND c\.id > \$1 ORDER BY c\.id LIMIT \$2$/);
      expect(selects[0][0]).not.toMatch(/OFFSET/);
      expect(selects[0][1][0]).toBe('00000000-0000-0000-0000-000000000000');
      expect(selects[1][1][0]).toBe('00000000-0000-0000-0000-00000000000b');
    });
  });

  describe('update', () => {
    const batch = [
      { id: 'c1', app_version_id: 'v1' },
      { id: 'c2', app_version_id: 'v1' },
      { id: 'c3', app_version_id: 'v2' },
    ];

    it('updates each batch in one statement, rechecking the flag', async () => {
      const { updates } = await run([batch]);
      expect(updates).toHaveLength(1);
      const [sql, [, ids]] = updates[0];
      expect(ids).toEqual(['c1', 'c2', 'c3']);
      expect(squash(sql)).toMatch(/WHERE c\.id = ANY\(\$2::uuid\[\]\) AND c\.properties -> 'layoutVersion' IS NULL$/);
    });

    it('adds layoutVersion 2 and Equal heights on, in that order', async () => {
      const { updates } = await run([batch]);
      const [, [added]] = updates[0];
      expect(added).toBe(JSON.stringify({ layoutVersion: { value: '2' }, equalHeights: { value: '{{true}}' } }));
      expect(Object.keys(JSON.parse(added))).toEqual(['layoutVersion', 'equalHeights']);
    });

    // components.properties is json, which keeps key order (a jsonb round trip sorts the keys). The saved keys keep
    // their order, the new ones go after them, and a container that already has Equal heights keeps its own value.
    it('keeps the column json and the saved keys in their order', async () => {
      const { updates } = await run([batch]);
      const sql = squash(updates[0][0]);
      expect(sql).not.toMatch(/jsonb/);
      expect(sql).toContain('json_object_agg(e.key, e.value ORDER BY e.part, e.ord)');
      expect(sql).toContain("json_each(COALESCE(c.properties, '{}'::json)) WITH ORDINALITY");
      expect(sql).toContain('json_each($1::json) WITH ORDINALITY');
      expect(sql).toContain("COALESCE(c.properties, '{}'::json) -> added.key IS NULL");
    });

    it('clears undo history for the versions it changed, once', async () => {
      await run([batch, [{ id: 'c4', app_version_id: 'v3' }]]);
      expect(cleared).toEqual([['v1', 'v2', 'v3']]);
    });

    it('does nothing more when no container needs the flag (idempotent re-run)', async () => {
      const { updates } = await run([]);
      expect(updates).toHaveLength(0);
      expect(cleared).toEqual([]);
    });
  });

  it('has a no-op down', async () => {
    const query = jest.fn();
    await new Migration().down({ query } as any);
    expect(query).not.toHaveBeenCalled();
  });
});
