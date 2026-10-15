import {
  createTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/table-core';
import {
  filterRowIndexes,
  sortRowIndexes,
  pageRowIndexes,
  autoSortingFn,
  autoSortDir,
  createRowCache,
  selectionHelpers,
  searchCandidates,
  filterRowIndexesInSlices,
  hasRowFilter,
  sortRowIndexesInSlices,
  hasRowSorter,
} from '../tableView';

// The view must give exactly what TanStack's own row models give, on the same table state.
const data = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  name: ['delta', 'alpha', 'charlie', 'bravo'][i % 4] + (i % 7),
  plain: ['pear', 'apple', 'fig'][i % 3],
  score: (i * 37) % 11,
  maybe: i % 5 === 0 ? undefined : i % 3,
  when: new Date(2026, 0, (i * 13) % 28),
  nested: { city: ['Kathmandu', 'Pokhara'][i % 2] },
}));
const columns = [
  { accessorKey: 'id', id: 'id' },
  { accessorKey: 'name', id: 'name' },
  { accessorKey: 'plain', id: 'plain' },
  { accessorKey: 'score', id: 'score' },
  { accessorKey: 'maybe', id: 'maybe', sortUndefined: 'last' },
  { accessorKey: 'when', id: 'when' },
  { accessorKey: 'nested.city', id: 'nested.city' },
];

function tanstackTable(state) {
  // The defaults useReactTable merges in from the table's initial state.
  const full = {
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
    columnFilters: [],
    globalFilter: '',
    columnPinning: { left: [], right: [] },
    columnVisibility: {},
    columnOrder: [],
    rowSelection: {},
    ...state,
  };
  return createTable({
    data,
    columns,
    state: full,
    onStateChange: () => {},
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => String(row.getValue(columnId) ?? '').includes(value),
  });
}
const indexes = (rows) => rows.map((row) => row.index);
// Positions come as Int32Arrays.
const list = (positions) => Array.from(positions);

describe.each([
  ['no state', {}],
  ['global search', { globalFilter: 'a' }],
  ['column filter', { columnFilters: [{ id: 'plain', value: 'pp' }] }],
  ['sort text', { sorting: [{ id: 'plain', desc: false }] }],
  ['sort alphanumeric desc', { sorting: [{ id: 'name', desc: true }] }],
  [
    'sort numbers then text',
    {
      sorting: [
        { id: 'score', desc: false },
        { id: 'plain', desc: true },
      ],
    },
  ],
  ['sort dates', { sorting: [{ id: 'when', desc: false }] }],
  ['undefined last', { sorting: [{ id: 'maybe', desc: true }] }],
  ['nested accessor', { sorting: [{ id: 'nested.city', desc: false }], globalFilter: 'Pok' }],
  ['page size 0', { pagination: { pageIndex: 0, pageSize: 0 } }],
  ['last page, partly full', { pagination: { pageIndex: 8, pageSize: 7 } }],
  ['past the last page', { pagination: { pageIndex: 20, pageSize: 7 } }],
  [
    'filter + sort + page 2',
    { globalFilter: 'a', sorting: [{ id: 'score', desc: true }], pagination: { pageIndex: 1, pageSize: 7 } },
  ],
])('table view matches TanStack — %s', (_, state) => {
  const table = tanstackTable(state);
  const filtered = filterRowIndexes(table, data);
  const sorted = sortRowIndexes(table, data, filtered);

  test('filtered rows, in data order', () => {
    expect(list(filtered)).toEqual(indexes(table.getFilteredRowModel().rows));
  });
  test('sorted rows', () => {
    expect(list(sorted)).toEqual(indexes(table.getSortedRowModel().rows));
  });
  test('page rows', () => {
    expect(list(pageRowIndexes(table, sorted))).toEqual(indexes(table.getPaginationRowModel().rows));
  });
  test('automatic sorting function and direction per column', () => {
    for (const column of table.getAllLeafColumns()) {
      expect(autoSortingFn(table, data, column.id, filtered)).toBe(column.getAutoSortingFn());
      expect(autoSortDir(table, data, column.id, filtered)).toBe(column.getAutoSortDir());
    }
  });
});

describe('filtering cost', () => {
  test('looks each column up once per run, not once per cell', () => {
    const table = tanstackTable({ globalFilter: 'a', columnFilters: [{ id: 'plain', value: 'pp' }] });
    const getColumn = jest.spyOn(table, 'getColumn');
    filterRowIndexes(table, data);
    expect(getColumn.mock.calls.length).toBeLessThanOrEqual(columns.length * 2);
  });

  test('checks only the candidate rows it is given', () => {
    const table = tanstackTable({ globalFilter: 'a' });
    const all = filterRowIndexes(table, data);
    expect(filterRowIndexes(table, data, all.slice(0, 5))).toEqual(all.slice(0, 5));
  });
});

describe('sorting in slices', () => {
  // More rows than two sorted runs, so runs are merged over several passes.
  const many = Array.from({ length: 20000 }, (_, i) => data[i % data.length]);
  const sortInSlices = (state) => {
    const table = tanstackTable(state);
    const indexes = filterRowIndexes(table, many);
    const steps = [];
    let result = null;
    let clock = 0;
    sortRowIndexesInSlices(table, many, indexes, (sorted) => (result = sorted), {
      schedule: (step) => steps.push(step),
      now: () => (clock += 1),
      sliceMs: 0,
    });
    while (steps.length) steps.shift()();
    return { result, expected: sortRowIndexes(table, many, indexes) };
  };

  test.each([
    ['text', [{ id: 'plain', desc: false }]],
    ['alphanumeric desc', [{ id: 'name', desc: true }]],
    [
      'numbers then text',
      [
        { id: 'score', desc: false },
        { id: 'plain', desc: true },
      ],
    ],
    ['dates', [{ id: 'when', desc: false }]],
  ])('gives what sortRowIndexes gives — %s', (_, sorting) => {
    const { result, expected } = sortInSlices({ sorting, globalFilter: 'a' });
    expect(result).toEqual(expected);
  });

  test('values the sorting function finds equal ("Apple", "apple") keep their order, as unranked', () => {
    const cased = Array.from({ length: 12000 }, (_, i) => {
      const row = data[i % data.length];
      return { ...row, plain: i % 2 ? row.plain.toUpperCase() : row.plain };
    });
    const table = tanstackTable({ sorting: [{ id: 'plain', desc: false }] });
    const indexes = filterRowIndexes(table, cased);
    const steps = [];
    let result = null;
    let clock = 0;
    sortRowIndexesInSlices(table, cased, indexes, (sorted) => (result = sorted), {
      schedule: (step) => steps.push(step),
      now: () => (clock += 1),
      sliceMs: 0,
    });
    while (steps.length) steps.shift()();
    expect(result).toEqual(sortRowIndexes(table, cased, indexes));
  });

  test('mostly distinct values (not ranked) sort the same', () => {
    const unique = Array.from({ length: 12000 }, (_, i) => ({
      ...data[i % data.length],
      name: `item ${(i * 7919) % 12000}`,
    }));
    const table = tanstackTable({ sorting: [{ id: 'name', desc: true }] });
    const indexes = filterRowIndexes(table, unique);
    const steps = [];
    let result = null;
    let clock = 0;
    sortRowIndexesInSlices(table, unique, indexes, (sorted) => (result = sorted), {
      schedule: (step) => steps.push(step),
      now: () => (clock += 1),
      sliceMs: 0,
    });
    while (steps.length) steps.shift()();
    expect(result).toEqual(sortRowIndexes(table, unique, indexes));
  });

  test('hasRowSorter: only when sorting', () => {
    expect(hasRowSorter(tanstackTable({}))).toBe(false);
    expect(hasRowSorter(tanstackTable({ sorting: [{ id: 'plain', desc: false }] }))).toBe(true);
  });
});

describe('filtering in slices', () => {
  const many = Array.from({ length: 5000 }, (_, i) => data[i % data.length]);
  const run = (state, candidates = null) => {
    const table = tanstackTable(state);
    const steps = [];
    let result = null;
    let clock = 0;
    const cancel = filterRowIndexesInSlices(table, many, candidates, (kept) => (result = kept), {
      schedule: (step) => steps.push(step),
      now: () => (clock += 1),
      sliceMs: 0,
    });
    return { table, steps, result: () => result, cancel };
  };

  test('gives what filterRowIndexes gives, a slice per task', () => {
    const { table, steps, result } = run({ globalFilter: 'a', columnFilters: [{ id: 'plain', value: 'pp' }] });
    let slices = 0;
    while (steps.length) {
      steps.shift()();
      slices += 1;
    }
    expect(slices).toBeGreaterThan(1);
    expect(result()).toEqual(filterRowIndexes(table, many));
  });

  test('stops when cancelled', () => {
    const { steps, result, cancel } = run({ globalFilter: 'a' });
    steps.shift()();
    cancel();
    while (steps.length) steps.shift()();
    expect(result()).toBeNull();
  });

  test('hasRowFilter: only when something filters', () => {
    expect(hasRowFilter(tanstackTable({}))).toBe(false);
    expect(hasRowFilter(tanstackTable({ globalFilter: 'a' }))).toBe(true);
    expect(hasRowFilter(tanstackTable({ columnFilters: [{ id: 'plain', value: 'pp' }] }))).toBe(true);
  });
});

describe('searchCandidates', () => {
  const base = { data, columns: [], columnFilters: [], columnVisibility: {}, manualFiltering: false };
  const previous = { ...base, globalFilter: 'Al', filtered: [1, 5, 9] };

  test('a term that grew re-checks only the rows the previous term kept', () => {
    expect(searchCandidates(previous, { ...base, globalFilter: 'alp' })).toBe(previous.filtered);
    expect(searchCandidates(previous, { ...base, globalFilter: 'xALy' })).toBe(previous.filtered);
  });

  test('anything else checks every row', () => {
    expect(searchCandidates(previous, { ...base, globalFilter: 'a' })).toBeNull();
    expect(searchCandidates(previous, { ...base, globalFilter: '' })).toBeNull();
    expect(searchCandidates({ ...previous, globalFilter: '' }, { ...base, globalFilter: 'al' })).toBeNull();
    expect(searchCandidates(previous, { ...base, globalFilter: 'alp', data: [...data] })).toBeNull();
    expect(searchCandidates(previous, { ...base, globalFilter: 'alp', columnFilters: [{ id: 'x' }] })).toBeNull();
    expect(searchCandidates(previous, { ...base, globalFilter: 'alp', columns: [{}] })).toBeNull();
    expect(searchCandidates(previous, { ...base, globalFilter: 'alp', manualFiltering: true })).toBeNull();
    expect(searchCandidates(null, { ...base, globalFilter: 'alp' })).toBeNull();
  });
});

describe('rows on screen', () => {
  test('are real TanStack rows at their data position, made once', () => {
    const table = tanstackTable({});
    const getRow = createRowCache(table, data, 3);
    const row = getRow(42);
    expect(row.index).toBe(42);
    expect(row.id).toBe('42');
    expect(row.original).toBe(data[42]);
    expect(row.getValue('nested.city')).toBe(data[42].nested.city);
    expect(row.getVisibleCells().map((cell) => cell.column.id)).toEqual(columns.map((c) => c.id));
    expect(getRow(42)).toBe(row);
  });

  test('keep only the most recently used ones', () => {
    const table = tanstackTable({});
    const getRow = createRowCache(table, data, 2);
    const first = getRow(1);
    getRow(2);
    getRow(3);
    expect(getRow(1)).not.toBe(first);
  });
});

describe('selection on positions', () => {
  const selectable = (initial = {}) => {
    let rowSelection = initial;
    const table = createTable({
      data,
      columns,
      state: { rowSelection },
      onStateChange: () => {},
      renderFallbackValue: null,
      getCoreRowModel: getCoreRowModel(),
      enableRowSelection: true,
      enableMultiRowSelection: true,
      onRowSelectionChange: (updater) => {
        rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
        table.setOptions((old) => ({ ...old, state: { ...old.state, rowSelection } }));
      },
    });
    return { table, selection: () => rowSelection };
  };

  test('a row toggles itself without the row model', () => {
    const { table, selection } = selectable();
    const getRow = createRowCache(table, data);
    getRow(5).toggleSelected();
    expect(selection()).toEqual({ 5: true });
    getRow(5).getToggleSelectedHandler()({ target: { checked: false } });
    expect(selection()).toEqual({});
  });

  test('page and all-rows helpers', () => {
    const { table, selection } = selectable();
    const helpers = () => selectionHelpers(table, [1, 2, 3, 4], [2, 3]);
    expect(helpers().getIsAllPageRowsSelected()).toBe(false);
    helpers().toggleAllPageRowsSelected(true);
    expect(selection()).toEqual({ 2: true, 3: true });
    expect(helpers().getIsAllPageRowsSelected()).toBe(true);
    expect(list(helpers().selectedIndexes())).toEqual([2, 3]);
    helpers().toggleAllRowsSelected(true);
    expect(selection()).toEqual({ 1: true, 2: true, 3: true, 4: true });
    helpers().toggleAllRowsSelected(false);
    expect(selection()).toEqual({});
  });
});

describe('selection helpers match TanStack', () => {
  // A TanStack table with its own row models, and our helpers over the same rows, on the same selection state.
  const both = (state, options = {}) => {
    let rowSelection = state.rowSelection ?? {};
    const make = (models) => {
      const table = createTable({
        data,
        columns,
        state: { ...state, rowSelection, columnPinning: { left: [], right: [] } },
        onStateChange: () => {},
        renderFallbackValue: null,
        enableRowSelection: true,
        enableMultiRowSelection: true,
        ...options,
        ...models,
        onRowSelectionChange: (updater) => {
          rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
          table.setOptions((old) => ({ ...old, state: { ...old.state, rowSelection } }));
        },
      });
      return table;
    };
    const reference = make({
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      globalFilterFn: (row, columnId, value) => String(row.getValue(columnId) ?? '').includes(value),
    });
    const filtered = filterRowIndexes(reference, data);
    const page = pageRowIndexes(reference, sortRowIndexes(reference, data, filtered));
    const reset = (selection) => {
      rowSelection = selection;
      reference.setOptions((old) => ({ ...old, state: { ...old.state, rowSelection } }));
    };
    return {
      reference,
      helpers: () => selectionHelpers(reference, filtered, page),
      selection: () => rowSelection,
      reset,
    };
  };

  const states = [
    { pagination: { pageIndex: 1, pageSize: 7 }, globalFilter: 'a' },
    { pagination: { pageIndex: 0, pageSize: 60 } },
  ];
  const selections = [{}, { 1: true }, { 3: true, 4: false }, Object.fromEntries(data.map((_, i) => [i, true]))];

  test.each(states)('reading the selection (%#)', (state) => {
    const { reference, helpers, reset } = both(state);
    for (const selection of selections) {
      reset(selection);
      expect(helpers().getIsAllPageRowsSelected()).toBe(reference.getIsAllPageRowsSelected());
      expect(helpers().getIsSomePageRowsSelected()).toBe(reference.getIsSomePageRowsSelected());
      expect(list(helpers().selectedIndexes())).toEqual(indexes(reference.getFilteredSelectedRowModel().rows));
    }
  });

  test.each([
    ['all rows', (t) => t.toggleAllRowsSelected(), {}],
    ['all rows on', (t) => t.toggleAllRowsSelected(true), {}],
    ['all rows off', (t) => t.toggleAllRowsSelected(false), {}],
    ['page rows', (t) => t.toggleAllPageRowsSelected(), {}],
    ['page rows on', (t) => t.toggleAllPageRowsSelected(true), {}],
    ['page rows off', (t) => t.toggleAllPageRowsSelected(false), {}],
    ['page rows on, single selection', (t) => t.toggleAllPageRowsSelected(true), { enableMultiRowSelection: false }],
  ])('changing the selection: %s', (_, act, options) => {
    for (const state of states) {
      for (const selection of selections) {
        const ours = both(state, options);
        ours.reset(selection);
        act(ours.helpers());
        const theirs = both(state, options);
        theirs.reset(selection);
        act(theirs.reference);
        expect(ours.selection()).toEqual(theirs.selection());
      }
    }
  });
});
