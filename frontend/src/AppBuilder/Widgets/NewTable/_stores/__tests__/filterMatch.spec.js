import { tableConfig } from '@tooljet/widget-definitions';
import useTableStore from '../tableStore';

const TABLE_ID = 'filterui-match-table';

const table = () => useTableStore.getState();

function propertiesFor(properties) {
  table().initializeComponent(TABLE_ID);
  table().setTableProperties(TABLE_ID, properties);
  return table().getTableProperties(TABLE_ID);
}

describe('Table-FILTERUI-042 how the filters are matched', () => {
  test('Table-FILTERUI-042 a saved app without the property matches all filters, as before', () => {
    // Break this catches: an app saved before this feature suddenly matching any filter.
    expect(propertiesFor({}).filterMatch).toBe('and');
  });

  test('Table-FILTERUI-042 any is kept as saved', () => {
    // Break this catches: the property missing from the store allowlist, so the table never sees it.
    expect(propertiesFor({ filterMatch: 'or' }).filterMatch).toBe('or');
  });

  test('Table-FILTERUI-042 anything else falls back to all', () => {
    // Break this catches: a malformed value switching the filter rule.
    expect(propertiesFor({ filterMatch: 'maybe' }).filterMatch).toBe('and');
  });

  test('Table-FILTERUI-042 a newly created Table is defined as matching all, and offers the property', () => {
    // Break this catches: the property missing from the widget definition, so it is never saved.
    expect(tableConfig.definition.properties.filterMatch.value).toBe('and');
    expect(tableConfig.properties.filterMatch).toBeDefined();
  });
});
