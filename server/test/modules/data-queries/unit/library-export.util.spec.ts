/**
 * collectLibraryExport and its pure helpers. The manager is an in-memory fake keyed on the SQL text;
 * the real SQL runs in the query-library-app e2e spec.
 */
import { EntityManager } from 'typeorm';
import { DataQuery } from '@entities/data_query.entity';
import {
  collectLibraryExport,
  libraryDataSourceIds,
  libraryTooljetDbTableIds,
  LibraryExportQuery,
  mapLibrarySnapshot,
  matchLibraryQuery,
  matchLibraryVersion,
  remapLibraryConsumerOptions,
} from '@modules/data-queries/library/library-export.util';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';

const id = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const LIB_VERSION = id(900);
const DS_REST = id(801);
const DS_RUNJS = id(802);

type DraftRow = {
  id: string;
  co_relation_id: string | null;
  name: string;
  app_version_id: string;
  data_source_id: string;
  options: unknown;
  kind: string;
};
type VersionRow = {
  id: string;
  library_query_id: string;
  version_number: number;
  kind: string;
  data_source_id: string | null;
  options: Record<string, unknown>;
};

function fakeManager(drafts: DraftRow[], versions: VersionRow[], folders: Record<string, string> = {}) {
  const query = jest.fn(async (sql: string, params: unknown[]) => {
    if (sql.includes('JOIN library_query_folders')) {
      return Object.entries(folders)
        .filter(([queryId]) => (params[0] as string[]).includes(queryId))
        .map(([queryId, folder]) => ({ queryId, folder }));
    }
    if (sql.includes('FROM library_query_versions') && sql.includes('DISTINCT ON')) {
      const wanted = params[0] as string[];
      return wanted
        .map(
          (queryId) =>
            versions
              .filter((v) => v.library_query_id === queryId)
              .sort((a, b) => b.version_number - a.version_number)[0]
        )
        .filter(Boolean);
    }
    if (sql.includes('FROM library_query_versions')) {
      return versions.filter((v) => (params[0] as string[]).includes(v.id));
    }
    if (sql.includes('FROM library_queries dq') && sql.includes('dq.name = ANY')) {
      return drafts.filter(
        (d) => (params[0] as string[]).includes(d.app_version_id) && (params[3] as string[]).includes(d.name)
      );
    }
    if (sql.includes('FROM library_queries dq')) return drafts.filter((d) => (params[0] as string[]).includes(d.id));
    throw new Error(`unexpected SQL: ${sql}`);
  });
  return { manager: { query } as unknown as EntityManager, query };
}

const draft = (n: number, name: string, kind: string, options: unknown): DraftRow => ({
  id: id(n),
  co_relation_id: `co-${n}`,
  name,
  app_version_id: LIB_VERSION,
  data_source_id: kind === 'runjs' ? DS_RUNJS : DS_REST,
  options,
  kind,
});
const version = (
  queryN: number,
  versionNumber: number,
  kind: string,
  options: Record<string, unknown>
): VersionRow => ({
  id: id(queryN * 100 + versionNumber),
  library_query_id: id(queryN),
  version_number: versionNumber,
  kind,
  data_source_id: kind === 'runjs' ? DS_RUNJS : DS_REST,
  options,
});
const consumer = (libraryQueryId: string, libraryQueryVersionId?: string) =>
  ({ kind: 'library', options: { libraryQueryId, libraryQueryVersionId } }) as unknown as DataQuery;

describe('collectLibraryExport', () => {
  const restOptions = { method: 'get', url: 'http://x/', url_params: [], headers: [], body: [] };

  it('exports the draft and the pinned version', async () => {
    const { manager } = fakeManager(
      // data_queries.options is simple-json text, so the draft options arrive as a string
      [draft(1, 'getInvoices', 'restapi', JSON.stringify(restOptions))],
      [version(1, 1, 'restapi', restOptions), version(1, 2, 'restapi', { ...restOptions, url: 'http://y/' })],
      { [id(1)]: 'Billing' }
    );
    const result = await collectLibraryExport(manager, 'org1', [consumer(id(1), id(101))]);
    expect(result).toEqual([
      {
        id: id(1),
        coRelationId: 'co-1',
        name: 'getInvoices',
        folder: 'Billing',
        draft: { kind: 'restapi', dataSourceId: DS_REST, options: restOptions },
        versions: [{ id: id(101), versionNumber: 1, kind: 'restapi', dataSourceId: DS_REST, options: restOptions }],
      },
    ]);
  });

  it('exports no versions for a draft pin or a missing pin', async () => {
    const { manager } = fakeManager(
      [draft(1, 'getInvoices', 'restapi', restOptions)],
      [version(1, 1, 'restapi', restOptions)]
    );
    const result = await collectLibraryExport(manager, 'org1', [consumer(id(1), 'draft'), consumer(id(1))]);
    expect(result).toHaveLength(1);
    expect(result[0].versions).toEqual([]);
  });

  it('ignores a pin to a version that is gone and a query from another workspace', async () => {
    // the fake returns nothing for ids it does not hold, like the org-scoped SQL
    const { manager } = fakeManager([draft(1, 'getInvoices', 'restapi', restOptions)], []);
    const result = await collectLibraryExport(manager, 'org1', [consumer(id(1), id(199)), consumer(id(77), 'draft')]);
    expect(result.map((q) => q.name)).toEqual(['getInvoices']);
    expect(result[0].versions).toEqual([]);
  });

  it('skips a malformed pointer instead of failing the export', async () => {
    const { manager, query } = fakeManager([], []);
    const result = await collectLibraryExport(manager, 'org1', [consumer('not-a-uuid', 'draft')]);
    expect(result).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it('does not pull in other library queries a RunJS query names', async () => {
    const { manager } = fakeManager(
      [
        draft(1, 'runner', 'runjs', { code: 'return queries.getA.run()' }),
        draft(2, 'getA', 'runjs', { code: 'return 1' }),
      ],
      [version(1, 1, 'runjs', { code: 'return queries.getA.run()' }), version(2, 1, 'runjs', { code: 'return 1' })]
    );
    const result = await collectLibraryExport(manager, 'org1', [consumer(id(1), id(101))]);
    expect(result.map((q) => q.name)).toEqual(['runner']);
  });
});

describe('library export helpers', () => {
  const snapshot = (kind: string, dataSourceId: string | null, options: Record<string, unknown> = {}) => ({
    kind,
    dataSourceId,
    options,
  });

  const bundle: LibraryExportQuery[] = [
    {
      id: id(1),
      coRelationId: null,
      name: 'orders',
      folder: null,
      draft: snapshot('tooljetdb', DS_REST, { operation: 'list_rows', table_id: 't1' }),
      versions: [
        {
          id: id(101),
          versionNumber: 1,
          ...snapshot('tooljetdb', DS_REST, { operation: 'list_rows', table_id: 't2' }),
        },
        {
          id: id(102),
          versionNumber: 2,
          ...snapshot('tooljetdb', DS_REST, {
            operation: 'join_tables',
            join_table: {
              from: { name: 't3' },
              joins: [
                {
                  table: 't4',
                  conditions: { conditionsList: [{ leftField: { table: 't3' }, rightField: { table: 't5' } }] },
                },
              ],
            },
          }),
        },
      ],
    },
    {
      id: id(2),
      coRelationId: null,
      name: 'code',
      folder: null,
      draft: snapshot('runjs', DS_RUNJS, { code: '', table_id: 'not-a-table' }),
      versions: [],
    },
  ];

  it('lists each data source once', () => {
    expect(libraryDataSourceIds(bundle).sort()).toEqual([DS_REST, DS_RUNJS]);
  });

  it('lists ToolJet DB tables from draft, versions and joins, ignoring other kinds', () => {
    expect(libraryTooljetDbTableIds(bundle).sort()).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });
});

describe('library import helpers', () => {
  const version = (row: Partial<LibraryQueryVersion>): LibraryQueryVersion =>
    ({
      id: id(1),
      libraryQueryId: id(2),
      versionNumber: 1,
      kind: 'restapi',
      dataSourceId: DS_REST,
      options: { url: 'http://a' },
      deletedAt: null,
      ...row,
    }) as LibraryQueryVersion;
  const incoming = { kind: 'restapi', dataSourceId: DS_REST, options: { url: 'http://a' } };

  describe('matchLibraryVersion', () => {
    it('matches a version with the same kind, data source and options', () => {
      const same = version({ id: id(11) });
      expect(matchLibraryVersion([version({ id: id(10), options: { url: 'http://b' } }), same], incoming)).toBe(same);
    });

    it('does not match a different kind, data source or options', () => {
      expect(matchLibraryVersion([version({ kind: 'runjs' })], incoming)).toBeNull();
      expect(matchLibraryVersion([version({ dataSourceId: DS_RUNJS })], incoming)).toBeNull();
      expect(matchLibraryVersion([version({ options: { url: 'http://a', extra: 1 } })], incoming)).toBeNull();
    });

    it('does not match a soft-deleted version', () => {
      expect(matchLibraryVersion([version({ deletedAt: new Date() })], incoming)).toBeNull();
    });
  });

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

    it('keeps the draft pin, a missing pin and ids the maps do not know', () => {
      expect(
        remapLibraryConsumerOptions({ libraryQueryId: id(1), libraryQueryVersionId: 'draft' }, queryMap, versionMap)
      ).toEqual({
        libraryQueryId: id(101),
        libraryQueryVersionId: 'draft',
      });
      expect(remapLibraryConsumerOptions({ libraryQueryId: id(1) }, queryMap, versionMap)).toMatchObject({
        libraryQueryId: id(101),
      });
      expect(
        remapLibraryConsumerOptions({ libraryQueryId: id(7), libraryQueryVersionId: id(8) }, queryMap, versionMap)
      ).toBeNull();
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
