/** @group database */
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';

// An imported app's ToolJet Database queries name tables by the exporting workspace's ids. Import
// rewrites every table id to the importing workspace's table; one left behind makes the query fail
// with "Table not found" at run time.
describe('AppImportExportService.replaceTooljetDbTableIds', () => {
  // The remap is pure - a bare prototype instance needs none of the constructor's dependencies.
  const service = Object.create(AppImportExportService.prototype) as AppImportExportService;
  const mapping = { 'old-orders': { id: 'new-orders' }, 'old-items': { id: 'new-items' } };

  describe('join_tables', () => {
    const joinOptions = {
      operation: 'join_tables',
      join_table: {
        from: { name: 'old-orders', type: 'Table' },
        joins: [],
        fields: [],
        aggregates: {
          'aggregate-1': { aggFx: 'sum', column: 'quantity', table_id: 'old-items', columnId: 'column-uuid' },
        },
        group_by: { 'old-orders': ['status'] },
      },
    };

    it('should remap the table id of each aggregate', () => {
      const result = service.replaceTooljetDbTableIds(joinOptions, mapping, 'org-2');

      expect(result.join_table.aggregates).toEqual({
        'aggregate-1': { aggFx: 'sum', column: 'quantity', table_id: 'new-items', columnId: 'column-uuid' },
      });
    });

    it('should remap the table ids that key the group by', () => {
      const result = service.replaceTooljetDbTableIds(joinOptions, mapping, 'org-2');

      expect(result.join_table.group_by).toEqual({ 'new-orders': ['status'] });
    });

    it('should keep a table id the mapping does not know', () => {
      const result = service.replaceTooljetDbTableIds({ ...joinOptions, table_id: 'unknown' }, mapping, 'org-2');

      expect(result.table_id).toBe('unknown');
    });
  });
});

// Export names each table by its co_relation_id, so the exported queries must name it the same way
// for import's mapping (keyed by that id) to find it.
describe('AppImportExportService.pointTooljetDbQueriesAtCoRelationIds', () => {
  const service = Object.create(AppImportExportService.prototype) as AppImportExportService;
  const coRelationIdByTableId = { 'local-orders': 'corel-orders' };
  const tjdbQuery = () => ({
    kind: 'tooljetdb',
    options: { operation: 'list_rows', table_id: 'local-orders', organization_id: 'org-1' },
  });
  const exportedApp = () => ({
    appV2: {
      dataQueries: [tjdbQuery(), { kind: 'restapi', options: { table_id: 'local-orders' } }],
      modules: [{ appV2: { dataQueries: [tjdbQuery()] } }],
    },
  });

  it('should point ToolJet DB queries of the app and its modules at co_relation ids', () => {
    const definition = exportedApp();

    service.pointTooljetDbQueriesAtCoRelationIds(definition as never, coRelationIdByTableId);

    expect(definition.appV2.dataQueries[0].options).toEqual({
      operation: 'list_rows',
      table_id: 'corel-orders',
      organization_id: 'org-1',
    });
    expect(definition.appV2.dataQueries[1].options.table_id).toBe('local-orders');
    expect(definition.appV2.modules[0].appV2.dataQueries[0].options.table_id).toBe('corel-orders');
  });

  it('should not modify the options of the loaded join query', () => {
    const field = { name: 'id', table: 'local-orders' };
    const joinQuery = {
      kind: 'tooljetdb',
      options: { operation: 'join_tables', join_table: { from: { name: 'local-orders' }, fields: [field] } },
    };
    const definition = { appV2: { dataQueries: [joinQuery] } };

    service.pointTooljetDbQueriesAtCoRelationIds(definition as never, coRelationIdByTableId);

    expect(field.table).toBe('local-orders');
    expect(definition.appV2.dataQueries[0].options.join_table).toMatchObject({
      from: { name: 'corel-orders' },
      fields: [{ name: 'id', table: 'corel-orders' }],
    });
  });
});
