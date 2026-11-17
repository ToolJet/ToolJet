// The TJDB page feeds the header's environment select from inside TooljetDatabaseProvider, below the layout Header.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act, userEvent } from '@/test/test-utils';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import TjdbHeaderEnvironment from '@/TooljetDatabase/HeaderEnvironment';
import HeaderEnvironmentSelect from '@/_ui/Header/HeaderEnvironmentSelect';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import { useHeaderEnvironmentStore } from '@/_stores/headerEnvironmentStore';
import { useLicenseStore } from '@/_stores/licenseStore';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1, enabled: true };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2, enabled: true };
const ORDERS = {
  id: 'table-1',
  table_name: 'orders',
  environments: [DEVELOPMENT, STAGING].map((env) => ({ environment_id: env.id, has_relation: true })),
};

const contextValue = (overrides) => ({
  organizationId: 'org-1',
  tables: [ORDERS],
  setTables: () => {},
  selectedTable: { id: ORDERS.id, table_name: ORDERS.table_name },
  tablesLoaded: true,
  ...overrides,
});

// Same shape as production: the select lives in the Header, a sibling of the provider, not inside it.
const renderHeaderAndPage = (value) =>
  render(
    <>
      <header>
        <HeaderEnvironmentSelect />
      </header>
      <TooljetDatabaseContext.Provider value={value}>
        <TjdbHeaderEnvironment />
      </TooljetDatabaseContext.Provider>
    </>
  );

const trigger = () => screen.queryByRole('button', { name: /environment$/i });

describe('TJDB environment select in the page Header', () => {
  let migrationRequests;

  beforeEach(() => {
    migrationRequests = [];
    window.sessionStorage.clear();
    server.use(
      http.get('*/license/access', () => HttpResponse.json({ multiEnvironment: true })),
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/migrations', ({ params }) => {
        migrationRequests.push(params.tableId);
        return HttpResponse.json({
          result: {
            migrations: [
              {
                id: 'm-1',
                kind: 'structured',
                name: 'Create table "orders"',
                description: null,
                migration_number: 1,
                created_at: '2026-10-15T11:24:00.000Z',
                sql: 'CREATE TABLE orders ();',
              },
            ],
            environments: [
              { environment_id: DEVELOPMENT.id, applied_migration_ids: ['m-1'] },
              { environment_id: STAGING.id, applied_migration_ids: [] },
            ],
          },
        });
      })
    );
    act(() => {
      useTjdbStore.getState().actions.resetStore();
      useTjdbStore.setState({ environments: [DEVELOPMENT, STAGING], selectedEnvironment: DEVELOPMENT });
      useHeaderEnvironmentStore.getState().setSelect(null);
      useLicenseStore.setState({ featureAccess: {}, featuresLoaded: false });
    });
  });

  test('should show the current environment and the migration it is at', async () => {
    renderHeaderAndPage(contextValue());

    expect(trigger()).toHaveTextContent('Development');
    await waitFor(() => expect(trigger()).toHaveTextContent('0001'));
  });

  test('should switch the environment from the menu', async () => {
    renderHeaderAndPage(contextValue());

    await userEvent.click(trigger());
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: /Staging/ }));

    expect(useTjdbStore.getState().selectedEnvironment).toEqual(STAGING);
  });

  test('should list the open table’s migrations in the history drawer', async () => {
    renderHeaderAndPage(contextValue());

    act(() => useTjdbStore.getState().actions.openMigrationHistory());

    await waitFor(() =>
      expect(document.querySelector('.migration-history-drawer__row-name')).toHaveTextContent('Create table "orders"')
    );
    expect(migrationRequests).toEqual([ORDERS.id]);
  });

  test('should not open the drawer when no table is open', () => {
    renderHeaderAndPage(contextValue({ selectedTable: {} }));

    act(() => useTjdbStore.getState().actions.openMigrationHistory());

    expect(document.querySelector('.migration-history-drawer__row-name')).not.toBeInTheDocument();
  });

  test('should close the drawer again', async () => {
    renderHeaderAndPage(contextValue());
    act(() => useTjdbStore.getState().actions.openMigrationHistory());
    await waitFor(() => expect(document.querySelector('.migration-history-drawer__row-name')).toBeInTheDocument());

    act(() => useTjdbStore.getState().actions.closeMigrationHistory());

    await waitFor(() => expect(useTjdbStore.getState().isMigrationHistoryOpen).toBe(false));
  });

  test('should hide the select when the workspace has no tables and Development is open', () => {
    renderHeaderAndPage(contextValue({ tables: [], selectedTable: {} }));

    expect(trigger()).not.toBeInTheDocument();
  });

  // Create table is disabled outside Development, so the select is the only way back.
  test('should keep the select for an empty workspace on staging', async () => {
    act(() => useTjdbStore.setState({ selectedEnvironment: STAGING }));

    renderHeaderAndPage(contextValue({ tables: [], selectedTable: {} }));
    await userEvent.click(trigger());

    expect(await screen.findByRole('menuitemcheckbox', { name: /Development/ })).toBeInTheDocument();
  });

  test('should keep the select until the table list has loaded', () => {
    renderHeaderAndPage(contextValue({ tables: [], selectedTable: {}, tablesLoaded: false }));

    expect(trigger()).toBeInTheDocument();
  });

  test('should skip the migrations request when no table is open', async () => {
    renderHeaderAndPage(contextValue({ selectedTable: {} }));
    await userEvent.click(trigger());

    await screen.findByRole('menuitemcheckbox', { name: /Staging/ });
    expect(migrationRequests).toEqual([]);
  });

  test('should not show a select for a single-environment workspace', () => {
    act(() => useTjdbStore.setState({ environments: [DEVELOPMENT] }));

    renderHeaderAndPage(contextValue());

    expect(trigger()).not.toBeInTheDocument();
  });

  test('should remove the select from the header when the page unmounts', () => {
    const { unmount } = renderHeaderAndPage(contextValue());
    expect(trigger()).toBeInTheDocument();

    unmount();

    expect(useHeaderEnvironmentStore.getState().select).toBeNull();
  });
});
