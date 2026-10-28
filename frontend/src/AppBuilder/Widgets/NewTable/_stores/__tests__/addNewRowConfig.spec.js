import { tableConfig } from '@tooljet/widget-definitions';
import useTableStore from '../tableStore';

const TABLE_ID = 'addrowform-config-table';

const table = () => useTableStore.getState();

/** setTableProperties is the table store's public entry point for resolved widget properties. */
function propertiesFor(properties) {
  table().initializeComponent(TABLE_ID);
  table().setTableProperties(TABLE_ID, properties);
  return table().getTableProperties(TABLE_ID);
}

describe('Table-ADDROWFORM-001 allow adding multiple rows default', () => {
  test('Table-ADDROWFORM-001 a saved app without the property keeps multi-row adding on', () => {
    // Break this catches: an app saved before this feature losing the multi-row popup it has today.
    expect(propertiesFor({}).allowAddingMultipleRows).toBe(true);
  });

  test('Table-ADDROWFORM-001 an explicit off stays off', () => {
    // Break this catches: the fallback overriding a builder's explicit choice.
    expect(propertiesFor({ allowAddingMultipleRows: false }).allowAddingMultipleRows).toBe(false);
  });

  test('Table-ADDROWFORM-001 a newly created Table is defined with multi-row adding off', () => {
    // Break this catches: new tables defaulting to multi-row, contrary to the approved default.
    expect(tableConfig.definition.properties.allowAddingMultipleRows.value).toBe('{{false}}');
  });
});

describe('Table-ADDROWFORM-002 placement and columns reach the table store', () => {
  test('Table-ADDROWFORM-002 a missing placement resolves to the table popover', () => {
    // Break this catches: the new property missing from the store allowlist, leaving it undefined.
    expect(propertiesFor({}).addNewRowIn).toBe('table');
  });

  test('Table-ADDROWFORM-002 an explicit dialog placement is kept', () => {
    // Break this catches: the placement dropped before the form can read it.
    expect(propertiesFor({ addNewRowIn: 'dialog' }).addNewRowIn).toBe('dialog');
  });

  test('Table-ADDROWFORM-003 the column selection is kept, and unset stays unset', () => {
    // Break this catches: the selection dropped, or defaulted to an empty list that hides every field.
    expect(propertiesFor({ addNewRowColumns: ['email'] }).addNewRowColumns).toEqual(['email']);
    expect(propertiesFor({}).addNewRowColumns).toBeUndefined();
  });
});
