import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { act, cleanup, render, screen, userEvent, waitFor, within } from '@/test/test-utils';
import { useTjdbStore } from '../../../_stores/tjdbStore';
import { TooljetDatabaseContext } from '../../../context';
import { getEditBlockedReason } from '../editRow';
import { TableGrid, type TableGridProps } from '../TableGrid';
import type { GridColumn } from '../useTableGrid';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const column = (accessor: string, dataType: string, isPrimaryKey = false): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  column_default: null,
  constraints_type: { is_primary_key: isPrimaryKey, is_not_null: isPrimaryKey },
});

const COLUMNS = [column('id', 'serial', true), column('title', 'character varying')];
const ROWS = [
  { id: 1, title: 'one' },
  { id: 2, title: 'two' },
  { id: 0, title: 'zero' },
];

describe('getEditBlockedReason', () => {
  it('allows a row of a table with a safe primary key', () => {
    expect(getEditBlockedReason(['id'], COLUMNS, ROWS[0])).toBeUndefined();
  });

  it('refuses a table without a primary key', () => {
    expect(getEditBlockedReason([], [column('title', 'text')], { title: 'x' })).toMatch(/primary key/);
  });

  it.each(['bigint', 'jsonb'])('refuses a %s primary key, which has no exact filter', (dataType) => {
    expect(getEditBlockedReason(['id'], [column('id', dataType, true)], { id: 1 })).toContain(dataType);
  });

  it('refuses a row whose integer key is past 2^53', () => {
    expect(getEditBlockedReason(['id'], COLUMNS, { id: 2 ** 53 + 2, title: 'x' })).toMatch(/too large/);
  });

  it('only looks at the key columns for the unsafe types', () => {
    expect(getEditBlockedReason(['id'], [...COLUMNS, column('big', 'bigint')], ROWS[0])).toBeUndefined();
  });
});

// jsdom has no layout, so the virtualizer sees a 0px viewport and mounts no rows.
beforeAll(() => {
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 600,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
  jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
});

afterAll(() => jest.restoreAllMocks());

// The shared setup resets every zustand store in its own afterEach, which would update the grid while it is still
// mounted. Hooks of a describe run before the file's top-level ones, so unmounting here comes first.
describe('TableGrid | edit row drawer', () => {
  afterEach(cleanup);

  const patches: { url: URL; body: Record<string, unknown> }[] = [];
  const handleRefetchQuery = jest.fn();

  beforeEach(() => {
    patches.length = 0;
    handleRefetchQuery.mockClear();
    act(() => useTjdbStore.getState().actions.resetStore());
    act(() => useTjdbStore.setState({ selectedEnvironment: { id: 'env-1', priority: 1 } }));
    useTjdbStore.getState().actions.openTableView('table-1');
    server.use(
      http.patch('*/tooljet-db/proxy/:tableId', async ({ request }) => {
        patches.push({ url: new URL(request.url), body: (await request.json()) as Record<string, unknown> });
        return HttpResponse.json([]);
      })
    );
  });

  // `contextColumns` are the table's columns as the page holds them (server order); `columns` are the grid's.
  type SetupProps = Partial<TableGridProps> & {
    columns?: GridColumn[];
    contextColumns?: GridColumn[];
    rows?: Record<string, unknown>[];
  };
  const ui = (props: SetupProps = {}) => {
    const { columns = COLUMNS, contextColumns = columns, rows = ROWS, ...gridProps } = props;
    return (
      <TooljetDatabaseContext.Provider
        value={
          {
            organizationId: 'org-1',
            selectedTable: { id: 'table-1', table_name: 'orders' },
            columns: contextColumns,
            foreignKeys: [],
            tables: [],
            configurations: {},
            getConfigurationProperty: (_header: string, _property: string, fallback: unknown) => fallback,
            handleRefetchQuery,
          } as unknown as React.ContextType<typeof TooljetDatabaseContext>
        }
      >
        <TableGrid columns={columns} rows={rows} isLoading={false} canEditSchema canSelectRows {...gridProps} />
      </TooljetDatabaseContext.Provider>
    );
  };
  const setup = (props: SetupProps = {}) => render(ui(props));

  const selectRow = (rowId: string) =>
    userEvent.click(within(screen.getByTestId(`grid-row-${rowId}`)).getByRole('checkbox', { name: 'Select row' }));
  const editButton = () => screen.getByRole('button', { name: 'Edit' });
  const byDataCy = (dataCy: string) =>
    waitFor(() => {
      const element = document.querySelector(`[data-cy="${dataCy}"]`);
      expect(element).toBeTruthy();
      return element as HTMLElement;
    });

  it('is enabled for exactly one selected row', async () => {
    setup();

    await selectRow('1');
    expect(editButton()).toBeEnabled();

    await selectRow('2');
    expect(editButton()).toBeDisabled();
    expect(editButton().closest('span')).toHaveAttribute('title', 'Select one row to edit');
  });

  it.each([
    ['a table without a primary key', [column('title', 'text')], [{ title: 'x' }], /primary key/],
    ['a bigint primary key', [column('id', 'bigint', true)], [{ id: 1 }], /bigint/],
    ['a key past 2^53', COLUMNS, [{ id: 2 ** 53 + 2, title: 'x' }], /too large/],
  ] as const)('is off, with the reason, for %s', async (_name, columns, rows, reason) => {
    setup({ columns: columns as unknown as GridColumn[], rows: rows as unknown as Record<string, unknown>[] });

    // Without a key the rows are told apart by their position.
    await userEvent.click(screen.getAllByRole('checkbox', { name: 'Select row' })[0]);

    expect(editButton()).toBeDisabled();
    expect(editButton().closest('span')?.getAttribute('title')).toMatch(reason);
    await userEvent.click(editButton());
    expect(document.querySelector('[data-cy="edit-row-header"]')).toBeNull();
  });

  it('opens the row form with the selected row, saves it by its key and refetches', async () => {
    setup();
    await selectRow('1');

    await userEvent.click(editButton());
    const title = await byDataCy('title-input-field');
    expect(title).toHaveValue('one');
    await userEvent.clear(title);
    await userEvent.type(title, 'one edited');
    await userEvent.click(await byDataCy('save-changes-button'));

    await waitFor(() => expect(patches).toHaveLength(1));
    expect(patches[0].url.searchParams.get('id')).toBe('eq.1');
    expect(patches[0].body).toEqual({ title: 'one edited' });
    await waitFor(() => expect(handleRefetchQuery).toHaveBeenCalledTimes(1));
  });

  it('keeps what was typed when the rows refetch behind the open drawer', async () => {
    const { rerender } = setup();
    await selectRow('1');
    await userEvent.click(editButton());
    const title = await byDataCy('title-input-field');
    await userEvent.type(title, '!');

    rerender(ui({ rows: ROWS.map((row) => ({ ...row })) }));

    expect(await byDataCy('title-input-field')).toHaveValue('one!');
  });

  it('filters by a key value of 0, never without a filter', async () => {
    setup();
    await selectRow('0');

    await userEvent.click(editButton());
    const title = await byDataCy('title-input-field');
    await userEvent.type(title, '!');
    await userEvent.click(await byDataCy('save-changes-button'));

    await waitFor(() => expect(patches).toHaveLength(1));
    expect(patches[0].url.searchParams.get('id')).toBe('eq.0');
  });

  it('matches the whole key of a composite primary key', async () => {
    const columns = [column('a', 'integer', true), column('b', 'integer', true), column('title', 'character varying')];
    setup({ columns, rows: [{ a: 1, b: 2, title: 'x' }] });
    await selectRow('1\u00002');

    await userEvent.click(editButton());
    await userEvent.type(await byDataCy('title-input-field'), 'y');
    await userEvent.click(await byDataCy('save-changes-button'));

    await waitFor(() => expect(patches).toHaveLength(1));
    expect(patches[0].url.searchParams.get('a')).toBe('eq.1');
    expect(patches[0].url.searchParams.get('b')).toBe('eq.2');
  });

  it('pairs each value with its own column when the primary key is not the first column', async () => {
    const title = column('title', 'character varying');
    const id = column('id', 'serial', true);
    setup({ contextColumns: [title, id], columns: [id, title], rows: [{ title: 'one', id: 1 }] });
    await selectRow('1');

    await userEvent.click(editButton());

    expect(await byDataCy('title-input-field')).toHaveValue('one');
    expect(await byDataCy('id-input-field')).toHaveValue('1');
  });

  it('pairs values by name when a column name is an integer, which an object lists first', async () => {
    const columns = [
      column('id', 'serial', true),
      column('2024', 'character varying'),
      column('title', 'character varying'),
    ];
    setup({ columns, rows: [{ id: 1, '2024': 'year', title: 'one' }] });
    await selectRow('1');

    await userEvent.click(editButton());

    expect(await byDataCy('2024-input-field')).toHaveValue('year');
    expect(await byDataCy('title-input-field')).toHaveValue('one');
    expect(await byDataCy('id-input-field')).toHaveValue('1');
  });

  it('has no Edit button without permission to select rows', () => {
    setup({ canSelectRows: false });

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
