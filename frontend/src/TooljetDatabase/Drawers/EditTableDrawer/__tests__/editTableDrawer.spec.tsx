import '@/test/setupMsw';
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { UnsavedChangesGuard } from '@/TooljetDatabase/_components/UnsavedChangesGuard';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { hasUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';
import EditTableDrawer from '..';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

// The confirmation modal has its own specs: here it only records what it was asked to run.
const mockRunMigration = jest.fn();
jest.mock('@/TooljetDatabase/MigrationConfirmModal/useMigrationModal', () => ({
  __esModule: true,
  default: () => ({ runMigration: mockRunMigration, modal: null }),
}));

const page = {
  organizationId: 'org-1',
  tables: [
    { id: 'orders-id', table_name: 'orders' },
    { id: 'users-id', table_name: 'users' },
  ],
  setConfigurations: jest.fn(),
  setColumns: jest.fn(),
  setForeignKeys: jest.fn(),
  handleRefetchQuery: jest.fn(),
  selectedTable: { id: 'other-id', table_name: 'other' },
};

const stored = {
  columns: [
    {
      column_name: 'id',
      data_type: 'integer',
      column_default: "nextval('orders_id_seq'::regclass)",
      constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
    },
    {
      column_name: 'title',
      data_type: 'character varying',
      column_default: null,
      constraints_type: { is_primary_key: false, is_not_null: false, is_unique: false },
    },
  ],
  foreign_keys: [
    {
      constraint_name: 'fk_1',
      column_names: ['title'],
      referenced_table_name: 'users',
      referenced_table_id: 'users-id',
      referenced_column_names: ['name'],
      on_delete: 'RESTRICT',
      on_update: 'RESTRICT',
    },
  ],
  configurations: {},
};

describe('EditTableDrawer', () => {
  const onClose = jest.fn();
  const onRenamed = jest.fn();
  let renameTable: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    act(() => useTjdbStore.getState().actions.resetStore());
    jest.spyOn(tooljetDatabaseService, 'viewTable').mockResolvedValue({ data: { result: stored } });
    jest.spyOn(tooljetDatabaseService, 'findOne').mockResolvedValue({ data: [] });
    renameTable = jest.spyOn(tooljetDatabaseService, 'renameTable').mockResolvedValue({ data: {} });
    jest.spyOn(tooljetDatabaseService, 'deleteForeignKey').mockResolvedValue({ data: {} });
    render(
      <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>
        <EditTableDrawer
          table={{ id: 'orders-id', table_name: 'orders' }}
          isOpen
          onClose={onClose}
          onRenamed={onRenamed}
        />
        <UnsavedChangesGuard />
      </TooljetDatabaseProvider>
    );
    await screen.findByDisplayValue('orders');
  });

  const nameField = () => screen.getByPlaceholderText('Enter table name');
  const saveButton = () => screen.getByRole('button', { name: /Save changes/ });

  it('shows the stored table, and Save changes stays disabled until something changes', () => {
    expect(screen.getByText('Edit table')).toBeInTheDocument();
    expect(screen.getByDisplayValue('id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('title')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('warns that queries and apps are not updated', () => {
    expect(screen.getByText(/Queries and apps using this table aren’t updated automatically/)).toBeInTheDocument();
  });

  it('locks the type of a stored column, and lets a new column pick one', async () => {
    const [idType, titleType] = screen.getAllByRole('combobox', { name: 'Data type' });
    expect(idType).toBeDisabled();
    expect(titleType).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Add column/ }));
    const types = screen.getAllByRole('combobox', { name: 'Data type' });
    expect(types).toHaveLength(3);
    expect(types[2]).toBeEnabled();
  });

  it('has no grip to reorder a stored column', () => {
    expect(screen.queryByRole('button', { name: /Reorder/ })).not.toBeInTheDocument();
  });

  it('does not call a name taken only by the table itself a clash, but does flag another table', async () => {
    expect(screen.queryByText('A table with this name already exists')).not.toBeInTheDocument();
    await userEvent.clear(nameField());
    await userEvent.type(nameField(), 'users');
    expect(screen.getByText('A table with this name already exists')).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it('asks for confirmation to save a rename, then sends the edit_table request', async () => {
    await userEvent.clear(nameField());
    await userEvent.type(nameField(), 'orders_2');
    await userEvent.click(saveButton());

    expect(mockRunMigration).toHaveBeenCalledTimes(1);
    const options = mockRunMigration.mock.calls[0][0];
    expect(options.titlePlaceholder).toBe('Edit table "orders"');
    expect(options.tableId).toBe('orders-id');
    expect(options.changes).toEqual([{ type: 'edit', oldName: 'orders', name: 'orders_2' }]);

    await options.run('my migration');
    expect(renameTable).toHaveBeenCalledWith(
      'org-1',
      'orders',
      'orders_2',
      [
        {
          old_column: expect.objectContaining({ column_name: 'id' }),
          new_column: expect.objectContaining({ column_name: 'id' }),
        },
        {
          old_column: expect.objectContaining({ column_name: 'title' }),
          new_column: expect.objectContaining({ column_name: 'title' }),
        },
      ],
      'my migration'
    );
  });

  it('lists a dropped column in the confirmation, as the old side only', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Delete title' }));
    await userEvent.click(saveButton());
    const options = mockRunMigration.mock.calls[0][0];
    expect(options.changes).toEqual([{ type: 'remove', name: 'title' }]);
    await options.run('m');
    const columns = renameTable.mock.calls[0][3];
    expect(columns[1]).toEqual({ old_column: expect.objectContaining({ column_name: 'title' }) });
  });

  it('warns about a changed primary key in the confirmation', async () => {
    await userEvent.click(screen.getAllByRole('checkbox', { name: 'Primary key' })[1]);
    await userEvent.click(saveButton());
    expect(mockRunMigration.mock.calls[0][0].banner).toBeTruthy();
  });

  it('closes and reports the new name once the edit has gone through', async () => {
    await userEvent.clear(nameField());
    await userEvent.type(nameField(), 'orders_2');
    await userEvent.click(saveButton());
    await act(async () => mockRunMigration.mock.calls[0][0].onSuccess());
    expect(onRenamed).toHaveBeenCalledWith({ id: 'orders-id', table_name: 'orders_2' });
    expect(onClose).toHaveBeenCalled();
    expect(hasUnsavedChanges('editTable')).toBe(false);
  });

  it('reports unsaved changes while the form differs from the stored table', async () => {
    expect(hasUnsavedChanges('editTable')).toBe(false);
    await userEvent.type(nameField(), 'x');
    await waitFor(() => expect(hasUnsavedChanges('editTable')).toBe(true));
  });

  it('removes a stored relation straight away, through its own confirmation, not with Save changes', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Delete relation on title' }));
    expect(renameTable).not.toHaveBeenCalled();
    const options = mockRunMigration.mock.calls[0][0];
    expect(options.titlePlaceholder).toBe('Remove foreign key on "orders"');
    await options.run('m');
    expect(tooljetDatabaseService.deleteForeignKey).toHaveBeenCalledWith('org-1', 'orders', 'fk_1', 'm');
  });
});
