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
  });
});
