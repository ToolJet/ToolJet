// "New migration" in the history drawer is a hand-written SQL migration: the SQL is the whole change.
// Running it empty used to report success while recording nothing.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import MigrationHistoryDrawer from '@/TooljetDatabase/Drawers/MigrationHistoryDrawer';
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

// The drawer and the modal are portals; their controls are addressed by data-cy, like the Cypress suite.
const byDataCy = (dataCy) =>
  waitFor(() => {
    const element = document.querySelector(`[data-cy="${dataCy}"]`);
    expect(element).toBeTruthy();
    return element;
  });

describe('New migration from the history drawer', () => {
  let rawSqlBodies;
  let refetchMigrations;

  beforeEach(() => {
    rawSqlBodies = [];
    refetchMigrations = jest.fn();
    server.use(
      http.get('*/license/access', () => HttpResponse.json({ multiEnvironment: true })),
      http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/dependents', () =>
        HttpResponse.json({ result: { count: 0 } })
      ),
      http.post('*/tooljet-db/organizations/:organizationId/table/:tableId/migrations/sql', async ({ request }) => {
        rawSqlBodies.push(await request.json());
        return HttpResponse.json({ result: {} });
      })
    );
    act(() => {
      useTjdbStore.getState().actions.resetStore();
      useLicenseStore.setState({ featureAccess: {}, featuresLoaded: false });
    });
    render(
      <TooljetDatabaseContext.Provider value={{ organizationId: 'org-1', tables: [] }}>
        <MigrationHistoryDrawer
          isOpen
          onClose={() => {}}
          migrations={[]}
          environments={[{ environment_id: DEVELOPMENT.id, applied_migration_ids: [] }]}
          allEnvironments={[DEVELOPMENT]}
          relationsByEnvironment={[{ environment_id: DEVELOPMENT.id, has_relation: true }]}
          organizationId="org-1"
          selectedTable={{ id: 'table-1', table_name: 'orders' }}
          refetchMigrations={refetchMigrations}
        />
      </TooljetDatabaseContext.Provider>
    );
  });

  test('should open the modal with the SQL editor ready and not marked optional', async () => {
    await userEvent.click(await byDataCy('new-migration-button'));

    await byDataCy('migration-confirm-sql-editor');
    const sqlLabel = [...document.querySelectorAll('.migration-confirm-modal .form-label')].find((label) =>
      label.textContent.startsWith('SQL')
    );
    expect(sqlLabel).toHaveTextContent(/^SQL$/);
  });

  test('should not report success or record a migration when the SQL is empty', async () => {
    await userEvent.click(await byDataCy('new-migration-button'));
    await userEvent.type(await byDataCy('migration-confirm-title-input'), 'Backfill status');
    await userEvent.click(await byDataCy('migration-confirm-run'));

    expect(await byDataCy('migration-confirm-error')).toHaveTextContent(/requires the SQL step/i);
    expect(rawSqlBodies).toEqual([]);
    expect(refetchMigrations).not.toHaveBeenCalled();
    expect(document.querySelector('[data-cy="migration-confirm-modal"]')).toBeInTheDocument();
  });
});
