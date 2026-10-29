import { DataQuery } from '@entities/data_query.entity';
/**
 * AppImportExportService.importLibraryQueries. The manager is an in-memory fake; the real SQL and the
 * DB-backed flows run in the query-library/library-import-export e2e spec. Matching/mapping rules have their own unit spec in
 * data-queries/unit/library-export.util.spec.ts.
 */
import { ForbiddenException } from '@nestjs/common';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { DataSource } from '@entities/data_source.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { LibraryExportQuery } from '@modules/data-queries/library/library-export.util';

const id = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ORG = id(1);
const SRC_DS = id(801); // data source id in the export
const DST_DS = id(811); // the same data source in this workspace
const restOptions = { method: 'get', url: 'http://a', url_params: [], headers: [], body: [] };

type Store = {
  queries: LibraryQuery[];
  folders: LibraryQueryFolder[];
  states: LibraryQueryState[];
  versions: LibraryQueryVersion[];
  consumers: { id: string; options: unknown }[];
  updates: { id: string; options: Record<string, unknown> }[];
  counter: number;
};

function fakeManager(store: Store) {
  const entities: Record<string, 'queries' | 'folders' | 'states' | 'versions'> = {
    LibraryQuery: 'queries',
    LibraryQueryFolder: 'folders',
    LibraryQueryState: 'states',
    LibraryQueryVersion: 'versions',
  };
  return {
    find: jest.fn(async (entity: { name: string }, { where }: { where: Record<string, unknown> }) => {
      if (entity === DataQuery)
        return store.consumers.map((consumer) => ({ ...consumer, dataSource: { kind: 'library' } }));
      if (entity === DataSource) return [{ id: id(850), kind: 'runjs' }];
      const rows = store[entities[entity.name]] as Record<string, unknown>[];
      return rows.filter((row) => Object.entries(where).every(([key, value]) => row[key] === value));
    }),
    findOne: jest.fn(async () => ({ id: id(700), priority: 1 })), // development AppEnvironment
    count: jest.fn(
      async (_entity: unknown, { where }: { where: Record<string, unknown> }) =>
        store.queries.filter((row) => row.organizationId === where.organizationId).length
    ),
    create: jest.fn((Entity: new () => object, data: object) => Object.assign(new Entity(), data)),
    save: jest.fn(
      async (entityOrRow: { constructor: { name: string }; id?: string } | (new () => object), data?: object) => {
        const row = data
          ? (Object.assign(new (entityOrRow as new () => object)(), data) as {
              constructor: { name: string };
              id?: string;
            })
          : (entityOrRow as { constructor: { name: string }; id?: string });
        row.id = row.id ?? id(5000 + store.counter++);
        store[entities[row.constructor.name]].push(row as never);
        return row;
      }
    ),
    update: jest.fn(
      async (_entity: unknown, { id: rowId }: { id: string }, { options }: { options: Record<string, unknown> }) => {
        store.updates.push({ id: rowId, options });
      }
    ),
    query: jest.fn(async (sql: string, params: unknown[]) => {
      if (sql.includes('MAX(version_number)')) {
        const own = store.versions.filter((v) => v.libraryQueryId === params[0]);
        return [{ highest: Math.max(0, ...own.map((v) => v.versionNumber)) }];
      }
      return store.consumers;
    }),
  };
}

type Perms = { isSuperAdmin?: boolean; isAdmin?: boolean; moduleCreate?: boolean };
type ImportResult = { queries: Record<string, string>; versions: Record<string, string>; skipped: string[] };
type Importer = { importLibraryQueries: (...args: unknown[]) => Promise<ImportResult> };

function setup(overrides: Partial<Store> = {}, { library = true, perms = { isAdmin: true } as Perms } = {}) {
  const store: Store = {
    queries: [],
    folders: [],
    states: [],
    versions: [],
    consumers: [],
    updates: [],
    counter: 0,
    ...overrides,
  };
  const appsUtilService = {};
  const abilityService = { resourceActionsPermission: jest.fn(async () => perms) };
  const logger = { warn: jest.fn() };
  // Constructor slots: 7 = transactionLogger, 9 = abilityService, 11 = appsUtilService; the rest are unused here.
  const deps: unknown[] = Array(12).fill(null);
  deps[7] = logger;
  deps[9] = abilityService;
  deps[11] = appsUtilService;
  const service = new AppImportExportService(
    ...(deps as ConstructorParameters<typeof AppImportExportService>)
  ) as unknown as Importer;
  const manager = fakeManager(store);
  const user = { id: id(2), organizationId: ORG };
  const resourceMapping = { dataSourceMapping: { [SRC_DS]: DST_DS }, appVersionMapping: { [id(700)]: id(701) } };
  const run = (exported: LibraryExportQuery[], tooljetDatabaseMapping: Record<string, { id: string }> = {}) =>
    service.importLibraryQueries(manager, exported, user, resourceMapping, tooljetDatabaseMapping);
  return { store, run, manager, appsUtilService, abilityService, logger };
}

const snapshot = (options: Record<string, unknown> = restOptions, kind = 'restapi') => ({
  kind,
  dataSourceId: SRC_DS,
  options,
});
const exportedQuery = (extra: Partial<LibraryExportQuery> = {}): LibraryExportQuery => ({
  id: id(100),
  coRelationId: null,
  name: 'getInvoices',
  folder: null,
  draft: snapshot(),
  versions: [{ id: id(101), versionNumber: 1, ...snapshot() }],
  ...extra,
});
const consumer = (versionId: string) => ({
  id: id(300),
  options: JSON.stringify({ libraryQueryId: id(100), libraryQueryVersionId: versionId, inputs: {} }),
});

describe('AppImportExportService.importLibraryQueries', () => {
  it('creates the query and its versions in the library, then pins the consumer to the new rows', async () => {
    const { store, run } = setup({ consumers: [consumer(id(101))] });
    const result = await run([exportedQuery({ folder: 'Billing' })]);

    expect(store.queries).toHaveLength(1);
    expect(store.queries[0]).toMatchObject({
      name: 'getInvoices',
      organizationId: ORG,
      dataSourceId: DST_DS,
      options: restOptions,
      coRelationId: id(100),
    });
    expect(store.versions).toMatchObject([
      { versionNumber: 1, dataSourceId: DST_DS, kind: 'restapi', createdBy: id(2) },
    ]);
    expect(store.folders).toMatchObject([{ name: 'Billing', organizationId: ORG }]);
    expect(store.queries[0].folderId).toBe(store.folders[0].id);
    expect(store.states).toMatchObject([{ libraryQueryId: store.queries[0].id, hasDraft: true }]);
    expect(result.queries[id(100)]).toBe(store.queries[0].id);
    expect(result.versions[id(101)]).toBe(store.versions[0].id);
    expect(store.updates).toEqual([
      {
        id: id(300),
        options: { libraryQueryId: store.queries[0].id, libraryQueryVersionId: store.versions[0].id, inputs: {} },
      },
    ]);
  });

  it('reuses a matching query and version and changes nothing on re-import', async () => {
    const query = Object.assign(new LibraryQuery(), {
      id: id(100),
      name: 'getInvoices',
      organizationId: ORG,
      options: { draft: 'untouched' },
      coRelationId: null,
    });
    const v1 = Object.assign(new LibraryQueryVersion(), {
      id: id(101),
      libraryQueryId: id(100),
      versionNumber: 1,
      kind: 'restapi',
      dataSourceId: DST_DS,
      options: restOptions,
      deletedAt: null,
    });
    const { store, run } = setup({ queries: [query], versions: [v1], consumers: [consumer(id(101))] });
    const result = await run([exportedQuery()]);

    expect(store.queries).toHaveLength(1);
    expect(store.queries[0].options).toEqual({ draft: 'untouched' });
    expect(store.versions).toHaveLength(1);
    expect(result).toEqual({ queries: { [id(100)]: id(100) }, versions: { [id(101)]: id(101) }, skipped: [] });
    expect(store.updates).toEqual([]);
  });

  it('adds the next version number when the exported snapshot differs, leaving the draft alone', async () => {
    const query = Object.assign(new LibraryQuery(), {
      id: id(200),
      name: 'getInvoices',
      organizationId: ORG,
      options: { draft: 'mine' },
      coRelationId: null,
    });
    const own = Object.assign(new LibraryQueryVersion(), {
      id: id(201),
      libraryQueryId: id(200),
      versionNumber: 1,
      kind: 'restapi',
      dataSourceId: DST_DS,
      options: { ...restOptions, url: 'http://different' },
      deletedAt: null,
    });
    const { store, run } = setup({ queries: [query], versions: [own], consumers: [consumer(id(101))] });
    const result = await run([exportedQuery()]);

    expect(store.queries[0].options).toEqual({ draft: 'mine' });
    expect(store.versions).toHaveLength(2);
    expect(store.versions[1]).toMatchObject({ libraryQueryId: id(200), versionNumber: 2, options: restOptions });
    expect(result.queries[id(100)]).toBe(id(200));
    expect(result.versions[id(101)]).toBe(store.versions[1].id);
  });

  it('never reuses a number held by a soft-deleted version, and does not match it', async () => {
    const query = Object.assign(new LibraryQuery(), {
      id: id(200),
      name: 'getInvoices',
      organizationId: ORG,
      options: {},
    });
    // The fake find() returns it too, so matchLibraryVersion itself has to skip it.
    const deleted = Object.assign(new LibraryQueryVersion(), {
      id: id(202),
      libraryQueryId: id(200),
      versionNumber: 3,
      kind: 'restapi',
      dataSourceId: DST_DS,
      options: restOptions,
      deletedAt: new Date(),
    });
    const { store, run } = setup({ queries: [query], versions: [deleted] });
    await run([exportedQuery()]);

    expect(store.versions.filter((v) => !v.deletedAt)).toMatchObject([{ versionNumber: 4, options: restOptions }]);
  });

  it('remaps ToolJet DB table ids in the draft and versions, and keeps an unmapped one', async () => {
    const { store, run } = setup();
    const tjdb = (table_id: string) => ({
      kind: 'tooljetdb',
      dataSourceId: SRC_DS,
      options: { operation: 'list_rows', table_id },
    });
    await run(
      [
        exportedQuery({
          draft: tjdb('orders-a'),
          versions: [
            { id: id(101), versionNumber: 1, ...tjdb('orders-a') },
            { id: id(102), versionNumber: 2, ...tjdb('gone') },
          ],
        }),
      ],
      { 'orders-a': { id: 'orders-b' } }
    );

    expect(store.queries[0].options).toMatchObject({ table_id: 'orders-b', organization_id: ORG });
    expect(store.versions.map((v) => v.options.table_id)).toEqual(['orders-b', 'gone']);
  });

  it('stores null for a version data source that maps to nothing and falls back to a static source for the draft', async () => {
    const { store, run } = setup();
    const local = { kind: 'runjs', dataSourceId: id(999), options: { code: '' } };
    await run([exportedQuery({ name: 'code', draft: local, versions: [{ id: id(101), versionNumber: 1, ...local }] })]);

    expect(store.versions[0].dataSourceId).toBeNull();
    expect(store.queries[0].dataSourceId).toBe(id(850));
  });

  it('skips a query whose draft has no data source to land on', async () => {
    const { store, run, logger } = setup();
    const orphan = { kind: 'weirdplugin', dataSourceId: id(999), options: {} };
    const result = await run([exportedQuery({ draft: orphan, versions: [] })]);

    expect(store.queries).toEqual([]);
    expect(result.queries).toEqual({});
    expect(result.skipped).toEqual(['getInvoices']);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('getInvoices'));
  });

  describe('permission', () => {
    const nobody: Perms = {};
    const noWrites = (manager: ReturnType<typeof setup>['manager']) => expect(manager.save).not.toHaveBeenCalled();

    it('refuses a user without module rights before creating the library', async () => {
      const { run, manager } = setup({}, { library: false, perms: nobody });
      await expect(run([exportedQuery()])).rejects.toThrow(ForbiddenException);
      noWrites(manager);
    });

    it('refuses a user without module rights when a query would be created', async () => {
      const { run, manager, store } = setup({}, { perms: nobody });
      await expect(run([exportedQuery()])).rejects.toThrow(ForbiddenException);
      noWrites(manager);
      expect(store.queries).toEqual([]);
    });

    it('refuses a user without module rights when only a version would be added', async () => {
      const query = Object.assign(new LibraryQuery(), { id: id(100), name: 'getInvoices', organizationId: ORG });
      const { run, manager, store } = setup({ queries: [query] }, { perms: nobody });
      await expect(run([exportedQuery()])).rejects.toThrow(ForbiddenException);
      noWrites(manager);
      expect(store.versions).toEqual([]);
    });

    it('lets a user without module rights re-import what already exists', async () => {
      const query = Object.assign(new LibraryQuery(), { id: id(100), name: 'getInvoices', organizationId: ORG });
      const v1 = Object.assign(new LibraryQueryVersion(), {
        id: id(101),
        libraryQueryId: id(100),
        versionNumber: 1,
        kind: 'restapi',
        dataSourceId: DST_DS,
        options: restOptions,
        deletedAt: null,
      });
      const { run, manager, abilityService } = setup({ queries: [query], versions: [v1] }, { perms: nobody });
      await expect(run([exportedQuery()])).resolves.toMatchObject({ queries: { [id(100)]: id(100) } });
      noWrites(manager);
      expect(abilityService.resourceActionsPermission).not.toHaveBeenCalled();
    });

    it.each([
      ['a super admin', { isSuperAdmin: true }],
      ['an admin', { isAdmin: true }],
      ['a user with moduleCreate', { moduleCreate: true }],
    ])('allows %s', async (_label, perms) => {
      const { run, store } = setup({}, { library: false, perms });
      await run([exportedQuery()]);
      expect(store.queries).toHaveLength(1);
    });
  });

  it('does not let two incoming queries claim the same local row', async () => {
    const query = Object.assign(new LibraryQuery(), { id: id(100), name: 'getInvoices', organizationId: ORG });
    const { store, run } = setup({ queries: [query] });
    const result = await run([
      exportedQuery({ id: id(100), versions: [] }),
      exportedQuery({ id: id(110), name: 'getInvoices', versions: [] }),
    ]);

    expect(result.queries[id(100)]).toBe(id(100));
    expect(result.queries[id(110)]).not.toBe(id(100));
    expect(store.queries).toHaveLength(2);
  });
});
