import { tableConfig } from '@tooljet/widget-definitions';
import useTableStore from '../tableStore';

const TABLE_ID = 'filterui-config-table';

const table = () => useTableStore.getState();

/** setTableProperties is the table store's public entry point for resolved widget properties. */
function propertiesFor(properties) {
  table().initializeComponent(TABLE_ID);
  table().setTableProperties(TABLE_ID, properties);
  return table().getTableProperties(TABLE_ID);
}

const BUILDER_FILTERS = [{ id: 'f1', column: 'c-name', condition: 'contains', value: 'a' }];

describe('Table-FILTERUI-001 default filters on a saved app', () => {
  test('Table-FILTERUI-001 a saved app without the property resolves to no builder filters', () => {
    // Break this catches: the fallback missing, so an app saved before this feature gets undefined filters.
    expect(propertiesFor({}).defaultFilters).toEqual([]);
  });

  test('Table-FILTERUI-001 a value that is not a list resolves to no builder filters', () => {
    // Break this catches: a malformed saved value reaching the table, which would then try to map over it.
    expect(propertiesFor({ defaultFilters: 'oops' }).defaultFilters).toEqual([]);
  });
});

describe('Table-FILTERUI-002 default filters reach the table store', () => {
  test('Table-FILTERUI-002 a newly created Table is defined with no default filters', () => {
    // Break this catches: a new Table shipping with a filter the builder never added.
    expect(tableConfig.definition.properties.defaultFilters.value).toEqual([]);
  });

  test('Table-FILTERUI-002 the property is offered on the Table so the inspector can write it', () => {
    // Break this catches: the property missing from the widget definition, so it is never saved.
    expect(tableConfig.properties.defaultFilters).toBeDefined();
  });

  test('Table-FILTERUI-002 the builder filters are kept as saved', () => {
    // Break this catches: the property missing from the store allowlist, so the table never sees it.
    expect(propertiesFor({ defaultFilters: BUILDER_FILTERS }).defaultFilters).toEqual(BUILDER_FILTERS);
  });
});
