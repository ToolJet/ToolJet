import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { toast } from 'react-hot-toast';
import { server } from '@/test/msw/server';
import { act, cleanup, fireEvent, render, screen, userEvent, waitFor, within } from '@/test/test-utils';
import { useTjdbStore } from '../../../_stores/tjdbStore';
import { TooljetDatabaseContext } from '../../../context';
import { useTableRows } from '../../../rows/useTableRows';
import { hasUnsavedChanges } from '../../../_stores/unsavedChanges';
import { TableGrid } from '../TableGrid';
import type { GridColumn, GridRow } from '../useTableGrid';

jest.mock('react-hot-toast', () => {
  const toast = jest.fn() as jest.Mock & { error: jest.Mock; success: jest.Mock };
  toast.error = jest.fn();
  toast.success = jest.fn();
  return { __esModule: true, default: toast, toast };
});

const column = (accessor: string, dataType: string, isPrimaryKey = false, isNotNull = true): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  constraints_type: { is_primary_key: isPrimaryKey, is_not_null: isNotNull },
});

const COLUMNS = [
  column('id', 'serial', true),
  column('title', 'character varying', false, false),
  column('views', 'integer', false, false),
  column('published', 'boolean', false, false),
  column('code', 'character varying'),
  column('payload', 'jsonb', false, false),
  { ...column('status', 'character varying', false, false), column_default: 'draft' },
  column('seen_at', 'timestamp with time zone', false, false),
];
const ROWS = [
  {
    id: 1,
    title: 'First post',
    views: 10,
    published: true,
    code: 'a',
    payload: { a: 1 },
    status: 'sent',
    seen_at: '2026-01-01T10:00:00.000Z',
  },
  { id: 2, title: null, views: null, published: null, code: 'b', payload: null, status: null, seen_at: null },
  { id: 3, title: 'Third', views: 3, published: false, code: 'c', payload: null, status: 'draft', seen_at: null },
];

const COMPOSITE_COLUMNS = [
  column('a', 'integer', true),
  column('b', 'integer', true),
  column('title', 'text', false, false),
];
const COMPOSITE_ROWS = [
  { a: 1, b: 2, title: 'x' },
  { a: 1, b: 3, title: 'y' },
];

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

type HarnessProps = {
  columns?: GridColumn[];
  canEditCells?: boolean;
  foreignKeys?: unknown[];
};

// Rows come from the query cache, as on the page: a saved cell is visible only because the cache was patched.
function Harness({ columns = COLUMNS, canEditCells = true, foreignKeys = [] }: HarnessProps) {
  const { rows, isLoading } = useTableRows('table-1');
  return (
    <TooljetDatabaseContext.Provider
      value={
        {
          selectedTable: { id: 'table-1', table_name: 'orders' },
          organizationId: 'org-1',
          foreignKeys,
          handleRefetchQuery: jest.fn(),
        } as unknown as React.ContextType<typeof TooljetDatabaseContext>
      }
    >
      <TableGrid
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        canEditSchema
        canSelectRows
        canEditCells={canEditCells}
      />
    </TooljetDatabaseContext.Provider>
  );
}

// The shared setup resets every zustand store in its own afterEach, which would update the grid while it is still
// mounted. Hooks of a describe run before the file's top-level ones, so unmounting here comes first.
describe('TableGrid | cell navigation and editing', () => {
  afterEach(cleanup);

  const patches: { url: URL; body: Record<string, unknown> }[] = [];
  const defaults: Record<string, unknown>[] = [];
  let reads: URL[] = [];
  let patchStatus = 200;

  const serve = (rows: unknown[]) =>
    server.use(
      http.get('*/tooljet-db/proxy/:tableId', ({ request, params }) => {
        reads.push(new URL(request.url));
        return HttpResponse.json(params.tableId === 'table-1' ? rows : [{ id: 7 }, { id: 8 }], {
          headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` },
        });
      }),
      http.post('*/tooljet-db/organizations/:orgId/table/:tableId/rows/default', async ({ request }) => {
        defaults.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ result: { value: 'draft' } }, { status: 201 });
      }),
      http.patch('*/tooljet-db/proxy/:tableId', async ({ request }) => {
        patches.push({ url: new URL(request.url), body: (await request.json()) as Record<string, unknown> });
        return patchStatus === 200
          ? HttpResponse.json([])
          : HttpResponse.json({ statusCode: 400, message: 'value too long' }, { status: patchStatus });
      })
    );

  beforeEach(() => {
    patches.length = 0;
    defaults.length = 0;
    reads = [];
    patchStatus = 200;
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    useTjdbStore.getState().actions.resetStore();
    useTjdbStore.setState({ selectedEnvironment: { id: 'env-1', priority: 1 } });
    useTjdbStore.getState().actions.openTableView('table-1');
    serve(ROWS);
  });

  const setup = async (props: HarnessProps = {}, firstRow = '1') => {
    render(<Harness {...props} />);
    await screen.findByTestId(`grid-row-${firstRow}`);
  };

  const grid = () => screen.getByRole('grid');
  const cellAt = (rowId: string, columnName: string, columns = COLUMNS) => {
    const index = columns.findIndex((item) => item.accessor === columnName);
    // The first gridcell is the select column.
    return within(screen.getByTestId(`grid-row-${rowId}`)).getAllByRole('gridcell')[index + 1];
  };
  const focusedCell = () => document.getElementById(grid().getAttribute('aria-activedescendant') ?? 'none');
  const editor = () => screen.queryByTestId('cell-editor');
  const field = (name: string) => screen.getByRole('textbox', { name });

  describe('focus', () => {
    it('focuses a clicked cell and rings it', async () => {
      await setup();

      await userEvent.click(cellAt('2', 'title'));

      expect(focusedCell()).toBe(cellAt('2', 'title'));
      expect(cellAt('2', 'title')).toHaveClass('tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-outline)]');
      expect(cellAt('1', 'title')).not.toHaveClass('tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-outline)]');
    });

    it('moves focus across rows and columns with the arrow keys', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'title'));

      await userEvent.keyboard('{ArrowDown}');
      expect(focusedCell()).toBe(cellAt('2', 'title'));

      await userEvent.keyboard('{ArrowRight}');
      expect(focusedCell()).toBe(cellAt('2', 'views'));

      await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
      expect(focusedCell()).toBe(cellAt('1', 'title'));
    });

    it('never lands on the select column', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'id'));

      await userEvent.keyboard('{ArrowLeft}');

      expect(focusedCell()).toBe(cellAt('1', 'id'));
    });

    it('moves right on Tab and left on Shift+Tab', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'title'));

      await userEvent.keyboard('{Tab}');
      expect(focusedCell()).toBe(cellAt('1', 'views'));

      await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
      expect(focusedCell()).toBe(cellAt('1', 'title'));
    });

    it('lets Tab leave the grid from the last cell, and keeps it inside everywhere else', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'title'));
      expect(fireEvent.keyDown(grid(), { key: 'Tab' })).toBe(false);

      await userEvent.click(cellAt('1', 'seen_at'));

      expect(fireEvent.keyDown(grid(), { key: 'Tab' })).toBe(true);
      expect(focusedCell()).toBe(cellAt('1', 'seen_at'));
    });

    it('clears the focus on Escape', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'title'));

      await userEvent.keyboard('{Escape}');

      expect(grid()).not.toHaveAttribute('aria-activedescendant');
    });

    it('drops the focus when the view changes', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'title'));

      act(() => {
        useTjdbStore.getState().actions.setPageCount(2);
      });

      await waitFor(() => expect(grid()).not.toHaveAttribute('aria-activedescendant'));
    });

    it('ignores keys that come from a control inside the grid', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'title'));

      await userEvent.click(within(screen.getByTestId('grid-row-1')).getByRole('checkbox', { name: 'Select row' }));
      await userEvent.keyboard('{ArrowDown}');

      expect(focusedCell()).toBe(cellAt('1', 'title'));
    });
  });

  describe('editor', () => {
    it('opens on Enter and cancels on Escape without a request', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'title'));

      await userEvent.keyboard('{Enter}');
      expect(editor()).toBeInTheDocument();
      expect(field('title')).toHaveValue('First post');

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(editor()).not.toBeInTheDocument());
      expect(patches).toHaveLength(0);
      expect(focusedCell()).toBe(cellAt('1', 'title'));
    });

    it('opens on a double click', async () => {
      await setup();

      await userEvent.dblClick(cellAt('3', 'title'));

      expect(field('title')).toHaveValue('Third');
    });

    it('cancels on Cancel, on an outside press and on scroll, without a request', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(editor()).not.toBeInTheDocument());

      await userEvent.dblClick(cellAt('1', 'title'));
      await userEvent.click(document.body);
      await waitFor(() => expect(editor()).not.toBeInTheDocument());

      await userEvent.dblClick(cellAt('1', 'title'));
      fireEvent.scroll(grid());
      await waitFor(() => expect(editor()).not.toBeInTheDocument());

      expect(patches).toHaveLength(0);
    });

    it('stays open when its own field is clicked', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));

      await userEvent.click(field('title'));

      expect(editor()).toBeInTheDocument();
    });

    it('does not send a request for an unchanged value', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));

      await userEvent.keyboard('{Enter}');

      await waitFor(() => expect(editor()).not.toBeInTheDocument());
      expect(patches).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('sends the new value filtered by the primary key and updates the cell without a refetch', async () => {
      await setup();
      const readsBefore = reads.length;
      await userEvent.dblClick(cellAt('1', 'title'));

      await userEvent.clear(field('title'));
      await userEvent.type(field('title'), 'Edited{Enter}');

      await waitFor(() => expect(editor()).not.toBeInTheDocument());
      expect(patches).toHaveLength(1);
      expect(patches[0].url.searchParams.get('id')).toBe('eq.1');
      expect(patches[0].url.searchParams.get('environment_id')).toBe('env-1');
      expect(patches[0].body).toEqual({ title: 'Edited' });
      expect(cellAt('1', 'title')).toHaveTextContent('Edited');
      expect(cellAt('2', 'title')).toHaveTextContent('NULL');
      expect(toast.success).toHaveBeenCalledWith('Column edited successfully');
      expect(reads).toHaveLength(readsBefore);
      expect(focusedCell()).toBe(cellAt('1', 'title'));
    });

    it('saves from the Save button', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));

      await userEvent.type(field('title'), '!');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'title')).toHaveTextContent('First post!'));
      expect(patches[0].body).toEqual({ title: 'First post!' });
    });

    it('filters a composite key on every key column', async () => {
      serve(COMPOSITE_ROWS);
      await setup({ columns: COMPOSITE_COLUMNS }, '1\u00002');
      await userEvent.dblClick(cellAt('1\u00003', 'title', COMPOSITE_COLUMNS));

      await userEvent.clear(field('title'));
      await userEvent.type(field('title'), 'z{Enter}');

      await waitFor(() => expect(patches).toHaveLength(1));
      expect(patches[0].url.searchParams.get('a')).toBe('eq.1');
      expect(patches[0].url.searchParams.get('b')).toBe('eq.3');
      expect(cellAt('1\u00003', 'title', COMPOSITE_COLUMNS)).toHaveTextContent('z');
      expect(cellAt('1\u00002', 'title', COMPOSITE_COLUMNS)).toHaveTextContent('x');
    });

    it('keeps the editor open with the draft when the save is refused', async () => {
      patchStatus = 400;
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));

      await userEvent.type(field('title'), '!{Enter}');

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('value too long'));
      expect(editor()).toBeInTheDocument();
      expect(field('title')).toHaveValue('First post!');
      expect(cellAt('1', 'title')).not.toHaveTextContent('First post!');
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('sets a nullable column to NULL', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));

      await userEvent.click(screen.getByRole('button', { name: 'Null' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'title')).toHaveTextContent('NULL'));
      expect(patches[0].body).toEqual({ title: null });
    });

    it('opens a NULL cell with the Null chip on, and saves an empty string once it is off', async () => {
      await setup();
      await userEvent.dblClick(cellAt('2', 'title'));
      expect(screen.getByRole('button', { name: 'Null' })).toHaveAttribute('aria-pressed', 'true');

      await userEvent.click(screen.getByRole('button', { name: 'Null' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(patches).toHaveLength(1));
      expect(patches[0].body).toEqual({ title: '' });
    });

    it('offers no Null chip for a NOT NULL column', async () => {
      await setup();

      await userEvent.dblClick(cellAt('1', 'code'));

      expect(screen.queryByRole('button', { name: 'Null' })).not.toBeInTheDocument();
    });

    it('offers a Default chip only for a column that has a default', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));
      expect(screen.queryByRole('button', { name: 'Default' })).not.toBeInTheDocument();
      await userEvent.keyboard('{Escape}');

      await userEvent.dblClick(cellAt('1', 'status'));
      expect(screen.getByRole('button', { name: 'Default' })).toBeInTheDocument();
    });

    it('saves the column default through the server action and shows the value it returns', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'status'));

      await userEvent.click(screen.getByRole('button', { name: 'Default' }));
      expect(field('status')).toHaveAttribute('placeholder', 'The column default is used: draft');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'status')).toHaveTextContent('draft'));
      expect(defaults).toEqual([{ environment_id: 'env-1', column: 'status', where: { id: 1 } }]);
      expect(patches).toHaveLength(0);
    });

    it('keeps Null and Default exclusive', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'status'));

      await userEvent.click(screen.getByRole('button', { name: 'Null' }));
      await userEvent.click(screen.getByRole('button', { name: 'Default' }));

      expect(screen.getByRole('button', { name: 'Null' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows a saved number the way a refetch would, and sends what was typed', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'views'));

      await userEvent.clear(field('views'));
      await userEvent.type(field('views'), '012{Enter}');

      await waitFor(() => expect(cellAt('1', 'views')).toHaveTextContent(/^12$/));
      expect(patches[0].body).toEqual({ views: '012' });
    });
  });

  describe('boolean', () => {
    it('opens on Enter with False and True to choose from, and saves the choice', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'published'));
      await userEvent.keyboard('{Enter}');
      expect(screen.getByRole('radio', { name: 'True' })).toBeChecked();

      await userEvent.click(screen.getByRole('radio', { name: 'False' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'published')).toHaveTextContent('false'));
      expect(patches[0].body).toEqual({ published: false });
    });

    it('sets a boolean back to NULL, which the old flip could not', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'published'));

      await userEvent.click(screen.getByRole('button', { name: 'Null' }));
      expect(screen.getByRole('radio', { name: 'True' })).toBeDisabled();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'published')).toHaveTextContent('NULL'));
      expect(patches[0].body).toEqual({ published: null });
    });
  });

  describe('json', () => {
    it('saves a parsed document, not a string, and shows it in the cell', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'payload'));

      fireEvent.change(screen.getByRole('textbox', { name: 'payload' }), { target: { value: '{"a": 2}' } });
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'payload')).toHaveTextContent('{"a":2}'));
      expect(patches[0].body).toEqual({ payload: { a: 2 } });
    });

    it('shows a parse error and keeps Save off while the JSON is invalid', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'payload'));

      fireEvent.change(screen.getByRole('textbox', { name: 'payload' }), { target: { value: '{"a":' } });

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid JSON');
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('is clean while the text only differs in spacing', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'payload'));

      fireEvent.change(screen.getByRole('textbox', { name: 'payload' }), { target: { value: '{"a":1}' } });

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(hasUnsavedChanges()).toBe(false);
    });
  });

  describe('timestamp', () => {
    it('opens an editor and sets the value to NULL', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'seen_at'));
      expect(screen.getByTestId('cell-editor-timestamp')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Null' }));
      expect(screen.getByText('No date or time is stored (NULL).')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'seen_at')).toHaveTextContent('NULL'));
      expect(patches[0].body).toEqual({ seen_at: null });
    });
  });

  describe('foreign key', () => {
    const foreignKeys = [{ column_names: ['code'], referenced_table_id: 'table-2', referenced_column_names: ['id'] }];

    it('picks a referenced value from a searchable list and saves it', async () => {
      await setup({ foreignKeys });
      await userEvent.dblClick(cellAt('1', 'code'));

      await userEvent.click(await screen.findByRole('option', { name: '8' }));
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(cellAt('1', 'code')).toHaveTextContent('8'));
      expect(patches[0].body).toEqual({ code: '8' });
      const referenceRead = reads.find((url) => url.pathname.endsWith('/table-2'));
      expect(referenceRead?.searchParams.get('select')).toBe('id');
    });

    it('searches the referenced table as the user types', async () => {
      await setup({ foreignKeys });
      await userEvent.dblClick(cellAt('1', 'code'));
      await screen.findByRole('option', { name: '7' });

      await userEvent.type(screen.getByRole('textbox', { name: 'Search id' }), '8');

      await waitFor(() =>
        expect(
          reads.some((url) => url.pathname.endsWith('/table-2') && url.searchParams.getAll('id').includes('ilike.%8%'))
        ).toBe(true)
      );
    });
  });

  describe('not editable', () => {
    it('does not edit a primary key', async () => {
      await setup();
      await userEvent.click(cellAt('1', 'id'));

      await userEvent.keyboard('{Enter}');
      await userEvent.dblClick(cellAt('1', 'id'));

      expect(editor()).not.toBeInTheDocument();
      expect(patches).toHaveLength(0);
    });

    it('does not edit a primary key of any type', async () => {
      serve(COMPOSITE_ROWS);
      await setup({ columns: COMPOSITE_COLUMNS }, '1\u00002');

      await userEvent.dblClick(cellAt('1\u00002', 'a', COMPOSITE_COLUMNS));
      await userEvent.click(cellAt('1\u00002', 'b', COMPOSITE_COLUMNS));
      await userEvent.keyboard('{Enter}');

      expect(editor()).not.toBeInTheDocument();
      expect(patches).toHaveLength(0);
    });

    it('does not edit a serial column that is not the key', async () => {
      const columns = [column('id', 'integer', true), column('seq', 'serial')];
      serve([{ id: 1, seq: 5 }]);
      await setup({ columns });

      await userEvent.dblClick(cellAt('1', 'seq', columns));

      expect(editor()).not.toBeInTheDocument();
    });

    it('edits a bigint-keyed table, except a row whose key no longer fits a number', async () => {
      const columns = [column('id', 'bigint', true), column('title', 'character varying')];
      serve([
        { id: 5, title: 'small' },
        { id: 2 ** 53, title: 'huge' },
      ]);
      await setup({ columns }, '5');

      await userEvent.dblClick(cellAt('9007199254740992', 'title', columns));
      expect(editor()).not.toBeInTheDocument();

      await userEvent.dblClick(cellAt('5', 'title', columns));
      expect(editor()).toBeInTheDocument();
    });

    it('does not edit any cell without permission, but still navigates', async () => {
      await setup({ canEditCells: false });
      await userEvent.click(cellAt('1', 'title'));

      await userEvent.keyboard('{ArrowDown}{Enter}');
      await userEvent.dblClick(cellAt('3', 'published'));

      expect(focusedCell()).toBe(cellAt('3', 'published'));
      expect(editor()).not.toBeInTheDocument();
      expect(patches).toHaveLength(0);
    });

    it('does not edit a table without a primary key: a PATCH without a filter would rewrite every row', async () => {
      const columns = [column('title', 'character varying'), column('views', 'integer')];
      serve([{ title: 'a', views: 1 }]);
      await setup({ columns }, '0');

      await userEvent.dblClick(cellAt('0', 'title', columns));

      expect(editor()).not.toBeInTheDocument();
      expect(patches).toHaveLength(0);
    });
  });

  describe('refetch while editing', () => {
    // Rows as a prop, so a test can hand the grid a refetch that shifts them.
    const mountRows = (rows: GridRow[]) => {
      const ui = (next: GridRow[]) => (
        <TooljetDatabaseContext.Provider
          value={
            {
              selectedTable: { id: 'table-1', table_name: 'orders' },
              foreignKeys: [],
              handleRefetchQuery: jest.fn(),
            } as unknown as React.ContextType<typeof TooljetDatabaseContext>
          }
        >
          <TableGrid columns={COLUMNS} rows={next} isLoading={false} canEditSchema canSelectRows canEditCells />
        </TooljetDatabaseContext.Provider>
      );
      const view = render(ui(rows));
      return (next: GridRow[]) => view.rerender(ui(next));
    };
    const first = { id: 1, title: 'a' };
    const second = { id: 2, title: 'b' };

    it('keeps the editor and its draft on the row it was opened on, and saves to that row', async () => {
      const refetch = mountRows([first, second]);
      await userEvent.dblClick(cellAt('2', 'title'));
      await userEvent.type(field('title'), 'X');

      refetch([{ id: 9, title: 'new' }, first, second]);

      expect(within(screen.getByTestId('grid-row-2')).getByRole('textbox')).toBeInTheDocument();
      expect(within(screen.getByTestId('grid-row-1')).queryByRole('textbox')).not.toBeInTheDocument();
      expect(field('title')).toHaveValue('bX');
      expect(focusedCell()).toBe(cellAt('2', 'title'));

      await userEvent.type(field('title'), 'Y{Enter}');

      await waitFor(() => expect(patches).toHaveLength(1));
      expect(patches[0].url.searchParams.get('id')).toBe('eq.2');
      expect(patches[0].body).toEqual({ title: 'bXY' });
      await waitFor(() => expect(editor()).not.toBeInTheDocument());
      expect(focusedCell()).toBe(cellAt('2', 'title'));
    });

    it('closes the editor when its row is gone, instead of moving it to the row that took its place', async () => {
      const refetch = mountRows([first, second, { id: 3, title: 'c' }]);
      await userEvent.dblClick(cellAt('2', 'title'));

      refetch([first, { id: 3, title: 'c' }]);

      await waitFor(() => expect(editor()).not.toBeInTheDocument());
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(patches).toHaveLength(0);
    });

    it('does not close another editor when an earlier save resolves late', async () => {
      let release: () => void = () => undefined;
      server.use(
        http.patch('*/tooljet-db/proxy/:tableId', async ({ request }) => {
          patches.push({ url: new URL(request.url), body: (await request.json()) as Record<string, unknown> });
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          return HttpResponse.json([]);
        })
      );
      mountRows([first, second]);
      await userEvent.dblClick(cellAt('1', 'title'));
      await userEvent.type(field('title'), 'X{Enter}');
      await waitFor(() => expect(patches).toHaveLength(1));

      await userEvent.click(document.body);
      await userEvent.dblClick(cellAt('2', 'title'));
      expect(within(screen.getByTestId('grid-row-2')).getByRole('textbox')).toBeInTheDocument();
      release();

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      expect(within(screen.getByTestId('grid-row-2')).getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('unsaved input', () => {
    const unsaved = () => hasUnsavedChanges('cellEditor');

    it('is unsaved only while the draft differs from the cell value', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));
      expect(unsaved()).toBe(false);

      await userEvent.type(field('title'), '!');
      expect(unsaved()).toBe(true);

      await userEvent.type(field('title'), '{Backspace}');
      expect(unsaved()).toBe(false);
    });

    it('is clean once the editor closes', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));
      await userEvent.type(field('title'), '!');

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(unsaved()).toBe(false));
    });

    // The press that starts a tab or environment switch would otherwise close the editor first, and the switch would
    // find nothing unsaved to ask about.
    it('stays open on an outside press while the draft is unsaved', async () => {
      await setup();
      await userEvent.dblClick(cellAt('1', 'title'));
      await userEvent.type(field('title'), '!');

      await userEvent.click(document.body);

      expect(editor()).toBeInTheDocument();
      expect(field('title')).toHaveValue('First post!');
      expect(unsaved()).toBe(true);
    });
  });
});
