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
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';

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

const renderForm = (selectedColumn) => {
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
