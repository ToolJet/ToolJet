// When the SQL step is the change itself (a type-change cast, a hand-written migration), confirming
// with it empty must not run anything or record a migration. The editor opens straight away.
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

function renderModal(options) {
  const rawSqlBodies = [];
  const run = jest.fn(() => Promise.resolve({}));
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
      <MigrationHarness options={{ run, tableId: 'table-1', changes: [], showSqlEditor: true, ...options }} />
    </TooljetDatabaseContext.Provider>
  );
  return { run, rawSqlBodies };
}

describe('Migration modal with a required SQL step', () => {
  test('should open the SQL editor without a prefill', async () => {
    renderModal({ sqlRequired: true });

    expect(await byDataCy('migration-confirm-sql-editor')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="migration-confirm-add-migration"]')).toBeNull();
  });

  test('should refuse to run, and record nothing, when the SQL is empty', async () => {
    const { run, rawSqlBodies } = renderModal({ sqlRequired: true });

    await userEvent.type(await byDataCy('migration-confirm-title-input'), 'Backfill status');
    await userEvent.click(await byDataCy('migration-confirm-run'));

    expect(await byDataCy('migration-confirm-error')).toHaveTextContent(/requires the SQL step/i);
    expect(run).not.toHaveBeenCalled();
    expect(rawSqlBodies).toEqual([]);
  });

  test('should run and record the migration when the SQL is given', async () => {
    const { run, rawSqlBodies } = renderModal({
      sqlRequired: true,
      initialSql: 'UPDATE "{{self}}" SET status = 1;',
    });

    await userEvent.type(await byDataCy('migration-confirm-title-input'), 'Backfill status');
    await userEvent.click(await byDataCy('migration-confirm-run'));

    await waitFor(() => expect(rawSqlBodies).toEqual([expect.objectContaining({ name: 'Backfill status' })]));
    expect(run).toHaveBeenCalledTimes(1);
  });

  // The SQL step stays an optional add-on for structured changes; the opt-in must not leak to them.
  test('should keep the SQL step optional and collapsed when it is not required', async () => {
    renderModal({});

    expect(await byDataCy('migration-confirm-add-migration')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="migration-confirm-sql-editor"]')).toBeNull();
  });
});
