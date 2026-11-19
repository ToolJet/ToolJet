// The history drawer lists each migration as a timeline row: number, title, the description when the server sends one
// (baseline rows, recorded from a table that pre-dates environments, carry a derived one), date, and its SQL on request.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, act, userEvent } from '@/test/test-utils';
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

const migration = (overrides) => ({
  id: 'm-1',
  kind: 'baseline',
  name: 'Create table "orders"',
  description: null,
  migration_number: 1,
  created_at: '2026-10-15T11:24:00.000Z',
  sql: null,
  ...overrides,
});

const renderDrawer = (migrations) =>
  render(
    <MigrationHistoryDrawer
      isOpen
      onClose={() => {}}
      migrations={migrations}
      environments={[{ environment_id: DEVELOPMENT.id, applied_migration_ids: migrations.map((m) => m.id) }]}
      allEnvironments={[DEVELOPMENT]}
      relationsByEnvironment={[{ environment_id: DEVELOPMENT.id, has_relation: true }]}
      organizationId="org-1"
      selectedTable={{ id: 'table-1', table_name: 'orders' }}
      refetchMigrations={() => {}}
    />
  );

describe('MigrationHistoryDrawer migration rows', () => {
  beforeEach(() => {
    server.use(http.get('*/license/access', () => HttpResponse.json({ multiEnvironment: true })));
    act(() => {
      useTjdbStore.getState().actions.resetStore();
      useLicenseStore.setState({ featureAccess: {}, featuresLoaded: false });
    });
  });

  test('should show each migration with its number, title and date', () => {
    renderDrawer([migration({ kind: 'structured', sql: 'CREATE TABLE orders ();' })]);

    expect(screen.getByText('0001')).toBeInTheDocument();
    expect(screen.getByText('Create table "orders"')).toBeInTheDocument();
    expect(screen.getByText(/Oct 15, 2026/)).toBeInTheDocument();
  });

  test('should show a baseline row’s derived description under its title', () => {
    renderDrawer([migration({ description: 'Recorded from the existing table. No SQL was run.' })]);

    expect(screen.getByText('Create table "orders"')).toBeInTheDocument();
    expect(screen.getByText('Recorded from the existing table. No SQL was run.')).toBeInTheDocument();
  });

  test('should show no description line when the migration has none', () => {
    renderDrawer([migration({ kind: 'structured', description: null })]);

    expect(screen.queryByTestId('migration-timeline-item-description')).not.toBeInTheDocument();
  });

  test('should list the newest migration first and tag it as the latest', () => {
    renderDrawer([migration(), migration({ id: 'm-2', migration_number: 2, name: 'Add column "tag"' })]);

    const rows = screen.getAllByTestId('migration-timeline-item');
    expect(rows[0]).toHaveTextContent('0002');
    expect(rows[0]).toHaveTextContent('Latest');
    expect(rows[1]).toHaveTextContent('0001');
  });

  test('should open a migration’s SQL from its View SQL button', async () => {
    renderDrawer([migration({ kind: 'structured', sql: 'CREATE TABLE orders ();' })]);

    await userEvent.click(screen.getByRole('button', { name: 'View SQL' }));

    expect(screen.getByText('CREATE TABLE orders ();')).toBeInTheDocument();
  });
});
