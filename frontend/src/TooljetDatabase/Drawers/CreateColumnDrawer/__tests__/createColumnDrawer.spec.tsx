// Adding a column resets the grid to page 1 because the table's shape changed under it. When the column is added to a
// table other than the open one (from the Tables panel), the open grid must keep its page.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, userEvent, act } from '@/test/test-utils';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import CreateColumnDrawer from '..';

// The drawer's only job here is what it does once the form reports success.
jest.mock('../../../Forms/ColumnForm', () => ({
  __esModule: true,
  default: ({ onCreate }: { onCreate: () => void }) => (
    <button type="button" onClick={onCreate}>
      submit column
    </button>
  ),
}));

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const page = {
  organizationId: 'org-1',
  selectedTable: { id: 'users-id', table_name: 'users' },
  setColumns: jest.fn(),
  setForeignKeys: jest.fn(),
  setConfigurations: jest.fn(),
  handleRefetchQuery: jest.fn(),
};

const renderDrawer = (props: { resetPage?: boolean } = {}) =>
  render(
    <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>
      <CreateColumnDrawer
        isCreateColumnDrawerOpen
        setIsCreateColumnDrawerOpen={() => {}}
        rows={[]}
        referencedColumnDetails={[]}
        setReferencedColumnDetails={() => {}}
        {...props}
      />
    </TooljetDatabaseProvider>
  );

describe('CreateColumnDrawer | page reset after a column is added', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', () =>
        HttpResponse.json({ result: { columns: [], foreign_keys: [], configurations: {} } })
      )
    );
    act(() => useTjdbStore.setState({ pageCount: 3 }));
  });

  it('resets the grid to page 1 by default, as the grid header relies on', async () => {
    renderDrawer();

    await userEvent.click(await screen.findByRole('button', { name: 'submit column' }));

    await waitFor(() => expect(useTjdbStore.getState().pageCount).toBe(1));
  });

  it('leaves the page alone when told the table is not the open one', async () => {
    renderDrawer({ resetPage: false });

    await userEvent.click(await screen.findByRole('button', { name: 'submit column' }));

    // The refetch runs in the same tick as the page reset, so once it has run the reset has had its chance.
    await waitFor(() => expect(page.handleRefetchQuery).toHaveBeenCalled());
    expect(useTjdbStore.getState().pageCount).toBe(3);
  });
});
