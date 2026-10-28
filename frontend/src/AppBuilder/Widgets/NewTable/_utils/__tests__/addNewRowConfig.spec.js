import { resolveAddNewRowIn, getAddNewRowColumns } from '../addNewRowConfig';

const columns = [
  { name: 'Name', columnType: 'string' },
  { key: 'email', name: 'Email', columnType: 'string' },
  { name: 'Photo', columnType: 'image' },
  { name: 'Open', columnType: 'button' },
  { name: 'Role', columnType: 'string' },
];

const keysOf = (list) => list.map((column) => column.key || column.name);

describe('Table-ADDROWFORM-002 add new row placement', () => {
  test.each([
    ['table', 'table'],
    ['dialog', 'dialog'],
    [undefined, 'table'],
    [null, 'table'],
    ['', 'table'],
    ['popup', 'table'],
    [{ a: 1 }, 'table'],
  ])('Table-ADDROWFORM-002 %p resolves to %p', (value, expected) => {
    // Break this catches: an unset or garbled `addNewRowIn` yielding a placement that renders nothing.
    expect(resolveAddNewRowIn(value)).toBe(expected);
  });
});

describe('Table-ADDROWFORM-003 columns to include', () => {
  test('Table-ADDROWFORM-003 an unset selection includes every eligible column', () => {
    // Break this catches: a saved app (no selection stored) opening the form with no fields.
    expect(keysOf(getAddNewRowColumns(columns, undefined))).toEqual(['Name', 'email', 'Photo', 'Role']);
    expect(keysOf(getAddNewRowColumns(columns, null))).toEqual(['Name', 'email', 'Photo', 'Role']);
  });

  test('Table-ADDROWFORM-003 a selection includes only the chosen columns, in column order', () => {
    // Break this catches: the selection ignored, or fields following click order instead of column order.
    expect(keysOf(getAddNewRowColumns(columns, ['Role', 'email']))).toEqual(['email', 'Role']);
  });

  test('Table-ADDROWFORM-003 a selected key that no longer matches a column is ignored', () => {
    // Break this catches: a renamed or deleted column leaving a ghost field or throwing.
    expect(keysOf(getAddNewRowColumns(columns, ['gone', 'email']))).toEqual(['email']);
  });
});

describe('Table-ADDROWFORM-004 eligible column types', () => {
  test('Table-ADDROWFORM-004 image columns are eligible', () => {
    // Break this catches: image columns dropped from the form, so no URL could be entered.
    expect(keysOf(getAddNewRowColumns(columns, ['Photo']))).toEqual(['Photo']);
  });

  test('Table-ADDROWFORM-004 button (action) columns are never eligible, selected or not', () => {
    // Break this catches: an action column showing up as an empty field in the form.
    expect(keysOf(getAddNewRowColumns(columns, undefined))).not.toContain('Open');
    expect(keysOf(getAddNewRowColumns(columns, ['Open', 'Name']))).toEqual(['Name']);
  });

  test('Table-ADDROWFORM-004 empty entries in the column list are skipped', () => {
    // Break this catches: a null column entry crashing the form.
    expect(keysOf(getAddNewRowColumns([null, undefined, columns[0]], undefined))).toEqual(['Name']);
  });
});
