import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { DataTable } from '../../../../../../packs/shadcn/src/components/DataTable';
import { normalizeColumns, rowKeys } from '../../../../../../packs/shadcn/src/lib/ui2/table/model';

installBrowserStubs();

// The team's DataTable report (2026-10-27): columns from the data, id fields, late fields, repeated row ids, a lone
// column's alignment, filteredData after a script's actions in a row, the Default formats section and transformations.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => cleanup());

let serial = 0;
const mount = async (props, hostOverrides = {}) => {
  loadLibraryModule.mockResolvedValue({ DataTable });
  const actions = new Map();
  const exposed = {};
  const events = [];
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`dt-team-${++serial}`}
      componentName="DataTable"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      fireEvent={(e) => events.push(e)}
      actions={actions}
      host={{ ...makeHost('DataTable', {}), ...hostOverrides }}
      dataCy="dt-team"
    />
  );
  const root = () => view.container.querySelector('[data-cy="dt-team"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('tbody')).not.toBeNull());
  const headers = () => [...root().querySelectorAll('thead th')].map((th) => th.textContent.trim());
  const bodyRows = () => [...root().querySelectorAll('tbody tr:not(.t2-page-filler)')];
  const rerender = (next) =>
    view.rerender(
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey={`dt-team-${serial}`}
        componentName="DataTable"
        componentProps={next}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(k, v) => {
          exposed[k] = v;
        }}
        fireEvent={(e) => events.push(e)}
        actions={actions}
        host={{ ...makeHost('DataTable', {}), ...hostOverrides }}
        dataCy="dt-team"
      />
    );
  return { root, headers, bodyRows, actions, exposed, events, rerender };
};

const orders = [
  { order_id: 1042, customerId: 'C-77', name: 'Ada', amount: 120 },
  { order_id: 1043, customerId: 'C-78', name: 'Alan', amount: 80 },
];

describe('1-2: columns come from the bound data', () => {
  test('a table with no columns set shows the fields of the data it is bound to', async () => {
    const t = await mount({ data: orders });
    expect(t.headers()).toEqual(['Order ID', 'Customer ID', 'Name', 'Amount']);
    // An id is a label: its digits are not grouped ("1,042").
    expect(t.bodyRows()[0].querySelector('td').textContent).toBe('1042');
  });

  test('the manifest default is no columns, so binding data never leaves sample columns behind', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/shadcn/dist/manifest.json'), 'utf8')
    );
    const columns = manifest.components.DataTable.props.find((p) => p.name === 'columns');
    expect(columns.default).toEqual([]);
  });
});

describe('datetime columns keep their time', () => {
  test("the table's default date format applies to date columns, not datetime ones", async () => {
    const t = await mount({
      data: [{ due: '2026-10-27', at: '2026-10-27T14:05:00' }],
      columns: [
        { key: 'due', name: 'Due', columnType: 'date' },
        { key: 'at', name: 'At', columnType: 'datetime' },
      ],
    });
    const cells = [...t.bodyRows()[0].querySelectorAll('td')].map((td) => td.textContent.trim());
    expect(cells[0]).toBe('27 Oct 2026');
    expect(cells[1]).toMatch(/27 Oct 2026, 14:05/);
  });
});

describe('3-4: id fields show like any other field', () => {
  test('an id column set by the author is drawn', async () => {
    const t = await mount({
      data: [{ id: 7, name: 'Ada' }],
      columns: [
        { key: 'id', name: 'id' },
        { key: 'name', name: 'Name' },
      ],
    });
    expect(t.headers()).toEqual(['ID', 'Name']);
    expect(t.bodyRows()[0].textContent).toContain('7');
  });

  test('derived id-like fields are visible, and search finds an order number and a customer id', async () => {
    jest.useFakeTimers();
    try {
      const t = await mount({ data: orders });
      expect(t.headers()).toEqual(expect.arrayContaining(['Order ID', 'Customer ID']));
      await act(async () => t.actions.get('setSearchText')('1043'));
      expect(t.exposed.filteredData).toEqual([orders[1]]);
      await act(async () => t.actions.get('setSearchText')('C-77'));
      expect(t.exposed.filteredData).toEqual([orders[0]]);
      expect(t.bodyRows()).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('5: every row is read for its fields', () => {
  test('a field first set in row 80 gets a column, typed from its values', () => {
    const data = Array.from({ length: 120 }, (_, i) => ({ id: i + 1, ...(i >= 79 ? { refund_amount: 10 + i } : {}) }));
    const columns = normalizeColumns([], data);
    const refund = columns.find((c) => c.key === 'refund_amount');
    expect(refund).toBeDefined();
    expect(refund.type).toBe('currency');
  });

  test('a set column without a type is typed from values past the first 50 rows', () => {
    const data = Array.from({ length: 80 }, (_, i) => ({ id: i + 1, due_date: i >= 60 ? '2026-10-27' : null }));
    expect(normalizeColumns([{ key: 'due_date', name: 'Due' }], data)[0].type).toBe('date');
  });

  test('stays quick on 100,000 rows', () => {
    const data = Array.from({ length: 100000 }, (_, i) => ({ id: i, name: `Row ${i}`, amount: i, status: 'Open' }));
    const start = Date.now();
    normalizeColumns([], data);
    expect(Date.now() - start).toBeLessThan(1500);
  });
});

describe('6: rows that repeat the id field keep keys of their own', () => {
  test('rowKeys suffixes a repeated id by its occurrence', () => {
    expect(rowKeys([{ id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }, {}], 'id')).toEqual([
      'id:1',
      'id:1~1',
      'id:2',
      'id:1~2',
      '#4',
    ]);
  });

  test('selecting one of two rows with the same id marks that row only', async () => {
    const data = [
      { id: 1, name: 'Ada' },
      { id: 1, name: 'Alan' },
      { id: 2, name: 'Grace' },
    ];
    const t = await mount({ data, columns: [{ key: 'name', name: 'Name' }] });
    fireEvent.click(t.bodyRows()[1]);
    await waitFor(() => expect(t.root().querySelectorAll('tbody tr[data-state="selected"]')).toHaveLength(1));
    expect(t.root().querySelector('tbody tr[data-state="selected"]').textContent).toContain('Alan');
    expect(t.exposed.selectedRow).toEqual(data[1]);
  });

  test('reordered data keeps a shared-id selection on the same record, never on its namesake', async () => {
    const data = [
      { id: 1, name: 'Ada' },
      { id: 1, name: 'Alan' },
      { id: 2, name: 'Grace' },
    ];
    const props = { columns: [{ key: 'name', name: 'Name' }] };
    const t = await mount({ ...props, data });
    fireEvent.click(t.bodyRows()[1]);
    await waitFor(() => expect(t.exposed.selectedRow).toEqual(data[1]));
    // Reversed: occurrence id:1~1 is now Ada; the selection follows Alan by content.
    t.rerender({ ...props, data: [...data].reverse() });
    await waitFor(() => expect(t.root().querySelector('tbody tr[data-state="selected"]')?.textContent).toBe('Alan'));
    expect(t.exposed.selectedRow).toEqual(data[1]);
    expect(t.root().querySelectorAll('tbody tr[data-state="selected"]')).toHaveLength(1);
    // Alan changed and reordered again: no record matches by content, so the selection clears rather than retarget.
    t.rerender({ ...props, data: [data[0], { id: 1, name: 'Alan T.' }, data[2]].reverse() });
    await waitFor(() => expect(t.exposed.selectedRow).toEqual({}));
    expect(t.root().querySelector('tbody tr[data-state="selected"]')).toBeNull();
  });

  test('a unique id keeps its selection across a refresh that changes the row', async () => {
    const props = { columns: [{ key: 'name', name: 'Name' }] };
    const t = await mount({
      ...props,
      data: [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Alan' },
      ],
    });
    fireEvent.click(t.bodyRows()[1]);
    await waitFor(() => expect(t.exposed.selectedRow).toEqual({ id: 2, name: 'Alan' }));
    t.rerender({
      ...props,
      data: [
        { id: 2, name: 'Alan T.' },
        { id: 1, name: 'Ada' },
      ],
    });
    await waitFor(() => expect(t.exposed.selectedRow).toEqual({ id: 2, name: 'Alan T.' }));
  });

  test('paging and a refresh leave no old rows on screen', async () => {
    const page = (start) => Array.from({ length: 4 }, (_, i) => ({ id: 1, name: `Client ${start + i}` }));
    const props = { columns: [{ key: 'name', name: 'Name' }], enablePagination: true, rowsPerPage: 4 };
    const t = await mount({ ...props, data: [...page(1), ...page(5)] });
    expect(t.bodyRows().map((r) => r.textContent)).toEqual(['Client 1', 'Client 2', 'Client 3', 'Client 4']);
    fireEvent.click([...t.root().querySelectorAll('button')].find((b) => b.textContent.trim() === '2'));
    await waitFor(() =>
      expect(t.bodyRows().map((r) => r.textContent)).toEqual(['Client 5', 'Client 6', 'Client 7', 'Client 8'])
    );
    t.rerender({ ...props, data: page(20) });
    await waitFor(() =>
      expect(t.bodyRows().map((r) => r.textContent)).toEqual(['Client 20', 'Client 21', 'Client 22', 'Client 23'])
    );
  });
});

describe('7: a lone column lines up with its header', () => {
  test('the capped cell box sits on the cell side for right and center alignment', () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../packs/shadcn/src/styles/ui2-table.css'),
      'utf8'
    );
    expect(css).toMatch(/td\.is-right > \.t2-clip \{\s*margin-left: auto;/);
    expect(css).toMatch(/td\.is-center > \.t2-clip \{\s*margin-inline: auto;/);
  });
});

describe('8: derived values follow each action at once', () => {
  const people = [
    { id: 1, name: 'Ada', status: 'Paid', amount: 30 },
    { id: 2, name: 'Alan', status: 'Pending', amount: 10 },
    { id: 3, name: 'Grace', status: 'Paid', amount: 20 },
    { id: 4, name: 'Linus', status: 'Overdue', amount: 40 },
  ];

  test('clearFilters, setSort and setFilters in one script: filteredData is the table result after each', async () => {
    const t = await mount({ data: people });
    await waitFor(() => expect(t.actions.has('setFilters')).toBe(true));
    const seen = [];
    await act(async () => {
      t.actions.get('clearFilters')();
      t.actions.get('setSort')('amount', 'asc');
      seen.push(t.exposed.filteredData.map((r) => r.id));
      t.actions.get('setFilters')([{ column: 'status', condition: 'equals', value: 'Paid' }]);
      seen.push(t.exposed.filteredData.map((r) => r.id));
      seen.push(t.exposed.currentPageData.map((r) => r.id));
    });
    expect(seen).toEqual([
      [2, 3, 1, 4],
      [3, 1],
      [3, 1],
    ]);
    // And the table draws the same rows.
    expect(t.bodyRows().map((r) => r.textContent)).toEqual([
      expect.stringContaining('Grace'),
      expect.stringContaining('Ada'),
    ]);
  });

  test('setSearchText after setFilters searches within the filtered rows, sorted', async () => {
    jest.useFakeTimers();
    try {
      const t = await mount({ data: people });
      await act(async () => {
        t.actions.get('setSort')('amount', 'asc');
        t.actions.get('setFilters')([{ column: 'status', condition: 'equals', value: 'Paid' }]);
        t.actions.get('setSearchText')('a');
      });
      expect(t.exposed.filteredData.map((r) => r.id)).toEqual([3, 1]);
    } finally {
      jest.useRealTimers();
    }
  });

  test('setPage right after setFilters pages the filtered rows', async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `N${i + 1}`,
      status: i % 3 ? 'Open' : 'Paid',
    }));
    const t = await mount({ data: many, rowsPerPage: 5 });
    await act(async () => {
      t.actions.get('setFilters')([{ column: 'status', condition: 'equals', value: 'Paid' }]);
      t.actions.get('setPage')(2);
    });
    expect(t.exposed.pageIndex).toBe(2);
    expect(t.exposed.currentPageData.map((r) => r.id)).toEqual([16, 19, 22, 25, 28]);
  });
});

describe('9: the table-wide formats read as defaults', () => {
  test('the section is Default formats and each field says a column overrides it', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/shadcn/dist/manifest.json'), 'utf8')
    );
    const props = manifest.components.DataTable.props.filter((p) =>
      ['currency', 'locale', 'dateFormat', 'badgeColors'].includes(p.name)
    );
    expect(props).toHaveLength(4);
    props.forEach((p) => {
      expect(p.section).toBe('Default formats');
      expect(p.description).toMatch(/column's own .* overrides? it/);
    });
    expect(manifest.components.DataTable.props.some((p) => p.section === 'Formats')).toBe(false);
  });
});

describe('10: a column transformation', () => {
  // The host resolves a row template with the row's variables (usePackHost's resolveRow); this stub reads two shapes.
  const resolveRow = (template, { rowData, cellValue } = {}) => {
    if (typeof template !== 'string') return template;
    if (template === '{{cellValue * 2}}') return cellValue * 2;
    if (template === "{{rowData.first + ' ' + rowData.last}}") return `${rowData.first} ${rowData.last}`;
    return template;
  };
  const data = [
    { id: 1, first: 'Ada', last: 'Lovelace', qty: 3 },
    { id: 2, first: 'Alan', last: 'Turing', qty: 1 },
  ];
  const columns = [
    { key: 'first', name: 'Name', transformation: "{{rowData.first + ' ' + rowData.last}}" },
    { key: 'qty', name: 'Qty', columnType: 'number', transformation: '{{cellValue * 2}}' },
  ];

  test('the cell shows the transformed value; sort and search keep the data value', async () => {
    jest.useFakeTimers();
    try {
      const t = await mount({ data, columns }, { resolveRow });
      expect(t.bodyRows().map((r) => [...r.querySelectorAll('td')].map((td) => td.textContent))).toEqual([
        ['Ada Lovelace', '6'],
        ['Alan Turing', '2'],
      ]);
      await act(async () => t.actions.get('setSort')('qty', 'asc'));
      expect(t.exposed.filteredData.map((r) => r.id)).toEqual([2, 1]);
      expect(t.exposed.filteredData[0].qty).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
