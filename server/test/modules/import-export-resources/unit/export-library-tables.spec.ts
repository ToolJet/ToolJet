/// <reference types="jest" />
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { TooljetDbImportExportService } from '@modules/tooljet-db/services/tooljet-db-import-export.service';
import { InternalTableRepository } from '@modules/tooljet-db/repository';
import { AppsRepository } from '@modules/apps/repository';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { User } from '@entities/user.entity';

jest.mock('@modules/request-context/service', () => ({ RequestContext: { setLocals: jest.fn() } }));

// Library queries bring their ToolJet DB tables into the export. Git push zips the caller's
// `tooljet_database` array against the result, so the tables must be appended to that very array.
/** @group platform */
describe('ImportExportResourcesService.export library tables', () => {
  const user = { id: 'u1', organizationId: 'org1' } as unknown as User;
  const TABLE = (n: string) => `00000000-0000-4000-8000-00000000000${n}`;

  const libraryQuery = (tableId: string) => ({
    drafts: [{ kind: 'tooljetdb', dataSourceId: null, options: { operation: 'list_rows', table_id: tableId } }],
    versions: [],
  });

  // `existingTableIds` stands in for the workspace's internal tables; the lookup is org-scoped.
  function build(
    libraryQueries: unknown[],
    existingTableIds: string[] = [TABLE('1'), TABLE('2'), TABLE('3')],
    portableId: (tableId: string) => string = (tableId) => tableId
  ) {
    const findTables = jest.fn(async (_entity: unknown, options: { where: { id: { _value: string[] } } }) =>
      options.where.id._value.filter((id) => existingTableIds.includes(id)).map((id) => ({ id }))
    );
    const exportTable = jest.fn(async (_org: string, table: { table_id: string }) => ({
      id: portableId(table.table_id),
    }));
    const service = new ImportExportResourcesService(
      {
        export: jest.fn(async () => ({ appV2: { id: 'app1', ...(libraryQueries.length && { libraryQueries }) } })),
        replaceTooljetDbTableIds: AppImportExportService.prototype.replaceTooljetDbTableIds,
        pointTooljetDbQueriesAtCoRelationIds: AppImportExportService.prototype.pointTooljetDbQueriesAtCoRelationIds,
      } as unknown as AppImportExportService,
      { export: exportTable } as unknown as TooljetDbImportExportService,
      { manager: { find: findTables } } as unknown as InternalTableRepository,
      { findOne: jest.fn(async () => ({ id: 'app1', name: 'App' })) } as unknown as AppsRepository
    );
    return { service, exportTable, findTables };
  }

  const dto = (tooljet_database?: { table_id: string }[]) =>
    ({ organization_id: 'org1', app: [{ id: 'app1' }], tooljet_database }) as unknown as ExportResourcesDto;

  it('merges library table ids into the requested list without duplicates, in place', async () => {
    const { service, exportTable } = build([libraryQuery(TABLE('1')), libraryQuery(TABLE('2'))]);
    const requested = [{ table_id: TABLE('1') }];
    const result = await service.export(user, dto(requested));

    expect(requested).toEqual([{ table_id: TABLE('1') }, { table_id: TABLE('2') }]);
    // First pass builds the co_relation id map from the caller's list; second pass exports after
    // library tables are merged into that same array.
    expect(exportTable.mock.calls.map(([, table]) => table.table_id)).toEqual([TABLE('1'), TABLE('1'), TABLE('2')]);
    // same order as the caller's array, which is what the push mapping relies on
    expect(result.tooljet_database).toEqual([{ id: TABLE('1') }, { id: TABLE('2') }]);
  });

  it('passes the caller array itself to the table export, so foreign-key tables land in it', async () => {
    const { service, exportTable } = build([]);
    const requested = [{ table_id: TABLE('1') }];
    await service.export(user, dto(requested));
    expect(exportTable.mock.calls[0][2]).toBe(requested);
  });

  it('adds library tables when the caller asked for tables with an empty list', async () => {
    const { service } = build([libraryQuery(TABLE('3'))]);
    const requested: { table_id: string }[] = [];
    const result = await service.export(user, dto(requested));
    expect(requested).toEqual([{ table_id: TABLE('3') }]);
    expect(result.tooljet_database).toEqual([{ id: TABLE('3') }]);
  });

  it('merges nothing when the caller did not ask for tables', async () => {
    const { service, exportTable } = build([libraryQuery(TABLE('1'))]);
    const result = await service.export(user, dto(undefined));
    expect(exportTable).not.toHaveBeenCalled();
    expect(result.tooljet_database).toBeUndefined();
  });

  it('does not append a library table that no longer exists, and keeps the caller entries in order', async () => {
    const { service, exportTable, findTables } = build(
      [libraryQuery(TABLE('4')), libraryQuery(TABLE('2'))],
      [TABLE('1'), TABLE('2')]
    );
    const requested = [{ table_id: TABLE('1') }];
    const result = await service.export(user, dto(requested));

    expect(requested).toEqual([{ table_id: TABLE('1') }, { table_id: TABLE('2') }]);
    expect(exportTable.mock.calls.map(([, table]) => table.table_id)).toEqual([TABLE('1'), TABLE('1'), TABLE('2')]);
    expect(result.tooljet_database).toHaveLength(2);
    expect(findTables.mock.calls[0][1]).toMatchObject({ where: { organizationId: 'org1' } });
  });

  // A table exported for the first time gets a fresh co_relation_id and travels under it; import keys its table
  // mapping by that id, so the library snapshots must name the table the same way.
  it('names library tables in snapshots by the id the table export gave them', async () => {
    const query = {
      drafts: [{ kind: 'tooljetdb', dataSourceId: null, options: { operation: 'list_rows', table_id: TABLE('1') } }],
      versions: [
        { id: 'v1', versionNumber: 1, kind: 'tooljetdb', dataSourceId: null, options: { table_id: TABLE('1') } },
      ],
    };
    const { service } = build([query], undefined, (tableId) => `portable-${tableId}`);
    const result = await service.export(user, dto([]));

    const [exported] = (result.app[0].definition as { appV2: { libraryQueries: (typeof query)[] } }).appV2
      .libraryQueries;
    expect(exported.drafts[0].options.table_id).toBe(`portable-${TABLE('1')}`);
    expect(exported.versions[0].options.table_id).toBe(`portable-${TABLE('1')}`);
  });

  // F10: SQL-mode library queries name their tables in the SQL text, not under table_id.
  it('includes the table a SQL-mode library query reads', async () => {
    const sqlQuery = {
      drafts: [
        {
          kind: 'tooljetdb',
          dataSourceId: null,
          options: { operation: 'sql_execution', sql_execution: { sqlQuery: 'SELECT * FROM orders' } },
        },
      ],
      versions: [],
    };
    const { service, findTables } = build([sqlQuery]);
    // The workspace has `orders`; answer any org-scoped lookup by id or by name.
    const tables = [{ id: TABLE('5'), tableName: 'orders' }];
    const valuesOf = (where: Record<string, unknown>) =>
      Object.values(where ?? {}).flatMap((v) => {
        const raw = (v as { _value?: unknown })?._value ?? v;
        return Array.isArray(raw) ? raw : [raw];
      });
    findTables.mockImplementation(async (_entity: unknown, options: { where: unknown }) => {
      const clauses = (Array.isArray(options.where) ? options.where : [options.where]) as Record<string, unknown>[];
      return tables.filter((table) =>
        clauses.some((where) => valuesOf(where).some((value) => value === table.id || value === table.tableName))
      );
    });

    const requested: { table_id: string }[] = [];
    const result = await service.export(user, dto(requested));

    expect(requested).toEqual([{ table_id: TABLE('5') }]);
    expect(result.tooljet_database).toEqual([{ id: TABLE('5') }]);
  });

  it('skips the table lookup when no library table ids are found', async () => {
    const { service, findTables } = build([]);
    await service.export(user, dto([{ table_id: TABLE('1') }]));
    expect(findTables).not.toHaveBeenCalled();
  });
});
