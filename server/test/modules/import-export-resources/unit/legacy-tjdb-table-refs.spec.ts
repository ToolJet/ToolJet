/** @group database */
import { Logger } from '@nestjs/common';
import { ImportExportResourcesService, legacyTableRefsToEntryIds } from '@modules/import-export-resources/service';
import { RequestContext } from '@modules/request-context/service';
import { User } from 'src/entities/user.entity';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { ImportAppDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';

// Exports made between v3.21.13-beta and the co_relation rewrite name each table by its co_relation_id,
// but their ToolJet Database queries keep the source workspace's internal table id. Import maps tables
// by the co_relation_id, so the query's id never matches and the dropdown pins nothing in the target
// workspace. legacyTableRefsToEntryIds recovers the match from what the file proves and nothing more.
describe('legacyTableRefsToEntryIds', () => {
  const table = (id: string, tableName: string, referencing: { id: string; name: string }[] = []) =>
    ({
      id,
      table_name: tableName,
      schema: {
        columns: [],
        foreign_keys: referencing.map((ref) => ({ referenced_table_id: ref.id, referenced_table_name: ref.name })),
      },
    }) as unknown as ImportTooljetDatabaseDto;

  const tjdbQuery = (options: Record<string, unknown>) => ({ kind: 'tooljetdb', options });
  const app = (appV2: Record<string, unknown>) => [{ appName: 'app', definition: { appV2 } }] as ImportAppDto[];

  describe('when the file names its tables by co_relation_id and its queries by internal id', () => {
    it('should map the one referenced internal id to the one exported table', () => {
      const tables = [table('5f9a8d5a-corel-clients', 'clients')];
      const apps = app({ dataQueries: [tjdbQuery({ operation: 'list_rows', table_id: '6434d7a1-internal-clients' })] });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({
        '6434d7a1-internal-clients': '5f9a8d5a-corel-clients',
      });
    });

    it('should leave the query pointing at the table the target workspace created once the mapping is applied', () => {
      const service = Object.create(AppImportExportService.prototype) as AppImportExportService;
      const tables = [table('5f9a8d5a-corel-clients', 'clients')];
      const options = { operation: 'list_rows', table_id: '6434d7a1-internal-clients', organization_id: 'org-a' };
      const createdByEntryId = { '5f9a8d5a-corel-clients': { id: 'new-clients' } };

      const legacyToEntry = legacyTableRefsToEntryIds(tables, app({ dataQueries: [tjdbQuery(options)] }));
      const queryMapping = {
        ...createdByEntryId,
        ...Object.fromEntries(
          Object.entries(legacyToEntry).map(([source, entry]) => [source, createdByEntryId[entry]])
        ),
      };

      expect(service.replaceTooljetDbTableIds(options, queryMapping, 'org-b')).toMatchObject({
        table_id: 'new-clients',
        organization_id: 'org-b',
      });
    });
  });

  describe('which queries count', () => {
    const tables = [table('corel-orders', 'orders')];

    it('should ignore a module query: its table is never in the export, so it cannot pair with an unrelated table', () => {
      const apps = app({
        dataQueries: [],
        modules: [
          { appV2: { dataQueries: [tjdbQuery({ operation: 'list_rows', table_id: 'internal-module-table' })] } },
        ],
      });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({});
    });

    it('should read the table id of a query that stores it as tableId', () => {
      const apps = app({ dataQueries: [tjdbQuery({ operation: 'list_rows', tableId: 'internal-orders' })] });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({ 'internal-orders': 'corel-orders' });
    });

    it('should read a query that has no kind but belongs to a ToolJet Database data source', () => {
      const apps = app({
        dataSources: [{ id: 'ds-tjdb', kind: 'tooljetdb' }],
        dataQueries: [{ dataSourceId: 'ds-tjdb', options: { operation: 'list_rows', table_id: 'internal-orders' } }],
      });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({ 'internal-orders': 'corel-orders' });
    });

    it('should read the table a join query starts from', () => {
      const apps = app({
        dataQueries: [tjdbQuery({ operation: 'join_tables', join_table: { from: { name: 'internal-orders' } } })],
      });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({ 'internal-orders': 'corel-orders' });
    });

    it('should ignore a query of another kind that happens to carry a table_id', () => {
      const apps = app({ dataQueries: [{ kind: 'restapi', options: { table_id: 'internal-orders' } }] });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({});
    });
  });

  describe('when the file already names its queries by co_relation_id', () => {
    it('should map nothing', () => {
      const tables = [table('corel-orders', 'orders')];
      const apps = app({ dataQueries: [tjdbQuery({ operation: 'list_rows', table_id: 'corel-orders' })] });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({});
    });
  });

  describe('when several tables are exported', () => {
    it('should identify a table by the foreign key that names it, then match the one table left over', () => {
      const tables = [
        table('corel-orders', 'orders', [{ id: 'internal-customers', name: 'customers' }]),
        table('corel-customers', 'customers'),
      ];
      const apps = app({
        dataQueries: [
          tjdbQuery({ operation: 'list_rows', table_id: 'internal-orders' }),
          tjdbQuery({ operation: 'list_rows', table_id: 'internal-customers' }),
        ],
      });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({
        'internal-customers': 'corel-customers',
        'internal-orders': 'corel-orders',
      });
    });

    it('should map nothing when two references and two tables cannot be told apart', () => {
      const tables = [table('corel-orders', 'orders'), table('corel-customers', 'customers')];
      const apps = app({
        dataQueries: [
          tjdbQuery({ operation: 'list_rows', table_id: 'internal-orders' }),
          tjdbQuery({ operation: 'list_rows', table_id: 'internal-customers' }),
        ],
      });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({});
    });

    it('should map nothing when one reference could belong to either of two tables', () => {
      const tables = [table('corel-orders', 'orders'), table('corel-customers', 'customers')];
      const apps = app({ dataQueries: [tjdbQuery({ operation: 'list_rows', table_id: 'internal-orders' })] });

      expect(legacyTableRefsToEntryIds(tables, apps)).toEqual({});
    });
  });
});

// The recovery runs on every import that carries tables, after those tables are committed. A file shape
// it cannot read must cost it nothing more than the recovery.
describe('legacyTableRefsToEntryIds on a file shaped unexpectedly', () => {
  const tables = [{ id: 'corel-orders', table_name: 'orders', schema: { columns: [], foreign_keys: [] } }] as never;
  const queryWith = (options: unknown) => [{ kind: 'tooljetdb', options }];
  const definitions: [string, unknown][] = [
    ['no appV2', { dataQueries: [] }],
    ['null dataQueries', { appV2: { dataQueries: null } }],
    ['null dataSources', { appV2: { dataSources: null, dataQueries: queryWith({ table_id: 'a' }) } }],
    ['null query', { appV2: { dataQueries: [null] } }],
    ['null options', { appV2: { dataQueries: queryWith(null) } }],
    ['modules without appV2', { appV2: { dataQueries: [], modules: [{}, null] } }],
    ['joins as an object', { appV2: { dataQueries: queryWith({ join_table: { joins: { a: 1 } } }) } }],
    ['joins holding null', { appV2: { dataQueries: queryWith({ join_table: { joins: [null] } }) } }],
    ['fields holding null', { appV2: { dataQueries: queryWith({ join_table: { fields: [null] } }) } }],
    ['aggregates holding null', { appV2: { dataQueries: queryWith({ join_table: { aggregates: { a: null } } }) } }],
    ['group_by as an array', { appV2: { dataQueries: queryWith({ join_table: { group_by: ['a'] } }) } }],
    ['join_table as a string', { appV2: { dataQueries: queryWith({ join_table: 'x' }) } }],
  ];

  it.each(definitions)('should not throw on %s', (_name, definition) => {
    expect(() => legacyTableRefsToEntryIds(tables, [{ appName: 'a', definition }] as never)).not.toThrow();
  });

  it.each([
    ['schema missing', undefined],
    ['foreign_keys as an object', { foreign_keys: { a: 1 } }],
    ['foreign_keys holding null', { foreign_keys: [null] }],
  ])('should not throw on a table with %s', (_name, schema) => {
    const brokenTables = [{ id: 'corel-orders', table_name: 'orders', schema }] as never;
    const apps = [
      { appName: 'a', definition: { appV2: { dataQueries: queryWith({ table_id: 'internal-orders' }) } } },
    ] as never;

    expect(() => legacyTableRefsToEntryIds(brokenTables, apps)).not.toThrow();
  });
});

// import() must pass the app import the same mapping as before for everything but a non-git legacy file:
// a file already keyed by co_relation_id, a git pull, an import without tables.
describe('ImportExportResourcesService.import', () => {
  const createdTable = { id: 'new-clients', table_name: 'clients' };
  const user = { id: 'user-1', organizationId: 'org-b' } as User;
  const entry = (id: string) => ({ id, table_name: 'clients', schema: { columns: [], foreign_keys: [] } });
  const definition = (tableId: string) => ({
    appV2: { dataQueries: [{ kind: 'tooljetdb', options: { operation: 'list_rows', table_id: tableId } }] },
  });

  const setup = () => {
    const appImportExportService = { import: jest.fn().mockResolvedValue({ newApp: { id: 'app-1', name: 'app' } }) };
    const tooljetDbImportExportService = {
      bulkImport: jest.fn().mockResolvedValue({
        tableNameMapping: { 'corel-clients': createdTable },
        tooljet_database: [createdTable],
      }),
    };
    const internalTableRepository = { findExistingIds: jest.fn().mockResolvedValue(new Set<string>()) };
    const service = new ImportExportResourcesService(
      appImportExportService as never,
      tooljetDbImportExportService as never,
      internalTableRepository as never,
      {} as never
    );
    const importFile = (file: { tables: ReturnType<typeof entry>[]; tableId: string }, isGitApp = false) =>
      service.import(
        user,
        {
          organization_id: 'org-b',
          tooljet_version: '3.21.0',
          skip_permissions_group_check: true,
          tooljet_database: file.tables,
          app: [{ appName: 'app', definition: definition(file.tableId) }],
        } as never,
        false,
        isGitApp,
        false,
        {} as never
      );
    const mappingGivenToAppImport = () => appImportExportService.import.mock.calls[0][3].tooljet_database;
    return {
      importFile,
      mappingGivenToAppImport,
      tooljetDbImportExportService,
      internalTableRepository,
      appImportExportService,
    };
  };

  let warn: jest.SpyInstance;
  beforeEach(() => {
    jest.spyOn(RequestContext, 'setLocals').mockImplementation(() => undefined);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  const legacyFile = { tables: [entry('corel-clients')], tableId: 'internal-clients' };

  it('should map a legacy export query to the table the import created', async () => {
    const { importFile, mappingGivenToAppImport } = setup();

    await importFile(legacyFile);

    expect(mappingGivenToAppImport()).toEqual({
      'corel-clients': createdTable,
      'internal-clients': createdTable,
    });
  });

  it('should hand a git pull exactly the mapping the table import returned', async () => {
    const { importFile, mappingGivenToAppImport } = setup();

    await importFile(legacyFile, true);

    expect(mappingGivenToAppImport()).toEqual({ 'corel-clients': createdTable });
    expect(warn).not.toHaveBeenCalled();
  });

  it('should hand a file that names its queries by co_relation_id exactly the mapping the table import returned', async () => {
    const { importFile, mappingGivenToAppImport } = setup();

    await importFile({ tables: [entry('corel-clients')], tableId: 'corel-clients' });

    expect(mappingGivenToAppImport()).toEqual({ 'corel-clients': createdTable });
    expect(warn).not.toHaveBeenCalled();
  });

  it('should hand an import without tables an empty mapping and skip the table import', async () => {
    const { importFile, mappingGivenToAppImport, tooljetDbImportExportService } = setup();

    await importFile({ tables: [], tableId: 'internal-clients' });

    expect(tooljetDbImportExportService.bulkImport).not.toHaveBeenCalled();
    expect(mappingGivenToAppImport()).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('should warn about a query table id the import could not map', async () => {
    const { importFile, mappingGivenToAppImport } = setup();

    await importFile({ tables: [entry('corel-clients'), entry('corel-orders')], tableId: 'internal-clients' });

    expect(mappingGivenToAppImport()).toEqual({ 'corel-clients': createdTable });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('internal-clients'));
  });
  it('should leave a same-workspace legacy import untouched: its query ids are already valid there', async () => {
    const { importFile, mappingGivenToAppImport, internalTableRepository } = setup();
    internalTableRepository.findExistingIds.mockResolvedValue(new Set(['internal-clients']));

    await importFile(legacyFile);

    expect(mappingGivenToAppImport()).toEqual({ 'corel-clients': createdTable });
    expect(warn).not.toHaveBeenCalled();
  });

  it('should still import the app, with the plain mapping, when the recovery fails', async () => {
    const { importFile, mappingGivenToAppImport, internalTableRepository, appImportExportService } = setup();
    internalTableRepository.findExistingIds.mockRejectedValue(new Error('connection lost'));

    await expect(importFile(legacyFile)).resolves.toMatchObject({ app: [{ id: 'app-1' }] });

    expect(appImportExportService.import).toHaveBeenCalledTimes(1);
    expect(mappingGivenToAppImport()).toEqual({ 'corel-clients': createdTable });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('connection lost'));
  });

  it('should not look anything up for a git pull', async () => {
    const { importFile, internalTableRepository } = setup();

    await importFile(legacyFile, true);

    expect(internalTableRepository.findExistingIds).not.toHaveBeenCalled();
  });
});
