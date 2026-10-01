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

// Break this catches: the "Disable row deselection" label stops clarifying that it governs
// cell clicks, not the selection checkbox, if the tip text is removed or reworded away from that meaning.
describe('Table widget schema — disableRowDeselection tooltip', () => {
  test('clarifies that the setting affects cell clicks, not the selection checkbox', () => {
    expect(tableConfig.properties.disableRowDeselection.tip).toBe(
      'Prevents deselecting a row by clicking its cells. Does not affect the selection checkbox.'
    );
  });
});
