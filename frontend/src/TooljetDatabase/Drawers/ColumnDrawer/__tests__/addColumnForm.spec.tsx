import '@/test/setupMsw';
import React from 'react';
import { act, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { hasUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';
import { AddColumnForm } from '../AddColumnForm';

// The confirmation modal has its own specs: here it only records what it was asked to run.
const mockRunMigration = jest.fn();
jest.mock('@/TooljetDatabase/MigrationConfirmModal/useMigrationModal', () => ({
  __esModule: true,
  default: () => ({ runMigration: mockRunMigration, modal: null }),
}));

const page = {
  organizationId: 'org-1',
  selectedTable: { id: 'orders-id', table_name: 'orders' },
  columns: [{ Header: 'id' }, { Header: 'Title' }],
  tables: [{ id: 'users-id', table_name: 'users' }],
};

// jsdom has no pointer capture or scrolling, which Radix Select calls when it opens. External adapter, not product logic.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

describe('AddColumnForm', () => {
  const onCreate = jest.fn();
  const onCancel = jest.fn();
  let createColumn: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useTjdbStore.getState().actions.resetStore());
    createColumn = jest.spyOn(tooljetDatabaseService, 'createColumn').mockResolvedValue({ data: {} });
    render(
      <TooljetDatabaseProvider value={page as unknown as TooljetDatabaseContextValue}>
        <AddColumnForm onCreate={onCreate} onCancel={onCancel} />
      </TooljetDatabaseProvider>
    );
  });

  const nameField = () => screen.getByPlaceholderText('Enter column name');
  const addButton = () => screen.getByRole('button', { name: /^Add column$/ });
  const type = (text: string) => userEvent.type(nameField(), text);

  it('shows the fields of the design, with Add column off until the name is valid', () => {
    expect(screen.getByRole('heading', { name: 'Add column' })).toBeInTheDocument();
    expect(screen.getByText('Column name')).toBeInTheDocument();
    expect(screen.getByText('Data type')).toBeInTheDocument();
    expect(screen.getByText('Default value')).toBeInTheDocument();
    expect(screen.getByText('Don’t allow NULL values in this column.')).toBeInTheDocument();
    expect(screen.getByText('Don’t allow duplicate values in this column.')).toBeInTheDocument();
    expect(screen.getByText('Foreign key relation')).toBeInTheDocument();
    expect(screen.getByText('No relation added yet')).toBeInTheDocument();
    expect(addButton()).toBeDisabled();
  });

  describe('column name error states', () => {
    it('shows no error while the field is untouched', () => {
      expect(nameField()).toHaveAttribute('aria-invalid', 'false');
    });

    it('marks an emptied name once it was typed in', async () => {
      await type('a');
      await userEvent.clear(nameField());
      expect(nameField()).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Column name cannot be empty')).toBeInTheDocument();
    });

    it('marks a name with a character that is not allowed', async () => {
      await type('my column');
      expect(nameField()).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Column name can only contain letters, numbers and underscores')).toBeInTheDocument();
      expect(addButton()).toBeDisabled();
    });

    it('marks a name that starts with a number', async () => {
      await type('1st');
      expect(screen.getByText('Column name cannot start with a number')).toBeInTheDocument();
      expect(addButton()).toBeDisabled();
    });

    it('marks a name over 31 characters', async () => {
      await type('a'.repeat(32));
      expect(screen.getByText('Column name must be maximum 31 characters')).toBeInTheDocument();
      expect(addButton()).toBeDisabled();
    });

    it('marks a name another column already has, by exact match', async () => {
      await type('id');
      expect(nameField()).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('A column with this name already exists')).toBeInTheDocument();
      expect(addButton()).toBeDisabled();

      await userEvent.clear(nameField());
      await type('title');
      expect(nameField()).toHaveAttribute('aria-invalid', 'false');
      expect(addButton()).toBeEnabled();
    });

    it('describes the error to assistive technology', async () => {
      await type('id');
      expect(nameField()).toHaveAccessibleDescription('A column with this name already exists');
    });
  });

  it('asks for a default when not null is ticked, and takes it back once one is typed', async () => {
    await type('age');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Not null' }));
    expect(screen.getByText(/Default value is required to populate this field/)).toBeInTheDocument();
    expect(addButton()).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText('Enter value'), '0');
    expect(screen.queryByText(/Default value is required/)).not.toBeInTheDocument();
    expect(addButton()).toBeEnabled();
  });

  it('fixes the switches of a serial column and shows its default as automatic', async () => {
    await type('seq');
    await userEvent.click(screen.getByRole('combobox', { name: 'Data type' }));
    await userEvent.click(await screen.findByRole('option', { name: /serial/ }));
    expect(screen.getByRole('checkbox', { name: 'Not null' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Unique' })).toBeDisabled();
    expect(screen.getByDisplayValue('Auto-generated')).toBeDisabled();
  });

  it('keeps "Add relation" off, with the reason, until the column has a valid name', async () => {
    const addRelation = screen.getByRole('button', { name: 'Add relation' });
    expect(addRelation).toBeDisabled();
    expect(addRelation.parentElement).toHaveAttribute(
      'title',
      'Fill in column details to create a foreign key relation'
    );
    await type('owner');
    expect(addRelation).toBeEnabled();
  });

  it('relates the column itself: the source column is fixed to it, and follows a rename', async () => {
    jest.spyOn(tooljetDatabaseService, 'viewTable').mockResolvedValue({
      data: {
        result: { columns: [{ column_name: 'id', data_type: 'integer' }], foreign_keys: [], configurations: {} },
      },
    });
    await type('owner_id');
    await userEvent.click(screen.getByRole('combobox', { name: 'Data type' }));
    await userEvent.click(await screen.findByRole('option', { name: /^int\b/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Add relation' }));
    // Once a target table is chosen any other source column would be offered; this one is fixed.
    await userEvent.click(screen.getByRole('combobox', { name: 'Target table' }));
    await userEvent.click(await screen.findByRole('option', { name: 'users' }));

    const source = screen.getByRole('combobox', { name: 'Source column' });
    expect(source).toBeDisabled();
    expect(source).toHaveTextContent('owner_id');
    // The summary card is for this column; the drawer shows one relation at most.
    await userEvent.clear(nameField());
    await userEvent.type(nameField(), 'author_id');
    expect(screen.getByRole('combobox', { name: 'Source column' })).toHaveTextContent('author_id');
  });

  it('opens the confirmation and creates the column with what was entered', async () => {
    await type('age');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Unique' }));
    await userEvent.click(addButton());

    expect(mockRunMigration).toHaveBeenCalledTimes(1);
    const options = mockRunMigration.mock.calls[0][0];
    expect(options.defaultTitle).toBe('Add column "age"');
    expect(options.tableId).toBe('orders-id');
    expect(options.changes).toEqual([{ type: 'add', name: 'age', detail: 'character varying' }]);

    await options.run('add_age');
    expect(createColumn).toHaveBeenCalledWith(
      'org-1',
      'orders',
      'age',
      'character varying',
      '',
      false,
      true,
      false,
      false,
      [],
      {},
      'add_age'
    );

    options.onSuccess();
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('submits on Enter in the name field, and not while the name is invalid', async () => {
    await type('id{Enter}');
    expect(mockRunMigration).not.toHaveBeenCalled();

    await userEvent.clear(nameField());
    await type('age{Enter}');
    expect(mockRunMigration).toHaveBeenCalledTimes(1);
  });

  it('reports unsaved input once the form is touched', async () => {
    expect(hasUnsavedChanges('createColumn')).toBe(false);
    await type('a');
    await waitFor(() => expect(hasUnsavedChanges('createColumn')).toBe(true));
  });

  it('cancels through onCancel', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
