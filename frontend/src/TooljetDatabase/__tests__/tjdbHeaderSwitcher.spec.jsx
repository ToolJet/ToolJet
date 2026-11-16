// The page Header (outside TooljetDatabaseProvider) hosts the environment switcher. The switcher
// must still read the page's context, so the page portals it into the Header's slot.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act, userEvent } from '@/test/test-utils';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import EnvironmentSwitcher from '@/TooljetDatabase/EnvironmentSwitcher';
import { HeaderSlotPortal, TJDB_HEADER_SLOT_ID } from '@/TooljetDatabase/HeaderSlotPortal';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
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

const PILL = '[data-cy="tjdb-environment-switcher-button"]';
const HISTORY_BUTTON = '[data-cy="tjdb-migration-history-button"]';

const contextValue = (overrides) => ({
  organizationId: 'org-1',
  tables: [ORDERS],
  setTables: () => {},
  selectedTable: { id: ORDERS.id, table_name: ORDERS.table_name },
  tablesLoaded: true,
  ...overrides,
});

// Same shape as production: the slot lives in the Header, a sibling of the provider, not inside it.
const renderHeaderAndPage = (value) =>
  render(
    <>
      <header>
        <div id={TJDB_HEADER_SLOT_ID} />
      </header>
      <TooljetDatabaseContext.Provider value={value}>
        <HeaderSlotPortal>
          <EnvironmentSwitcher />
        </HeaderSlotPortal>
      </TooljetDatabaseContext.Provider>
    </>
  );

describe('TJDB environment switcher hosted in the page Header', () => {
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
      useLicenseStore.setState({ featureAccess: {}, featuresLoaded: false });
    });
  });

  test('should list the open table’s migrations in the history drawer', async () => {
    const { container } = renderHeaderAndPage(contextValue());

    await userEvent.click(await screen.findByTitle('Migration history'));

    await waitFor(() =>
      expect(document.querySelector('.migration-history-drawer__row-name')).toHaveTextContent('Create table "orders"')
    );
    expect(migrationRequests).toEqual([ORDERS.id]);
    expect(container.querySelector(PILL)).toBeInTheDocument();
  });

  test('should hide the switcher and history button when the workspace has no tables and Development is open', () => {
    const { container } = renderHeaderAndPage(contextValue({ tables: [], selectedTable: {} }));

    expect(container.querySelector(PILL)).not.toBeInTheDocument();
    expect(container.querySelector(HISTORY_BUTTON)).not.toBeInTheDocument();
  });

  // Create table is disabled outside Development, so the pill is the only way back.
  test('should keep the switcher but drop the history button for an empty workspace on staging', () => {
    act(() => useTjdbStore.setState({ selectedEnvironment: STAGING }));

    const { container } = renderHeaderAndPage(contextValue({ tables: [], selectedTable: {} }));

    expect(container.querySelector(PILL)).toBeInTheDocument();
    expect(container.querySelector(HISTORY_BUTTON)).not.toBeInTheDocument();
  });

  test('should keep the switcher until the table list has loaded', () => {
    const { container } = renderHeaderAndPage(contextValue({ tables: [], selectedTable: {}, tablesLoaded: false }));

    expect(container.querySelector(PILL)).toBeInTheDocument();
  });

  test('should drop the history button when no table is open', () => {
    const { container } = renderHeaderAndPage(contextValue({ selectedTable: {} }));

    expect(container.querySelector(PILL)).toBeInTheDocument();
    expect(container.querySelector(HISTORY_BUTTON)).not.toBeInTheDocument();
    expect(migrationRequests).toEqual([]);
  });
});
