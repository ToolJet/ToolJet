import { resolveAddNewRowIn, getAddNewRowColumns, hasColumnValidation } from '../addNewRowConfig';

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

describe('Table-ADDROWFORM-026 columns that have validation', () => {
  test.each([
    ['string', { minLength: '3' }],
    ['string', { maxLength: '10' }],
    ['string', { regex: '^[a-z]+$' }],
    ['string', { customRule: '{{cellValue.startsWith("A")}}' }],
    [undefined, { minLength: 1 }],
    ['default', { maxLength: 5 }],
    ['text', { minLength: '2' }],
    ['number', { minValue: '1' }],
    ['number', { maxValue: 0 }],
    ['number', { customRule: '{{cellValue > 1}}' }],
    ['select', { customRule: '{{cellValue !== "a"}}' }],
    ['newMultiSelect', { customRule: '{{cellValue.length > 0}}' }],
    ['tagsV2', { customRule: '{{true}}' }],
    ['datepicker', { minDate: '01/01/2020' }],
    ['datepicker', { maxDate: '01/01/2030' }],
    ['datepicker', { minTime: '09:00' }],
    ['datepicker', { maxTime: '17:00' }],
    ['datepicker', { customRule: '{{true}}' }],
  ])('Table-ADDROWFORM-026 %s column with %j has validation', (columnType, rules) => {
    // Break this catches: a configured rule not marking its field, so users cannot tell which fields are checked.
    expect(hasColumnValidation({ name: 'X', columnType, ...rules })).toBe(true);
  });

  test.each([
    ['string', {}],
    ['string', { minLength: '', maxLength: undefined, regex: null, customRule: '   ' }],
    ['number', { minValue: '', maxValue: '' }],
    ['string', { minValue: '5' }],
    ['number', { minLength: '5', regex: '^1$' }],
    ['select', { minLength: '1' }],
    ['datepicker', { disabledDates: '{{[]}}', parseDateFormat: 'DD/MM/YYYY' }],
    ['boolean', { customRule: '{{true}}' }],
    ['image', { minLength: '1' }],
  ])('Table-ADDROWFORM-026 %s column with %j has no validation', (columnType, rules) => {
    // Break this catches: empty settings, rules left over from another column type, or settings the table
    // never enforces (number regex, date format) putting a misleading * on a field.
    expect(hasColumnValidation({ name: 'X', columnType, ...rules })).toBe(false);
  });

  test('Table-ADDROWFORM-026 a missing column has no validation', () => {
    // Break this catches: a crash on an empty column entry.
    expect(hasColumnValidation(undefined)).toBe(false);
  });
});

describe('Table-ADDROWFORM-035 nested columns whose parent column exists', () => {
  const nested = [
    { name: 'name', columnType: 'string' },
    { name: 'metadata', columnType: 'json' },
    { name: 'metadata.team', columnType: 'string', autogenerated: true },
    { name: 'metadata.level', columnType: 'number', autogenerated: true },
  ];

  test('Table-ADDROWFORM-035 are left out, so a JSON column is one field rather than one plus its keys', () => {
    // Break this catches: a JSON column also adding a field per key inside it.
    expect(keysOf(getAddNewRowColumns(nested, undefined))).toEqual(['name', 'metadata']);
  });

  test('Table-ADDROWFORM-035 are left out of a stored selection too', () => {
    // Break this catches: an old selection that ticked the nested columns bringing them back.
    expect(keysOf(getAddNewRowColumns(nested, ['metadata.team', 'metadata']))).toEqual(['metadata']);
  });

  test('Table-ADDROWFORM-035 stay when there is no parent column, so nested-only tables can still enter them', () => {
    // Break this catches: a table that shows only nested columns losing every field in the form.
    const nestedOnly = nested.filter((column) => column.name !== 'metadata');

    expect(keysOf(getAddNewRowColumns(nestedOnly, undefined))).toEqual(['name', 'metadata.team', 'metadata.level']);
  });

  test('Table-ADDROWFORM-035 only a real parent counts (a prefix match is not enough), at any depth', () => {
    // Break this catches: a prefix match hiding unrelated columns such as "metadata2.x" or "meta.data".
    const columns = [
      { name: 'metadata', columnType: 'json' },
      { name: 'metadata2.x', columnType: 'string' },
      { name: 'meta.data', columnType: 'string' },
      { name: 'metadata.a.b', columnType: 'string' },
    ];

    expect(keysOf(getAddNewRowColumns(columns, undefined))).toEqual(['metadata', 'metadata2.x', 'meta.data']);
  });

  test('Table-ADDROWFORM-035 a key that is its own column name with a dot (key differs from name) uses the key', () => {
    // Break this catches: the parent being looked up by display name instead of the data key.
    const columns = [
      { name: 'Details', key: 'details', columnType: 'json' },
      { name: 'Team', key: 'details.team', columnType: 'string' },
    ];

    expect(keysOf(getAddNewRowColumns(columns, undefined))).toEqual(['details']);
  });
});
