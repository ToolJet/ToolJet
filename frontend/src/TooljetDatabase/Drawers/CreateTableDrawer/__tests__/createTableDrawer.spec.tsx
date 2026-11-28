import '@/test/setupMsw';
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { UnsavedChangesGuard } from '@/TooljetDatabase/_components/UnsavedChangesGuard';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { hasUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';
import CreateTableDrawer from '..';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

const page = {
  organizationId: 'org-1',
  tables: [{ id: 'users-id', table_name: 'users' }],
  setTables: jest.fn(),
  openTable: jest.fn(),
};

describe('CreateTableDrawer', () => {
  const onClose = jest.fn();
  let createTable: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useTjdbStore.getState().actions.resetStore());
    createTable = jest
      .spyOn(tooljetDatabaseService, 'createTable')
      .mockResolvedValue({ data: { result: { id: 'orders-id' } } });
    jest
      .spyOn(tooljetDatabaseService, 'findAll')
      .mockResolvedValue({ data: { result: [{ id: 'orders-id', table_name: 'orders' }] } });
    render(
      <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>
        <CreateTableDrawer isOpen onClose={onClose} />
        <UnsavedChangesGuard />
      </TooljetDatabaseProvider>
    );
  });

  const nameField = () => screen.getByPlaceholderText('Enter table name');
  const createButton = () => screen.getByRole('button', { name: /^Create$/ });

  it('starts with the id column and Create disabled', () => {
    expect(screen.getByText('Create a new table')).toBeInTheDocument();
    expect(screen.getByDisplayValue('id')).toBeInTheDocument();
    expect(createButton()).toBeDisabled();
  });

  it('shows the name rule under the field and enables Create for a valid name', async () => {
    await userEvent.type(nameField(), '1x');
    expect(screen.getByText('Table name cannot start with a number')).toBeInTheDocument();
    expect(createButton()).toBeDisabled();

    await userEvent.clear(nameField());
    await userEvent.type(nameField(), 'orders');
    expect(createButton()).toBeEnabled();
  });

  it('says so under the field when the name is taken, and keeps Create disabled', async () => {
    await userEvent.type(nameField(), 'users');
    expect(screen.getByText('A table with this name already exists')).toBeInTheDocument();
    expect(createButton()).toBeDisabled();
  });

  it('says so under the field when the name was typed and then emptied', async () => {
    expect(screen.queryByText('Table name cannot be empty')).not.toBeInTheDocument();
    await userEvent.type(nameField(), 'a');
    await userEvent.clear(nameField());
    expect(screen.getByText('Table name cannot be empty')).toBeInTheDocument();
    expect(createButton()).toBeDisabled();
  });

  it('says so when the field is left empty', async () => {
    await userEvent.click(nameField());
    await userEvent.tab();
    expect(screen.getByText('Table name cannot be empty')).toBeInTheDocument();
  });

  it('adds a column row and keeps Create disabled until it is named and typed', async () => {
    await userEvent.type(nameField(), 'orders');
    await userEvent.click(screen.getByRole('button', { name: /Add column/ }));

    expect(screen.getAllByLabelText('Column name')).toHaveLength(2);
    expect(createButton()).toBeDisabled();
  });

  it('creates the table with the draft payload, then opens it and closes', async () => {
    await userEvent.type(nameField(), 'orders');
    await userEvent.click(createButton());

    await waitFor(() => expect(createTable).toHaveBeenCalledTimes(1));
    const [organizationId, tableName, columns, foreignKeys, checkingValues] = createTable.mock.calls[0];
    expect(organizationId).toBe('org-1');
    expect(tableName).toBe('orders');
    expect(columns).toEqual([
      {
        column_name: 'id',
        data_type: 'serial',
        constraints_type: { is_not_null: true, is_unique: false, is_primary_key: true },
        configurations: {},
      },
    ]);
    expect(foreignKeys).toEqual([]);
    expect(checkingValues).toBe(false);

    await waitFor(() => expect(page.openTable).toHaveBeenCalledWith({ table_name: 'orders', id: 'orders-id' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('is no longer unsaved once the table is created, so opening it never asks about discarding', async () => {
    await userEvent.type(nameField(), 'orders');
    expect(hasUnsavedChanges('createTable')).toBe(true);
    await userEvent.click(createButton());

    await waitFor(() => expect(page.openTable).toHaveBeenCalled());
    expect(hasUnsavedChanges('createTable')).toBe(false);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('stays open and keeps the draft when the server refuses', async () => {
    createTable.mockResolvedValueOnce({ error: { message: 'boom' } });
    await userEvent.type(nameField(), 'orders');
    await userEvent.click(createButton());

    await waitFor(() => expect(createTable).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(nameField()).toHaveValue('orders');
  });

  it('closes on Cancel while untouched, and asks once the name is typed', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();

    await userEvent.type(nameField(), 'orders');
    expect(hasUnsavedChanges('createTable')).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Unsaved input in the new table will be lost.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    await act(async () => {});
    expect(onClose).toHaveBeenCalled();
  });
});
