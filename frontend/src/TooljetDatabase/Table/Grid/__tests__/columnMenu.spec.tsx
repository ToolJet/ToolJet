import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { act, cleanup, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { UnsavedChangesGuard } from '../../../_components/UnsavedChangesGuard';
import { DEFAULT_VIEW, useTjdbStore } from '../../../_stores/tjdbStore';
import { TooljetDatabaseContext } from '../../../context';
import { TableGrid, type TableGridProps } from '../TableGrid';
import type { GridColumn } from '../useTableGrid';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1, enabled: true };

const column = (accessor: string, dataType: string, isPrimaryKey = false): GridColumn => ({
  Header: accessor,
  accessor,
  dataType,
  constraints_type: {
    is_primary_key: isPrimaryKey,
    is_not_null: false,
    is_unique: false,
  } as GridColumn['constraints_type'],
});

const COLUMNS = [column('id', 'serial', true), column('title', 'character varying')];
const ROWS = [{ id: 1, title: 'First post' }];

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

const byDataCy = (dataCy: string) =>
  waitFor(() => {
    const element = document.querySelector(`[data-cy="${dataCy}"]`);
    expect(element).toBeTruthy();
    return element as HTMLElement;
  });

// The shared setup resets every zustand store in its own afterEach, which would update the grid while it is still
// mounted. Hooks of a describe run before the file's top-level ones, so unmounting here comes first.
describe('TableGrid | column menu', () => {
  afterEach(cleanup);

  const dropped: string[] = [];
  const setColumns = jest.fn();
  const handleRefetchQuery = jest.fn();

  beforeEach(() => {
    dropped.length = 0;
    setColumns.mockClear();
    handleRefetchQuery.mockClear();
    act(() => useTjdbStore.getState().actions.resetStore());
    act(() => useTjdbStore.setState({ environments: [DEVELOPMENT], selectedEnvironment: DEVELOPMENT }));
    server.use(
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/dependents', () =>
        HttpResponse.json({ result: { count: 0 } })
      ),
      http.delete('*/tooljet-db/organizations/:organizationId/table/:tableName/column/:columnName', ({ params }) => {
        dropped.push(String(params.columnName));
        return HttpResponse.json({ result: {} });
      }),
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', () =>
        HttpResponse.json({
          result: {
            columns: [
              { column_name: 'id', data_type: 'integer', column_default: "nextval('x')", constraints_type: {} },
            ],
            foreign_keys: [],
            configurations: {},
          },
        })
      )
    );
  });

  const setup = (props: Partial<TableGridProps> = {}) =>
    render(
      <TooljetDatabaseContext.Provider
        value={
          {
            organizationId: 'org-1',
            selectedTable: { id: 'table-1', table_name: 'orders' },
            tables: [],
            foreignKeys: [],
            configurations: {},
            setColumns,
            setForeignKeys: jest.fn(),
            setConfigurations: jest.fn(),
            handleRefetchQuery,
          } as unknown as React.ContextType<typeof TooljetDatabaseContext>
        }
      >
        <TableGrid columns={COLUMNS} rows={ROWS} isLoading={false} canEditSchema {...props} />
        <UnsavedChangesGuard />
      </TooljetDatabaseContext.Provider>
    );

  const openMenu = async (name: string) => {
    await userEvent.click(screen.getByRole('button', { name: `${name} column options` }));
  };

  it('has no menu button when the schema is not editable', () => {
    setup({ canEditSchema: false });

    expect(screen.queryByRole('button', { name: /column options/ })).not.toBeInTheDocument();
  });

  it('keeps its Cypress hooks on the button and on both items', async () => {
    setup();

    expect(screen.getByRole('button', { name: 'title column options' })).toHaveAttribute('data-cy', 'column-menu-icon');
    await openMenu('title');

    expect(await screen.findByRole('menuitem', { name: 'Edit column' })).toHaveAttribute(
      'data-cy',
      'edit-column-option'
    );
    expect(screen.getByRole('menuitem', { name: 'Delete column' })).toHaveAttribute('data-cy', 'delete-column-option');
  });

  it('offers Edit and Delete and nothing else, and has no menu on the checkbox column', async () => {
    setup({ canSelectRows: true });

    // One per data column: the checkbox column has none.
    expect(screen.getAllByRole('button', { name: /column options/ })).toHaveLength(COLUMNS.length);

    await openMenu('title');

    expect(await screen.findAllByRole('menuitem')).toHaveLength(2);
  });

  it('opens the column form in a drawer for the column whose menu it was', async () => {
    setup();

    await openMenu('title');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit column' }));

    expect(await byDataCy('column-name-input-field')).toHaveValue('title');
  });

  it('closes the edit column drawer on Cancel unasked when untouched, and asks once the name is changed', async () => {
    setup();
    await openMenu('title');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit column' }));
    const name = await byDataCy('column-name-input-field');

    await userEvent.type(name, 's');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Unsaved input in the column edit will be lost.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(name).toHaveValue('titles');

    await userEvent.type(name, '{Backspace}');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
    await waitFor(() => expect(document.querySelector('[data-cy="column-name-input-field"]')).toBeNull());
  });

  it('cannot delete a primary key column, but can edit it', async () => {
    setup();

    await openMenu('id');

    expect(await screen.findByRole('menuitem', { name: 'Delete column' })).toHaveAttribute('data-disabled');
    expect(screen.getByRole('menuitem', { name: 'Edit column' })).not.toHaveAttribute('data-disabled');
  });

  it('asks for confirmation on Delete and drops the column only once it is confirmed', async () => {
    setup();

    await openMenu('title');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete column' }));

    expect(await byDataCy('migration-confirm-modal')).toBeInTheDocument();
    expect(dropped).toEqual([]);

    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(dropped).toEqual(['title']));
    await waitFor(() => expect(handleRefetchQuery).toHaveBeenCalled());
    expect(setColumns).toHaveBeenCalled();
  });

  it('forgets the saved view of the table once a column is dropped, since it may filter or sort on it', async () => {
    act(() =>
      useTjdbStore.setState({
        viewTableId: 'table-1',
        views: {
          'table-1': { ...DEFAULT_VIEW, queryFilters: { 0: { column: 'title', operator: 'eq', value: 'a' } } },
          'table-2': { ...DEFAULT_VIEW, pageCount: 2 },
        },
      })
    );
    setup();

    await openMenu('title');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete column' }));
    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(useTjdbStore.getState().views['table-1']).toBeUndefined());
    expect(useTjdbStore.getState().views['table-2']).toBeDefined();
  });

  it('keeps the saved view when the drop is cancelled', async () => {
    const view = { ...DEFAULT_VIEW, pageCount: 2 };
    act(() => useTjdbStore.setState({ viewTableId: 'table-1', views: { 'table-1': view } }));
    setup();

    await openMenu('title');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete column' }));
    await userEvent.click(await byDataCy('migration-confirm-cancel'));

    await waitFor(() => expect(document.querySelector('[data-cy="migration-confirm-modal"]')).toBeNull());
    expect(useTjdbStore.getState().views['table-1']).toEqual(view);
  });

  it('drops nothing when the confirmation is cancelled', async () => {
    setup();

    await openMenu('title');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete column' }));
    await userEvent.click(await byDataCy('migration-confirm-cancel'));

    await waitFor(() => expect(document.querySelector('[data-cy="migration-confirm-modal"]')).toBeNull());
    expect(dropped).toEqual([]);
    expect(handleRefetchQuery).not.toHaveBeenCalled();
  });
});
