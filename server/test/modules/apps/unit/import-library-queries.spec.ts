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
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
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
  drafts: LibraryQueryDraft[];
  consumers: { id: string; options: unknown }[];
  updates: { id: string; options: Record<string, unknown> }[];
  counter: number;
};

function fakeManager(store: Store) {
  const entities: Record<string, 'queries' | 'folders' | 'states' | 'versions' | 'drafts'> = {
    LibraryQuery: 'queries',
    LibraryQueryFolder: 'folders',
    LibraryQueryState: 'states',
    LibraryQueryVersion: 'versions',
    LibraryQueryDraft: 'drafts',
  };
  return {
    find: jest.fn(async (entity: { name: string }, { where }: { where: Record<string, unknown> }) => {
      if (entity === DataQuery)
        return store.consumers.map((consumer) => ({ ...consumer, dataSource: { kind: 'library' } }));
      if (entity === DataSource) return [{ id: id(850), kind: 'runjs' }];
      if (entity === AppEnvironment) return [{ id: id(700), name: 'development', priority: 1 }];
      const rows = store[entities[entity.name]] as unknown as Record<string, unknown>[];
      return rows.filter((row) => Object.entries(where).every(([key, value]) => row[key] === value));
    }),
    findOne: jest.fn(async (entity, { where }) =>
      entity === LibraryQuery
        ? store.queries.find((row) => row.id === where.id && row.organizationId === where.organizationId)
        : null
    ),
    findOneBy: jest.fn(async (entity, where) =>
      store[entities[entity.name]].find((row) => Object.entries(where).every(([key, value]) => row[key] === value))
    ),
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
type ImportResult = { queries: Record<string, string>; versions: Record<string, string> };
type Importer = { importLibraryQueries: (...args: unknown[]) => Promise<ImportResult> };

function setup(overrides: Partial<Store> = {}, { perms = { isAdmin: true } as Perms } = {}) {
  const store: Store = {
    queries: [],
    folders: [],
    states: [],
    versions: [],
    drafts: [],
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

const snapshot = (n: number, name: string, extra = {}) => ({
  id: id(n),
  name,
  description: null,
  createdFromVersionId: null,
  kind: 'restapi',
  dataSourceId: SRC_DS,
  options: restOptions,
  ...extra,
});
const exportedQuery = (extra: Partial<LibraryExportQuery> = {}): LibraryExportQuery => ({
  id: id(100),
  coRelationId: null,
  name: 'getInvoices',
  folder: null,
  releasedVersionId: null,
  drafts: [snapshot(102, 'working')],
  versions: [{ ...snapshot(101, 'saved'), versionNumber: 1, environment: { name: 'development', priority: 1 } }],
  ...extra,
});
const consumer = (versionId: string) => ({
  id: id(300),
  options: JSON.stringify({ libraryQueryId: id(100), libraryQueryVersionId: versionId, inputs: {} }),
});
/** @group platform */
describe('AppImportExportService named library import', () => {
  it('imports independent named snapshots and maps consumers to the correct saved UUID', async () => {
    const { store, run } = setup({ consumers: [consumer(id(101))] });
    const result = await run([exportedQuery({ folder: 'Billing' })]);
    expect(store.queries).toMatchObject([{ name: 'getInvoices', organizationId: ORG, coRelationId: id(100) }]);
    expect(store.queries[0]).not.toHaveProperty('options');
    expect(store.drafts).toMatchObject([{ name: 'working', dataSourceId: DST_DS, options: restOptions }]);
    expect(store.versions).toMatchObject([
      { name: 'saved', versionNumber: 1, dataSourceId: DST_DS, currentEnvironmentId: id(700) },
    ]);
    expect(store.states).toMatchObject([{ libraryQueryId: store.queries[0].id, releasedVersionId: null }]);
    expect(result.versions[id(102)]).toBe(store.drafts[0].id);
    expect(store.updates).toMatchObject([
      { options: { libraryQueryId: store.queries[0].id, libraryQueryVersionId: store.versions[0].id } },
    ]);
  });
  it('keeps two same-content snapshots distinct when their names differ', async () => {
    const { store, run } = setup();
    await run([exportedQuery({ drafts: [snapshot(102, 'alpha'), snapshot(103, 'beta')] })]);
    expect(store.drafts.map((row) => row.name)).toEqual(['alpha', 'beta']);
    expect(new Set(store.drafts.map((row) => row.id)).size).toBe(2);
  });
  it('reuses snapshots only when status, name, content, metadata and parent all match', async () => {
    const query = Object.assign(new LibraryQuery(), { id: id(100), name: 'getInvoices', organizationId: ORG });
    const saved = Object.assign(new LibraryQueryVersion(), {
      ...snapshot(101, 'saved'),
      dataSourceId: DST_DS,
      libraryQueryId: query.id,
      versionNumber: 1,
      currentEnvironmentId: id(700),
    });
    const { store, run } = setup(
      {
        queries: [query],
        versions: [saved],
        states: [Object.assign(new LibraryQueryState(), { libraryQueryId: query.id, releasedVersionId: null })],
      },
      { perms: {} }
    );
    expect(await run([exportedQuery({ drafts: [] })])).toMatchObject({ versions: { [id(101)]: id(101) } });
    expect(store.versions).toHaveLength(1);
    await expect(
      run([
        exportedQuery({
          drafts: [],
          versions: [{ ...exportedQuery().versions[0], description: 'Different metadata' }],
        }),
      ])
    ).rejects.toMatchObject({ status: 409 });
  });
  it('rejects same-name content under the other status', async () => {
    const query = Object.assign(new LibraryQuery(), { id: id(100), name: 'getInvoices', organizationId: ORG });
    const draft = Object.assign(new LibraryQueryDraft(), {
      ...snapshot(9, 'saved'),
      libraryQueryId: query.id,
      dataSourceId: DST_DS,
    });
    const { run } = setup({ queries: [query], drafts: [draft] });
    await expect(run([exportedQuery({ drafts: [] })])).rejects.toMatchObject({ status: 409 });
  });
  it('remaps ancestors before children and maps the Released pointer', async () => {
    const query = exportedQuery({
      drafts: [snapshot(102, 'working', { createdFromVersionId: id(101) })],
      releasedVersionId: id(101),
      versions: [
        { ...snapshot(101, 'child', { createdFromVersionId: id(104) }), versionNumber: 2, environment: null },
        { ...snapshot(104, 'parent'), versionNumber: 1, environment: null },
      ],
    });
    const { store, run } = setup();
    const result = await run([query]);
    expect(store.versions).toMatchObject([
      { name: 'parent' },
      { name: 'child', createdFromVersionId: result.versions[id(104)] },
    ]);
    expect(store.drafts[0].createdFromVersionId).toBe(result.versions[id(101)]);
    expect(store.states[store.states.length - 1].releasedVersionId).toBe(result.versions[id(101)]);
  });
  it('never reuses a number held by a deleted saved version', async () => {
    const query = Object.assign(new LibraryQuery(), { id: id(100), name: 'getInvoices', organizationId: ORG });
    const deleted = Object.assign(new LibraryQueryVersion(), {
      id: id(9),
      libraryQueryId: query.id,
      name: 'old',
      versionNumber: 3,
      deletedAt: new Date(),
    });
    const { store, run } = setup({ queries: [query], versions: [deleted] });
    await run([exportedQuery({ drafts: [] })]);
    expect(store.versions[store.versions.length - 1].versionNumber).toBe(4);
  });
  it('remaps ToolJet DB tables in drafts and saved snapshots', async () => {
    const { store, run } = setup();
    const extra = { kind: 'tooljetdb', options: { operation: 'list_rows', table_id: 'orders-a' } };
    await run(
      [
        exportedQuery({
          drafts: [snapshot(102, 'working', extra)],
          versions: [{ ...snapshot(101, 'saved', extra), versionNumber: 1, environment: null }],
        }),
      ],
      { 'orders-a': { id: 'orders-b' } }
    );
    expect(store.drafts[0].options).toMatchObject({ table_id: 'orders-b', organization_id: ORG });
    expect(store.versions[0].options.table_id).toBe('orders-b');
  });
  it('retains null for sources that were not exported without inventing a static source', async () => {
    const { store, run } = setup();
    await run([exportedQuery({ drafts: [snapshot(102, 'working', { dataSourceId: id(999) })] })]);
    expect(store.drafts[0].dataSourceId).toBeNull();
  });
  it.each([{}, { moduleCreate: false }])('refuses unauthorized library allocation before writing', async (perms) => {
    const { run, manager } = setup({}, { perms });
    await expect(run([exportedQuery()])).rejects.toThrow(ForbiddenException);
    expect(manager.save).not.toHaveBeenCalled();
  });
  it.each([{ isSuperAdmin: true }, { isAdmin: true }, { moduleCreate: true }])(
    'allows a library writer',
    async (perms) => {
      const { run, store } = setup({}, { perms });
      await run([exportedQuery()]);
      expect(store.queries).toHaveLength(1);
    }
  );
  it('rejects an old implicit draft before any allocation', async () => {
    const { run, manager } = setup();
    const old = { ...exportedQuery(), draft: snapshot(102, 'implicit') };
    delete old.drafts;
    await expect(run([old])).rejects.toMatchObject({ status: 400 });
    expect(manager.save).not.toHaveBeenCalled();
  });
});
