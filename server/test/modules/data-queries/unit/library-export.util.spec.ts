import { EntityManager } from 'typeorm';
import { DataQuery } from '@entities/data_query.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import {
  collectLibraryExport,
  assertLibraryExport,
  libraryDataSourceIds,
  libraryTooljetDbTableIds,
  mapLibrarySnapshot,
  matchLibraryQuery,
  remapLibraryConsumerOptions,
  LibraryExportQuery,
} from '@modules/data-queries/library/library-export.util';
const id = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const DS_REST = id(801);
const DS_RUNJS = id(802);
const snapshot = (n: number, name: string, extra = {}) => ({
  id: id(n),
  name,
  description: null,
  createdFromVersionId: null,
  libraryQueryId: id(1),
  kind: 'restapi',
  dataSourceId: DS_REST,
  options: { url: 'http://a' },
  ...extra,
});
const consumer = (versionId: string) =>
  ({ options: { libraryQueryId: id(1), libraryQueryVersionId: versionId } }) as DataQuery;
function manager(
  rows = [snapshot(2, 'alpha'), snapshot(3, 'beta')],
  saved = [snapshot(4, 'saved', { versionNumber: 1, currentEnvironmentId: id(10) })]
) {
  const tables = new Map<unknown, unknown[]>([
    [LibraryQuery, [{ id: id(1), name: 'orders', coRelationId: null, folderId: id(20) }]],
    [LibraryQueryDraft, rows],
    [LibraryQueryVersion, saved],
    [LibraryQueryState, []],
    [LibraryQueryFolder, [{ id: id(20), name: 'Billing' }]],
    [AppEnvironment, [{ id: id(10), name: 'development', priority: 1 }]],
  ]);
  return { find: jest.fn(async (entity) => tables.get(entity) ?? []) } as unknown as EntityManager;
}
/** @group platform */
describe('named library export', () => {
  it('exports only exact pinned drafts/saved UUIDs with names and environment metadata', async () => {
    const result = await collectLibraryExport(manager(), id(50), [consumer(id(2)), consumer(id(3)), consumer(id(4))]);
    expect(result).toMatchObject([
      {
        name: 'orders',
        folder: 'Billing',
        drafts: [
          { id: id(2), name: 'alpha' },
          { id: id(3), name: 'beta' },
        ],
        versions: [{ id: id(4), name: 'saved', environment: { name: 'development', priority: 1 } }],
      },
    ]);
    expect(result[0]).not.toHaveProperty('draft');
  });
  // The app still exports; the reference is carried as-is (like import and git pull) with nothing invented for it.
  it.each([
    ['a sentinel', 'draft'],
    ['no', undefined],
    ['a deleted', id(99)],
  ])('bundles nothing for %s pin instead of failing or inventing a draft', async (_label, pin) => {
    const result = await collectLibraryExport(manager(), id(50), [consumer(pin)]);
    const snapshots = result.flatMap((query) => [...query.drafts, ...query.versions]).map((row) => row.id);
    expect(snapshots).not.toContain(pin);
    expect(result.flatMap((query) => query.drafts)).toEqual([]);
  });
  it('includes the live saved parent closure, preserving distinct same-content identities', async () => {
    const saved = [
      snapshot(4, 'parent', { versionNumber: 1, currentEnvironmentId: id(10) }),
      snapshot(5, 'child', { versionNumber: 2, currentEnvironmentId: id(10), createdFromVersionId: id(4) }),
    ];
    const [result] = await collectLibraryExport(manager([], saved), id(50), [consumer(id(5))]);
    expect(result.versions).toMatchObject([
      { id: id(4), name: 'parent' },
      { id: id(5), name: 'child', createdFromVersionId: id(4) },
    ]);
  });
  it('rejects old-format and duplicate snapshot identities', () => {
    expect(() =>
      assertLibraryExport([{ id: id(1), name: 'old', draft: {} } as unknown as LibraryExportQuery])
    ).toThrow();
  });
});

describe('library export resource helpers', () => {
  const bundle = [
    {
      drafts: [snapshot(2, 'draft', { kind: 'tooljetdb', options: { table_id: 'one' } })],
      versions: [
        snapshot(3, 'saved', {
          kind: 'tooljetdb',
          options: {
            operation: 'join_tables',
            join_table: {
              from: { name: 'two' },
              joins: [
                {
                  table: 'three',
                  conditions: { conditionsList: [{ leftField: { table: 'four' }, rightField: { table: 'five' } }] },
                },
              ],
            },
          },
        }),
      ],
    },
  ] as unknown as LibraryExportQuery[];
  it('collects sources once across drafts and saved snapshots', () =>
    expect(libraryDataSourceIds(bundle)).toEqual([DS_REST]));
  it('collects all ToolJet DB table and join references across both statuses', () =>
    expect(libraryTooljetDbTableIds(bundle).sort()).toEqual(['five', 'four', 'one', 'three', 'two']));
});

describe('library import helpers', () => {
  const incoming = {
    id: id(99),
    name: 'named',
    description: null,
    createdFromVersionId: null,
    versionNumber: 1,
    environment: null,
    kind: 'restapi',
    dataSourceId: DS_REST,
    options: { url: 'http://a' },
  };

  describe('matchLibraryQuery', () => {
    const rows = [
      { id: id(20), co_relation_id: null, name: 'byName' },
      { id: id(21), co_relation_id: id(500), name: 'imported' },
      { id: id(22), co_relation_id: null, name: 'native' },
    ];
    const query = (q: Partial<LibraryExportQuery>) => ({ id: id(900), coRelationId: null, name: 'other', ...q });

    it('matches by co_relation_id, using the exporter id when it has none', () => {
      expect(matchLibraryQuery(rows, query({ coRelationId: id(500) }))).toBe(rows[1]);
      expect(matchLibraryQuery(rows, query({ id: id(500) }))).toBe(rows[1]);
    });

    it('matches the original row by id when re-importing into the same workspace', () => {
      expect(matchLibraryQuery(rows, query({ id: id(22), name: 'renamed' }))).toBe(rows[2]);
    });

    it('prefers co_relation_id, then id, then name', () => {
      expect(matchLibraryQuery(rows, query({ coRelationId: id(500), name: 'byName' }))).toBe(rows[1]);
      expect(matchLibraryQuery(rows, query({ id: id(22), name: 'byName' }))).toBe(rows[2]);
      expect(matchLibraryQuery(rows, query({ name: 'byName' }))).toBe(rows[0]);
      expect(matchLibraryQuery(rows, query({}))).toBeNull();
    });

    it('does not match by the exporter co_relation_id against a local row id', () => {
      expect(matchLibraryQuery(rows, query({ coRelationId: id(22), name: 'other' }))).toBeNull();
    });

    it('skips rows another incoming query already claimed', () => {
      expect(matchLibraryQuery(rows, query({ coRelationId: id(500) }), new Set([rows[1].id]))).toBeNull();
      expect(matchLibraryQuery(rows, query({ name: 'byName' }), new Set([rows[0].id]))).toBeNull();
    });
  });

  describe('mapLibrarySnapshot', () => {
    const tjdb = (options: Record<string, unknown>) => ({ kind: 'tooljetdb', dataSourceId: DS_REST, options });
    const remap = (options: Record<string, unknown>) => ({
      ...options,
      table_id: ({ t1: 'new-t1' } as Record<string, string>)[options.table_id as string],
    });

    it('maps the data source id and stores null for one that maps to nothing', () => {
      expect(mapLibrarySnapshot(incoming, { [DS_REST]: DS_RUNJS }, remap).dataSourceId).toBe(DS_RUNJS);
      expect(mapLibrarySnapshot(incoming, {}, remap).dataSourceId).toBeNull();
      expect(
        mapLibrarySnapshot({ ...incoming, dataSourceId: null }, { [DS_REST]: DS_RUNJS }, remap).dataSourceId
      ).toBeNull();
    });

    it('remaps ToolJet DB table ids only for tooljetdb snapshots', () => {
      const mapping = { [DS_REST]: DS_REST };
      expect(mapLibrarySnapshot(tjdb({ table_id: 't1' }), mapping, remap).options).toEqual({ table_id: 'new-t1' });
      expect(mapLibrarySnapshot({ ...incoming, options: { table_id: 't1' } }, mapping, remap).options).toEqual({
        table_id: 't1',
      });
    });

    it('leaves an unmapped table id as it was', () => {
      expect(mapLibrarySnapshot(tjdb({ table_id: 'unknown' }), { [DS_REST]: DS_REST }, remap).options).toEqual({
        table_id: 'unknown',
      });
    });
  });

  describe('remapLibraryConsumerOptions', () => {
    const queryMap = { [id(1)]: id(101) };
    const versionMap = { [id(2)]: id(102) };

    it('rewrites the query and version ids and keeps the other keys', () => {
      expect(
        remapLibraryConsumerOptions(
          { libraryQueryId: id(1), libraryQueryVersionId: id(2), libraryKind: 'restapi', inputs: { a: '1' } },
          queryMap,
          versionMap
        )
      ).toEqual({
        libraryQueryId: id(101),
        libraryQueryVersionId: id(102),
        libraryKind: 'restapi',
        inputs: { a: '1' },
      });
    });

    it('rejects missing and sentinel snapshot IDs while retaining valid local UUIDs', () => {
      for (const options of [{ libraryQueryId: id(1) }, { libraryQueryId: id(1), libraryQueryVersionId: 'draft' }]) {
        expect(() => remapLibraryConsumerOptions(options, queryMap, versionMap)).toThrow();
      }
      expect(
        remapLibraryConsumerOptions({ libraryQueryId: id(7), libraryQueryVersionId: id(8) }, queryMap, versionMap)
      ).toBeNull();
    });

    it('rejects a bundled parent pin whose snapshot was omitted instead of retaining an unrelated local UUID', () => {
      expect(() =>
        remapLibraryConsumerOptions({ libraryQueryId: id(1), libraryQueryVersionId: id(8) }, queryMap, versionMap)
      ).toThrow('The bundled library snapshot is missing');
    });

    it('returns null when nothing changes (re-import into the same workspace)', () => {
      expect(
        remapLibraryConsumerOptions(
          { libraryQueryId: id(1), libraryQueryVersionId: id(2) },
          { [id(1)]: id(1) },
          { [id(2)]: id(2) }
        )
      ).toBeNull();
    });
  });
});
