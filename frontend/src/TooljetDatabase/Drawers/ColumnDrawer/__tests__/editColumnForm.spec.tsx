import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { act, render, screen, userEvent, waitFor } from '@/test/test-utils';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { TooljetDatabaseProvider, type TooljetDatabaseContextValue } from '@/TooljetDatabase/TooljetDatabaseContext';
import { DEFAULT_VIEW, selectView, useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { hasUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';
import { EditColumnForm, type EditColumnFormProps } from '../EditColumnForm';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
);

// jsdom has no pointer capture or scrolling, which Radix Select calls when it opens. External adapter, not product logic.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1, enabled: true };

type Overrides = {
  dataType?: string;
  isNotNull?: boolean;
  isUnique?: boolean;
  isPrimaryKey?: boolean;
  columnDefault?: string | null;
};

const column = ({
  dataType = 'character varying',
  isNotNull = false,
  isUnique = false,
  isPrimaryKey = false,
  columnDefault = null,
}: Overrides = {}) => ({
  Header: 'owner',
  accessor: 'owner',
  dataType,
  column_default: columnDefault,
  constraints_type: { is_not_null: isNotNull, is_unique: isUnique, is_primary_key: isPrimaryKey },
});

const relation = {
  constraint_name: 'fk_owner',
  column_names: ['owner'],
  referenced_table_name: 'users',
  referenced_table_id: 'users-id',
  referenced_column_names: ['name'],
  on_delete: 'RESTRICT',
  on_update: 'CASCADE',
};

const byDataCy = (dataCy: string) =>
  waitFor(() => {
    const element = document.querySelector(`[data-cy="${dataCy}"]`) as HTMLElement | null;
    expect(element).toBeTruthy();
    return element as HTMLElement;
  });

const page = {
  organizationId: 'org-1',
  selectedTable: { id: 'table-1', table_name: 'orders' },
  columns: [{ Header: 'id' }, { Header: 'owner' }],
  tables: [{ id: 'users-id', table_name: 'users' }],
};

const renderForm = (
  selectedColumn: ReturnType<typeof column>,
  formProps: Partial<EditColumnFormProps> = {},
  context: Record<string, unknown> = {}
) => {
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/dependents', () =>
      HttpResponse.json({ result: { count: 0 } })
    )
  );
  act(() => useTjdbStore.setState({ environments: [DEVELOPMENT], selectedEnvironment: DEVELOPMENT }));
  const value = {
    ...page,
    handleRefetchQuery: jest.fn(),
    setForeignKeys: jest.fn(),
    setColumns: jest.fn(),
    setConfigurations: jest.fn(),
    foreignKeys: [],
    configurations: {},
    ...context,
  };
  render(
    <TooljetDatabaseProvider value={value as unknown as TooljetDatabaseContextValue}>
      <EditColumnForm column={selectedColumn} rows={[]} onClose={jest.fn()} onCancel={jest.fn()} {...formProps} />
    </TooljetDatabaseProvider>
  );
  return value;
};

const nameField = () => byDataCy('column-name-input-field') as Promise<HTMLInputElement>;
const saveButton = () => byDataCy('save-changes-button');
const checkbox = (name: string) => screen.getByRole('checkbox', { name });

describe('Edit column | Save', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  test('should show the column as stored, with Save changes off until something changes', async () => {
    renderForm(column({ isNotNull: true }));

    expect(screen.getByRole('heading', { name: 'Edit column' })).toBeInTheDocument();
    expect(await nameField()).toHaveValue('owner');
    expect(screen.getByText(/Queries and apps using this table aren’t updated automatically/)).toBeInTheDocument();
    expect(await saveButton()).toBeDisabled();
  });

  test('should enable Save when only the name of a NOT NULL column without a default changes', async () => {
    renderForm(column({ isNotNull: true }));

    await userEvent.type(await nameField(), 's');

    expect(await saveButton()).toBeEnabled();
  });

  test('should still block Save, and say why, when NOT NULL is switched on without a default', async () => {
    renderForm(column());

    await userEvent.click(checkbox('Not null'));

    expect(await saveButton()).toBeDisabled();
    expect(screen.getByText(/Default value is required to populate this field/)).toBeInTheDocument();
  });

  test('should block Save when the name is cleared, and mark the field', async () => {
    renderForm(column({ isNotNull: true }));

    await userEvent.clear(await nameField());

    expect(await saveButton()).toBeDisabled();
    expect(await nameField()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Column name cannot be empty')).toBeInTheDocument();
  });

  test('should open the migration modal on Enter after a valid rename', async () => {
    renderForm(column({ isNotNull: true }));

    await userEvent.type(await nameField(), 's');
    await userEvent.keyboard('{Enter}');

    expect(await byDataCy('migration-confirm-modal')).toBeInTheDocument();
  });

  test('should not open the migration modal on Enter while Save is disabled', async () => {
    renderForm(column({ isNotNull: true }));

    await userEvent.clear(await nameField());
    expect(await saveButton()).toBeDisabled();
    await userEvent.keyboard('{Enter}');

    expect(document.querySelector('[data-cy="migration-confirm-modal"]')).toBeNull();
  });

  test('should send the rename to the server under the stored name', async () => {
    let body: unknown;
    server.use(
      http.patch('*/tooljet-db/organizations/:organizationId/table/:tableName/column', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({});
      }),
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', () =>
        HttpResponse.json({ result: { columns: [], foreign_keys: [], configurations: {} } })
      )
    );
    const onClose = jest.fn();
    renderForm(column({ isNotNull: true }), { onClose });

    await userEvent.type(await nameField(), 's');
    await userEvent.click(await saveButton());
    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(body).toMatchObject({
      column: { column_name: 'owner', new_column_name: 'owners', data_type: 'character varying' },
    });
  });
});

describe('Edit column | column name error states', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  test('should flag a name another column already has, and clear it again', async () => {
    renderForm(column());

    const name = await nameField();
    await userEvent.clear(name);
    await userEvent.type(name, 'id');

    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('A column with this name already exists')).toBeInTheDocument();
    expect(await saveButton()).toBeDisabled();

    await userEvent.type(name, '2');
    expect(name).toHaveAttribute('aria-invalid', 'false');
    expect(await saveButton()).toBeEnabled();
  });

  test('should not flag the saved name of the column itself', async () => {
    renderForm(column());

    const name = await nameField();
    await userEvent.type(name, 'x{Backspace}');

    expect(name).toHaveAttribute('aria-invalid', 'false');
  });

  test('should flag a name with a character that is not allowed', async () => {
    renderForm(column());

    await userEvent.type(await nameField(), '-');

    expect(screen.getByText('Column name can only contain letters, numbers and underscores')).toBeInTheDocument();
    expect(await saveButton()).toBeDisabled();
  });
});

describe('Edit column | primary key and serial', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  test('should tag a primary key, and fix its type, default and constraints', async () => {
    renderForm(column({ dataType: 'integer', isPrimaryKey: true, isNotNull: true, isUnique: true }));

    expect(screen.getByText('Primary key')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Data type' })).toBeDisabled();
    expect(screen.getByText('A primary key’s type cannot be changed.')).toBeInTheDocument();
    expect(checkbox('Not null')).toBeDisabled();
    expect(checkbox('Not null')).toBeChecked();
    expect(checkbox('Unique')).toBeDisabled();
    expect(checkbox('Unique')).toBeChecked();
    expect(await byDataCy('default-value-input-field')).toBeDisabled();
  });

  test('should fix an auto-incrementing column as well, with its default read as automatic', async () => {
    renderForm(column({ dataType: 'serial', isNotNull: true }));

    expect(screen.getByRole('combobox', { name: 'Data type' })).toBeDisabled();
    expect(screen.getByText('An auto-incrementing column’s type cannot be changed.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auto-generated')).toBeDisabled();
  });
});

describe('Edit column | changing the type', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  const pick = async (label: RegExp) => {
    await userEvent.click(screen.getByRole('combobox', { name: 'Data type' }));
    await userEvent.click(await screen.findByRole('option', { name: label }));
  };

  test('should offer the stored type and what a supported cast reaches, with a note about the rest', async () => {
    renderForm(column());

    await userEvent.click(screen.getByRole('combobox', { name: 'Data type' }));

    expect(await screen.findByRole('option', { name: /varchar/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /bigint/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /jsonb/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /serial/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Not seeing the type you need/)).toBeInTheDocument();
  });

  test('should count the values that will not convert, and narrow the table to them on request', async () => {
    jest
      .spyOn(tooljetDatabaseService, 'sqlExecution')
      .mockResolvedValue({ data: { result: { data: [{ count: '4' }] } } });
    const onClose = jest.fn();
    renderForm(column(), { onClose });
    // The grid has the table's view open; the filter lands in it.
    act(() => useTjdbStore.setState({ viewTableId: 'table-1' }));

    await pick(/^int\b/);

    expect(await screen.findByText(/4 value\(s\) in this column can’t be converted/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show rows' }));

    expect(selectView(useTjdbStore.getState()).queryFilters).toEqual({
      0: { column: 'owner', operator: expect.any(String), value: expect.any(String) },
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('should say so when every value converts', async () => {
    jest
      .spyOn(tooljetDatabaseService, 'sqlExecution')
      .mockResolvedValue({ data: { result: { data: [{ count: '0' }] } } });
    renderForm(column());

    await pick(/^int\b/);

    expect(await screen.findByText(/Every value in this environment converts cleanly/)).toBeInTheDocument();
  });

  test('should send a cast that needs SQL as a required SQL step, and resend the stored type in the request', async () => {
    jest
      .spyOn(tooljetDatabaseService, 'sqlExecution')
      .mockResolvedValue({ data: { result: { data: [{ count: '0' }] } } });
    renderForm(column());

    await pick(/^int\b/);
    await userEvent.click(await saveButton());

    const modal = await byDataCy('migration-confirm-modal');
    expect(modal).toBeInTheDocument();
    expect(modal.textContent).toContain('USING "owner"::integer');
  });
});

describe('Edit column | foreign key relation', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  test('should offer to add one, with one line when there is none', () => {
    renderForm(column({ dataType: 'integer' }));

    expect(screen.getByText('Foreign key relation')).toBeInTheDocument();
    expect(screen.getByText('No relation added yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add relation' })).toBeEnabled();
  });

  test('should not offer one for a type that cannot have it, and say why', () => {
    renderForm(column({ dataType: 'boolean' }));

    const add = screen.getByRole('button', { name: 'Add relation' });
    expect(add).toBeDisabled();
    expect(add.parentElement).toHaveAttribute(
      'title',
      'Foreign key relation cannot be created for boolean type column'
    );
  });

  test('should show the stored relation as a card, hide "Add relation", and fix the type', () => {
    renderForm(column(), {}, { foreignKeys: [relation] });

    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('On update')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add relation' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Data type' })).toBeDisabled();
    expect(screen.getByText(/needs both sides changed together/)).toBeInTheDocument();
  });

  test('should keep another column’s relation out of this drawer', () => {
    renderForm(column(), {}, { foreignKeys: [{ ...relation, column_names: ['other'] }] });

    expect(screen.getByText('No relation added yet')).toBeInTheDocument();
  });
});

describe('Edit column | saved view', () => {
  const VIEW = { ...DEFAULT_VIEW, queryFilters: { 0: { column: 'owner', operator: 'eq', value: 'a' } } };

  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
    server.use(
      http.patch('*/tooljet-db/organizations/:organizationId/table/:tableName/column', () => HttpResponse.json({})),
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', () =>
        HttpResponse.json({ result: { columns: [], foreign_keys: [], configurations: {} } })
      )
    );
  });

  const seedViews = () =>
    act(() => useTjdbStore.setState({ views: { 'table-1': VIEW, 'table-2': VIEW } as never, viewTableId: 'table-1' }));

  test('should forget the view of the table once a rename is saved, since it may filter on the old name', async () => {
    renderForm(column({ isNotNull: true }));
    seedViews();

    await userEvent.type(await nameField(), 's');
    await userEvent.click(await saveButton());
    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(useTjdbStore.getState().views['table-1']).toBeUndefined());
    expect(useTjdbStore.getState().views['table-2']).toEqual(VIEW);
  });

  test('should keep the view when the column is not renamed', async () => {
    renderForm(column({ isNotNull: true }));
    seedViews();

    await userEvent.click(checkbox('Unique'));
    await userEvent.click(await saveButton());
    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(document.querySelector('[data-cy="migration-confirm-modal"]')).toBeNull());
    expect(useTjdbStore.getState().views['table-1']).toEqual(VIEW);
  });
});

describe('Edit column | unsaved input', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  test('should be clean as opened, unsaved once the name differs, clean again when typed back', async () => {
    renderForm(column({ isNotNull: true }));
    const name = await nameField();
    expect(hasUnsavedChanges('editColumn')).toBe(false);

    await userEvent.type(name, 's');
    expect(hasUnsavedChanges('editColumn')).toBe(true);

    await userEvent.type(name, '{Backspace}');
    expect(hasUnsavedChanges('editColumn')).toBe(false);
  });

  test('should be unsaved when NOT NULL is switched', async () => {
    renderForm(column());

    await userEvent.click(checkbox('Not null'));

    expect(hasUnsavedChanges('editColumn')).toBe(true);
  });

  test('should send Cancel to onCancel and leave onClose for after a save', async () => {
    const onClose = jest.fn();
    const onCancel = jest.fn();
    renderForm(column({ isNotNull: true }), { onClose, onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
