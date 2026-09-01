/**
 * The table toolbar has a "Refresh data" button, but that capability was never
 * added to the schema's `actions` list — so there is no "Refresh" entry in the
 * Run Component Action picker. This pins the schema gap down.
 */
import { tableConfig } from '../table';

describe('Table widget schema — refresh action', () => {
  test('declares a "refresh" component action', () => {
    const refreshAction = tableConfig.actions.find((action) => action.handle === 'refreshTable');
    expect(refreshAction).toBeDefined();
  });
});
