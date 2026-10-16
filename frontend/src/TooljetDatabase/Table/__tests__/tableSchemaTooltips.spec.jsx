// Schema changes start in Development only: staging and production show no add-column control at all.
// The "schema changes only in Development" tooltip explains an environment block on the controls that
// remain. A user who lacks the TJDB permission is blocked for a different reason and must not be told
// it is the environment.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import Table from '@/TooljetDatabase/Table';
import { SCHEMA_ENV_TOOLTIP } from '@/TooljetDatabase/constants';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

const COLUMNS = [
  {
    Header: 'id',
    accessor: 'id',
    dataType: 'integer',
    constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
  },
];

// The header's "+" cell; the same glyph also labels the add-row control, so address it by its own cell.
const addColumnHeader = (container) => waitFor(() => container.querySelector('th.add-icon-column'));

// The tooltip opens after a short hover delay, so "never shows" can only be asserted after waiting it out.
const waitForTooltipDelay = () => act(() => new Promise((resolve) => setTimeout(resolve, 300)));

function renderTable({ canEditTjdb, canEditSchema }) {
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableName', () =>
      HttpResponse.json({ result: { columns: [], foreign_keys: [], configurations: {} } })
    ),
    http.get('*/tooljet-db/proxy/:tableId', () => HttpResponse.json([], { headers: { 'content-range': '*/0' } }))
  );
  return render(
    <TooljetDatabaseContext.Provider
      value={{
        organizationId: 'org-1',
        tables: [],
        columns: COLUMNS,
        selectedTable: { id: 'table-1', table_name: 'orders' },
        selectedTableData: [],
        setSelectedTableData: () => {},
        setColumns: () => {},
        setConfigurations: () => {},
        setForeignKeys: () => {},
        foreignKeys: [],
        configurations: {},
        getConfigurationProperty: (_header, _property, fallback) => fallback,
        resetAll: () => {},
        handleRefetchQuery: () => {},
        loadingState: false,
        canEditTjdb,
        canEditSchema,
      }}
    >
      <Table collapseSidebar={false} />
    </TooljetDatabaseContext.Provider>
  );
}

const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };

describe('Table schema tooltips', () => {
  afterEach(() => {
    act(() => useTjdbStore.setState({ selectedEnvironment: null }));
  });

  test('should hide the add-column header when viewing a table outside Development', async () => {
    act(() => useTjdbStore.setState({ selectedEnvironment: STAGING }));
    const { container } = renderTable({ canEditTjdb: true, canEditSchema: false });
    await waitFor(() => expect(container.querySelector('[data-cy="column-menu-icon"]')).toBeInTheDocument());

    expect(container.querySelector('th.add-icon-column')).not.toBeInTheDocument();
    // The header's column separators were drawn by the "+" cell; this class tells the stylesheet to draw them itself.
    expect(container.querySelector('.tj-table-no-add-column')).toBeInTheDocument();
  });

  test('should show the add-column header when viewing a table in Development', async () => {
    const { container } = renderTable({ canEditTjdb: true, canEditSchema: true });

    expect(await addColumnHeader(container)).toBeInTheDocument();
    expect(container.querySelector('.tj-table-no-add-column')).not.toBeInTheDocument();
  });

  test('should not show the environment tooltip on the add-column header when the user lacks TJDB permission', async () => {
    const { container } = renderTable({ canEditTjdb: false, canEditSchema: false });

    await userEvent.hover(await addColumnHeader(container));

    await waitForTooltipDelay();
    expect(screen.queryByText(SCHEMA_ENV_TOOLTIP)).not.toBeInTheDocument();
  });

  test('should explain the Development-only rule on a column menu when the environment is the blocker', async () => {
    const { container } = renderTable({ canEditTjdb: true, canEditSchema: false });
    await addColumnHeader(container);

    await userEvent.hover(container.querySelector('[data-cy="column-menu-icon"]'));

    expect(await screen.findByText(SCHEMA_ENV_TOOLTIP)).toBeInTheDocument();
  });

  test('should not show the environment tooltip on a column menu when the user lacks TJDB permission', async () => {
    const { container } = renderTable({ canEditTjdb: false, canEditSchema: false });
    await addColumnHeader(container);

    await userEvent.hover(container.querySelector('[data-cy="column-menu-icon"]'));

    await waitForTooltipDelay();
    expect(screen.queryByText(SCHEMA_ENV_TOOLTIP)).not.toBeInTheDocument();
  });
});
