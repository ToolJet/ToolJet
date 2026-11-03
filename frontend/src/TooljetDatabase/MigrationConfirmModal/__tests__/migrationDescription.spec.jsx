// A raw SQL migration can carry a description next to its title, so the history can say why the
// SQL step exists. Only the SQL step records it; structured changes have no description field.
import '@/test/setupMsw';
import React, { useEffect } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import useMigrationModal from '@/TooljetDatabase/MigrationConfirmModal/useMigrationModal';

function MigrationHarness({ options }) {
  const { runMigration, modal } = useMigrationModal();
  useEffect(() => runMigration(options), []); // eslint-disable-line react-hooks/exhaustive-deps
  return modal;
}

// The modal is a react-bootstrap portal; its controls are addressed by their data-cy, like the Cypress suite.
const byDataCy = (dataCy) =>
  waitFor(() => {
    const element = document.querySelector(`[data-cy="${dataCy}"]`);
    expect(element).toBeTruthy();
    return element;
  });

function renderModal(options, rawSqlBodies = []) {
  server.use(
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/dependents', () =>
      HttpResponse.json({ result: { count: 0 } })
    ),
    http.post('*/tooljet-db/organizations/:organizationId/table/:tableId/migrations/sql', async ({ request }) => {
      rawSqlBodies.push(await request.json());
      return HttpResponse.json({ result: {} });
    })
  );
  render(
    <TooljetDatabaseContext.Provider value={{ organizationId: 'org-1', tables: [] }}>
      <MigrationHarness options={{ run: () => Promise.resolve({}), tableId: 'table-1', changes: [], ...options }} />
    </TooljetDatabaseContext.Provider>
  );
}

describe('Migration description', () => {
  test('should record the description with the raw SQL step', async () => {
    const rawSqlBodies = [];
    renderModal({ showSqlEditor: true, initialSql: 'UPDATE "{{self}}" SET status = 1;' }, rawSqlBodies);

    await userEvent.type(await byDataCy('migration-confirm-title-input'), 'Backfill status');
    await userEvent.type(await byDataCy('migration-confirm-description-input'), 'Old rows had no status');
    await userEvent.click(document.querySelector('[data-cy="migration-confirm-run"]'));

    await waitFor(() =>
      expect(rawSqlBodies).toEqual([
        expect.objectContaining({ name: 'Backfill status', description: 'Old rows had no status' }),
      ])
    );
  });

  test('should not offer a description when the change has no SQL step', async () => {
    renderModal({ showSqlEditor: false });

    await byDataCy('migration-confirm-title-input');
    expect(document.querySelector('[data-cy="migration-confirm-description-input"]')).toBeNull();
  });
});
