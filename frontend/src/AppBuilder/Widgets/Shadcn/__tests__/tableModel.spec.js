import {
  applyFilters,
  cellStyleFor,
  matchesCondition,
  compareCells,
  formatCell,
  matchesSearch,
  normalizeColumns,
  readCell,
  rowKey,
  sortRows,
  toCsv,
} from '../tableModel';

const rows = [
  { id: 1, name: 'Ada Lovelace', amount: 1200.5, status: 'Paid', joined: '2024-03-02', meta: { team: 'Core' } },
  { id: 2, name: 'Alan Turing', amount: -40, status: 'Overdue', joined: '2023-11-20', meta: { team: 'Research' } },
  { id: 3, name: 'Grace (Hopper)', amount: null, status: 'Draft', joined: null, meta: null },
];

describe('normalizeColumns', () => {
  it('reads native column objects', () => {
    const [col] = normalizeColumns([{ key: 'amount', name: 'Amount', columnType: 'currency', decimalPlaces: 0 }], rows);
    expect(col).toMatchObject({
      key: 'amount',
      name: 'Amount',
      type: 'currency',
      align: 'right',
      sortable: true,
      visible: true,
    });
    expect(col.format.decimalPlaces).toBe(0);
  });

  it('keeps the earlier dataIndex / title / kind keys working', () => {
    const [col] = normalizeColumns([{ dataIndex: 'status', title: 'Status', kind: 'badge' }], rows);
    expect(col).toMatchObject({ key: 'status', name: 'Status', type: 'badge' });
  });

  it('generates columns from the data when none are given, skipping nested objects', () => {
    const cols = normalizeColumns([], rows);
    expect(cols.map((c) => c.key)).toEqual(['id', 'name', 'amount', 'status', 'joined']);
    expect(cols.find((c) => c.key === 'amount').type).toBe('number');
  });

  it('drops junk entries and gives every column a unique id', () => {
    const cols = normalizeColumns([null, 'x', { key: 'name' }, { key: 'name' }], rows);
    expect(cols).toHaveLength(2);
    expect(new Set(cols.map((c) => c.id)).size).toBe(2);
  });

  it('hides a column whose visibility is false', () => {
    expect(normalizeColumns([{ key: 'name', columnVisibility: false }], rows)[0].visible).toBe(false);
  });
});

describe('readCell and formatCell', () => {
  it('reads dotted keys and tolerates null parents', () => {
    expect(readCell(rows[0], 'meta.team')).toBe('Core');
    expect(readCell(rows[2], 'meta.team')).toBeUndefined();
    expect(readCell(null, 'name')).toBeUndefined();
  });

  it('formats numbers, money and dates, and empty values as an empty string', () => {
    expect(formatCell(1200.5, { type: 'number', format: { decimalPlaces: 1 } })).toBe('1,200.5');
    expect(formatCell(1200.5, { type: 'currency', format: { currency: 'USD', decimalPlaces: 2 } })).toBe('$1,200.50');
    expect(formatCell('2024-03-02', { type: 'date', format: { dateFormat: 'DD MMM YYYY' } })).toBe('02 Mar 2024');
    expect(formatCell(null, { type: 'number', format: {} })).toBe('');
    expect(formatCell('not a date', { type: 'date', format: {} })).toBe('not a date');
    expect(formatCell({ a: 1 }, { type: 'string', format: {} })).toBe('{"a":1}');
    expect(formatCell(true, { type: 'boolean', format: {} })).toBe('Yes');
  });
});

describe('matchesSearch', () => {
  const cols = normalizeColumns([{ key: 'name' }, { key: 'status' }], rows);
  it('matches case-insensitively in any visible column', () => {
    expect(matchesSearch(rows[0], cols, 'ada')).toBe(true);
    expect(matchesSearch(rows[1], cols, 'OVERDUE')).toBe(true);
    expect(matchesSearch(rows[1], cols, 'ada')).toBe(false);
  });
  it('treats regex characters as plain text (the native table crashed on "(")', () => {
    expect(matchesSearch(rows[2], cols, '(hop')).toBe(true);
    expect(() => matchesSearch(rows[0], cols, '[(*')).not.toThrow();
  });
});

describe('applyFilters', () => {
  const cols = normalizeColumns([{ key: 'name' }, { key: 'amount', columnType: 'number' }, { key: 'status' }], rows);
  const ids = (filters) => applyFilters(rows, filters, cols).map((r) => r.id);
  it('applies every native condition, ANDed', () => {
    expect(ids([{ column: 'name', condition: 'contains', value: 'a' }])).toEqual([1, 2, 3]);
    expect(ids([{ column: 'name', condition: 'doesNotContains', value: 'turing' }])).toEqual([1, 3]);
    expect(ids([{ column: 'status', condition: 'equals', value: 'paid' }])).toEqual([1]);
    expect(ids([{ column: 'status', condition: 'ne', value: 'Paid' }])).toEqual([2, 3]);
    expect(ids([{ column: 'amount', condition: 'isEmpty' }])).toEqual([3]);
    expect(ids([{ column: 'amount', condition: 'isNotEmpty' }])).toEqual([1, 2]);
    expect(ids([{ column: 'amount', condition: 'gt', value: '0' }])).toEqual([1]);
    expect(ids([{ column: 'amount', condition: 'lte', value: '-40' }])).toEqual([2]);
    expect(ids([{ column: 'name', condition: 'matches', value: '^A' }])).toEqual([1, 2]);
    expect(ids([{ column: 'name', condition: 'nl', value: '^A' }])).toEqual([3]);
    expect(
      ids([
        { column: 'name', condition: 'contains', value: 'a' },
        { column: 'status', condition: 'equals', value: 'Paid' },
      ])
    ).toEqual([1]);
  });
  it('compares numbers as numbers, not text', () => {
    expect(ids([{ column: 'amount', condition: 'gt', value: '200' }])).toEqual([1]);
  });
  it('ignores incomplete filters and invalid regexes instead of throwing', () => {
    expect(ids([{ column: 'name', condition: 'contains', value: '' }])).toEqual([1, 2, 3]);
    expect(ids([{ column: 'nope', condition: 'equals', value: 'x' }])).toEqual([1, 2, 3]);
    expect(ids([{ column: 'name', condition: 'matches', value: '(' }])).toEqual([]);
  });
  it('finds a column by its header name too', () => {
    const named = normalizeColumns([{ key: 'status', name: 'State' }], rows);
    expect(
      applyFilters(rows, [{ column: 'State', condition: 'equals', value: 'Draft' }], named).map((r) => r.id)
    ).toEqual([3]);
  });
});

describe('sorting', () => {
  it('sorts numbers and dates by value, empty values last in both directions', () => {
    const amount = normalizeColumns([{ key: 'amount', columnType: 'number' }], rows)[0];
    expect(sortRows(rows, amount, 'asc').map((r) => r.id)).toEqual([2, 1, 3]);
    expect(sortRows(rows, amount, 'desc').map((r) => r.id)).toEqual([1, 2, 3]);
    const joined = normalizeColumns([{ key: 'joined', columnType: 'date' }], rows)[0];
    expect(sortRows(rows, joined, 'asc').map((r) => r.id)).toEqual([2, 1, 3]);
  });
  it('compares text naturally', () => {
    expect(compareCells('item 2', 'item 10', 'string')).toBeLessThan(0);
  });
  it('does not mutate the input', () => {
    const copy = [...rows];
    sortRows(rows, normalizeColumns([{ key: 'name' }], rows)[0], 'desc');
    expect(rows).toEqual(copy);
  });
});

describe('rowKey', () => {
  it('uses the id field, else the position', () => {
    expect(rowKey({ id: 9 }, 'id', 0)).toBe('9');
    expect(rowKey({}, 'id', 4)).toBe('#4');
  });
});

describe('toCsv', () => {
  it('writes visible data columns with headers, quotes and escapes', () => {
    const cols = normalizeColumns(
      [
        { key: 'name', name: 'Name' },
        { key: 'amount', name: 'Amount', columnType: 'number' },
        { key: 'x', columnType: 'button' },
      ],
      rows
    );
    const csv = toCsv([{ name: 'A "quote", here', amount: 3 }], cols);
    expect(csv).toBe('Name,Amount\n"A ""quote"", here",3');
  });
  it('neutralises spreadsheet formulas', () => {
    const cols = normalizeColumns([{ key: 'name', name: 'Name' }], rows);
    expect(toCsv([{ name: '=HYPERLINK("x")' }], cols)).toBe('Name\n"\'=HYPERLINK(""x"")"');
  });
});

describe('conditional styles', () => {
  const [amount] = normalizeColumns(
    [
      {
        key: 'amount',
        columnType: 'number',
        conditionalStyles: [
          { condition: 'lt', value: 0, textColor: '#dc2626', fontWeight: 600 },
          { condition: 'gte', value: 1000, backgroundColor: '#dcfce7' },
          { key: 'status', condition: 'equals', value: 'Draft', textColor: '#64748b' },
        ],
      },
    ],
    rows
  );
  it('applies the first matching rule, testing the cell or another field of the row', () => {
    expect(cellStyleFor(amount, rows[1])).toEqual({ color: '#dc2626', fontWeight: 600 });
    expect(cellStyleFor(amount, rows[0])).toEqual({ background: '#dcfce7' });
    expect(cellStyleFor(amount, { amount: 5, status: 'Draft' })).toEqual({ color: '#64748b' });
    expect(cellStyleFor(amount, { amount: 5, status: 'Paid' })).toEqual({});
  });
  it('ignores malformed rules', () => {
    const [col] = normalizeColumns(
      [{ key: 'a', conditionalStyles: [null, 'x', { condition: 'nope', textColor: 'red' }] }],
      rows
    );
    expect(cellStyleFor(col, { a: 1 })).toEqual({});
  });
  it('exposes the filter conditions for buttons and rules', () => {
    expect(matchesCondition('Overdue', 'equals', 'overdue')).toBe(true);
    expect(matchesCondition(5, 'gt', '10', { type: 'number' })).toBe(false);
    expect(matchesCondition(undefined, 'isEmpty')).toBe(true);
  });
});
