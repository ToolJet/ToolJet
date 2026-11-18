// Renaming an existing NOT NULL column that has no default must be saveable: the column already
// holds a value in every row, so the "NOT NULL needs a default" rule only applies when NOT NULL is
// being switched on. And Enter must obey the same disabled state as the Save button.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import EditColumnForm from '@/TooljetDatabase/Forms/EditColumnForm';
import { DEFAULT_VIEW, useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { hasUnsavedChanges } from '@/TooljetDatabase/_stores/unsavedChanges';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1, enabled: true };

const column = (isNotNull) => ({
  Header: 'owner',
  accessor: 'owner',
  dataType: 'character varying',
  data_type: 'character varying',
  column_default: null,
  constraints_type: { is_not_null: isNotNull, is_unique: false, is_primary_key: false },
});

const byDataCy = (dataCy) =>
  waitFor(() => {
    const element = document.querySelector(`[data-cy="${dataCy}"]`);
    expect(element).toBeTruthy();
    return element;
  });

const renderForm = (selectedColumn, formProps = {}) => {
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/dependents', () =>
      HttpResponse.json({ result: { count: 0 } })
    )
  );
  act(() => useTjdbStore.setState({ environments: [DEVELOPMENT], selectedEnvironment: DEVELOPMENT }));
  render(
    <TooljetDatabaseContext.Provider
      value={{
        organizationId: 'org-1',
        selectedTable: { id: 'table-1', table_name: 'orders' },
        handleRefetchQuery: jest.fn(),
        setForeignKeys: jest.fn(),
        foreignKeys: [],
        configurations: {},
        setConfigurations: jest.fn(),
        tables: [],
      }}
    >
      <EditColumnForm
        initiator="EditColumnForm"
        onClose={jest.fn()}
        selectedColumn={selectedColumn}
        setColumns={jest.fn()}
        rows={[]}
        referencedColumnDetails={[]}
        setReferencedColumnDetails={jest.fn()}
        {...formProps}
      />
    </TooljetDatabaseContext.Provider>
  );
};

const saveButton = () => byDataCy('save-changes-button');

describe('Edit column Save', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  test('should enable Save when only the name of a NOT NULL column without a default changes', async () => {
    renderForm(column(true));

    await userEvent.type(await byDataCy('column-name-input-field'), 's');

    expect(await saveButton()).toBeEnabled();
  });

  test('should still block Save when NOT NULL is switched on without a default', async () => {
    renderForm(column(false));

    const notNullSwitch = screen.getByText('NOT NULL').closest('.row').querySelector('input[type="checkbox"]');
    await userEvent.click(notNullSwitch);

    expect(await saveButton()).toBeDisabled();
  });

  test('should block Save when the name is cleared', async () => {
    renderForm(column(true));

    await userEvent.clear(await byDataCy('column-name-input-field'));

    expect(await saveButton()).toBeDisabled();
  });

  test('should open the migration modal on Enter after a valid rename', async () => {
    renderForm(column(true));

    await userEvent.type(await byDataCy('column-name-input-field'), 's');
    await userEvent.keyboard('{Enter}');

    expect(await byDataCy('migration-confirm-modal')).toBeInTheDocument();
  });

  test('should not open the migration modal on Enter while Save is disabled', async () => {
    renderForm(column(true));

    await userEvent.clear(await byDataCy('column-name-input-field'));
    expect(await saveButton()).toBeDisabled();
    await userEvent.keyboard('{Enter}');

    expect(document.querySelector('[data-cy="migration-confirm-modal"]')).toBeNull();
  });
});

describe('Edit column saved view', () => {
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
    act(() => useTjdbStore.setState({ views: { 'table-1': VIEW, 'table-2': VIEW }, viewTableId: 'table-1' }));

  test('should forget the view of the table once a rename is saved, since it may filter on the old name', async () => {
    renderForm(column(true));
    seedViews();

    await userEvent.type(await byDataCy('column-name-input-field'), 's');
    await userEvent.click(await saveButton());
    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(useTjdbStore.getState().views['table-1']).toBeUndefined());
    expect(useTjdbStore.getState().views['table-2']).toEqual(VIEW);
  });

  test('should keep the view when the column is not renamed', async () => {
    renderForm(column(true));
    seedViews();

    const notNullSwitch = screen.getByText('NOT NULL').closest('.row').querySelector('input[type="checkbox"]');
    await userEvent.click(notNullSwitch);
    await userEvent.click(await saveButton());
    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(document.querySelector('[data-cy="migration-confirm-modal"]')).toBeNull());
    expect(useTjdbStore.getState().views['table-1']).toEqual(VIEW);
  });
});

describe('Edit column unsaved input', () => {
  beforeEach(() => {
    act(() => useTjdbStore.getState().actions.resetStore());
  });

  test('should be clean as opened, unsaved once the name differs, clean again when typed back', async () => {
    renderForm(column(true));
    const name = await byDataCy('column-name-input-field');
    expect(hasUnsavedChanges('editColumn')).toBe(false);

    await userEvent.type(name, 's');
    expect(hasUnsavedChanges('editColumn')).toBe(true);

    await userEvent.type(name, '{Backspace}');
    expect(hasUnsavedChanges('editColumn')).toBe(false);
  });

  test('should be unsaved when NOT NULL is switched', async () => {
    renderForm(column(false));

    const notNullSwitch = screen.getByText('NOT NULL').closest('.row').querySelector('input[type="checkbox"]');
    await userEvent.click(notNullSwitch);

    expect(hasUnsavedChanges('editColumn')).toBe(true);
  });

  test('should send Cancel to onCancel and leave onClose for after a save', async () => {
    const onClose = jest.fn();
    const onCancel = jest.fn();
    renderForm(column(true), { onClose, onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
