// The history drawer shows each migration's title and, when the server sends one, a description.
// Baseline rows (recorded from a table that pre-dates environments) carry a derived one.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, act } from '@/test/test-utils';
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

  test('should show the description under the title when the migration has one', () => {
    renderDrawer([migration({ description: 'Recorded from the existing table. No SQL was run.' })]);

    expect(screen.getByText('Create table "orders"')).toBeInTheDocument();
    expect(screen.getByText('Recorded from the existing table. No SQL was run.')).toBeInTheDocument();
  });

  test('should show no description line when the migration has none', () => {
    const { container } = renderDrawer([migration({ kind: 'structured', description: null })]);

    expect(screen.getByText('Create table "orders"')).toBeInTheDocument();
    expect(container.querySelector('.migration-history-drawer__row-description')).not.toBeInTheDocument();
  });
});
