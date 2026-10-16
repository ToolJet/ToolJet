// The TJDB dashboard acts on the environment the user is viewing: the export picker starts there,
// the choice survives a reload, and the promote preview's backup downloads the environment about
// to receive the migrations.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { useTjdbStore } from '@/TooljetDatabase/_stores/tjdbStore';
import ExportCsvModal from '@/TooljetDatabase/ExportCsvModal';
import MigrationHistoryDrawer from '@/TooljetDatabase/Drawers/MigrationHistoryDrawer';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1 };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2 };
const ENVIRONMENTS = [DEVELOPMENT, STAGING];
const BOTH_HAVE_RELATION = ENVIRONMENTS.map((env) => ({ environment_id: env.id, has_relation: true }));

function serveTable(csvRequests = []) {
  server.use(
    http.get('*/license/access', () => HttpResponse.json({ multiEnvironment: true })),
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/migrations', () =>
      HttpResponse.json({ result: { migrations: [], environments: [] } })
    ),
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/promote/preview', () =>
      HttpResponse.json({ result: { missing_migrations: [] } })
    ),
    http.get('*/tooljet-db/proxy/:tableId', ({ request }) => {
      const environmentId = new URL(request.url).searchParams.get('environment_id');
      if (request.headers.get('accept') === 'text/csv') {
        csvRequests.push(environmentId);
        return new HttpResponse('id\n1\n', { headers: { 'content-type': 'text/csv' } });
      }
      return HttpResponse.json([], { headers: { 'content-range': '0-0/0' } });
    })
  );
}

describe('TJDB environment selection', () => {
  beforeEach(() => {
    window.URL.createObjectURL = jest.fn(() => 'blob:csv');
    window.URL.revokeObjectURL = jest.fn();
    window.sessionStorage.clear();
  });

  test('should preselect the environment being viewed in the CSV export picker', async () => {
    serveTable();
    act(() => useTjdbStore.setState({ selectedEnvironment: STAGING }));

    render(
      <ExportCsvModal
        show
        tableName="orders"
        tableId="table-1"
        organizationId="org-1"
        environments={ENVIRONMENTS}
        relationsByEnvironment={BOTH_HAVE_RELATION}
        onCancel={() => {}}
      />
    );

    const staging = await screen.findByRole('radio', { name: /staging/ });
    expect(staging).toBeChecked();
  });

  test('should restore the selected environment after a reload', async () => {
    server.use(http.get('*/app-environments', () => HttpResponse.json({ environments: ENVIRONMENTS })));
    const { switchEnvironment, resetStore, loadEnvironments } = useTjdbStore.getState().actions;

    await act(() => switchEnvironment(STAGING));
    act(() => resetStore());
    await act(() => loadEnvironments());

    expect(useTjdbStore.getState().selectedEnvironment).toEqual(STAGING);
  });

  test('should download a backup of the environment receiving the migrations', async () => {
    const csvRequests = [];
    serveTable(csvRequests);

    render(
      <MigrationHistoryDrawer
        isOpen
        onClose={() => {}}
        migrations={[{ id: 'm1', migration_number: 1, sql: '', created_at: '2026-10-12T00:00:00Z' }]}
        environments={[
          { environment_id: DEVELOPMENT.id, applied_migration_ids: ['m1'] },
          { environment_id: STAGING.id, applied_migration_ids: [] },
        ]}
        allEnvironments={ENVIRONMENTS}
        relationsByEnvironment={BOTH_HAVE_RELATION}
        organizationId="org-1"
        selectedTable={{ id: 'table-1', table_name: 'orders' }}
        refetchMigrations={() => {}}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Run in staging' }));
    await userEvent.click(await screen.findByRole('button', { name: /Download backup/ }));

    await waitFor(() => expect(csvRequests).toEqual([STAGING.id]));
  });

  describe('promote button', () => {
    function renderHistory(developmentApplied, stagingApplied) {
      serveTable();
      render(
        <MigrationHistoryDrawer
          isOpen
          onClose={() => {}}
          migrations={['m1', 'm2', 'm3'].map((id, index) => ({
            id,
            migration_number: index + 1,
            sql: '',
            created_at: '2026-10-12T00:00:00Z',
          }))}
          environments={[
            { environment_id: DEVELOPMENT.id, applied_migration_ids: developmentApplied },
            { environment_id: STAGING.id, applied_migration_ids: stagingApplied },
          ]}
          allEnvironments={ENVIRONMENTS}
          relationsByEnvironment={BOTH_HAVE_RELATION}
          organizationId="org-1"
          selectedTable={{ id: 'table-1', table_name: 'orders' }}
          refetchMigrations={() => {}}
        />
      );
    }

    test('should offer promotion when the next environment is missing a migration, even if it has as many applied', async () => {
      // Same count (2 and 2), different sets: staging lacks m1 and has m3 development has not applied.
      renderHistory(['m1', 'm2'], ['m2', 'm3']);

      expect(await screen.findByRole('button', { name: 'Run in staging' })).toBeInTheDocument();
    });

    test('should not offer promotion when the next environment has every migration the active one has', async () => {
      renderHistory(['m1'], ['m1', 'm2']);

      await screen.findByText('Migration history');
      expect(screen.queryByRole('button', { name: 'Run in staging' })).not.toBeInTheDocument();
    });
  });
});
