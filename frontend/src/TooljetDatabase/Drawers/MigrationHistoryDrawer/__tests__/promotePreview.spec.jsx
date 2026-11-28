// "Run in <env>" opens a preview of what is about to be applied: the pending migrations with their SQL, a data-loss
// warning, a backup button, and Cancel / Run. The history tabs share the drawer's width equally.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, act, waitFor, userEvent } from '@/test/test-utils';
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
const STAGING = { id: 'env-staging', name: 'staging', priority: 2, enabled: true };
const PRODUCTION = { id: 'env-production', name: 'production', priority: 3, enabled: true };
const MIGRATIONS = [1, 2].map((number) => ({
  id: `m${number}`,
  migration_number: number,
  name: `Migration ${number}`,
  sql: `SELECT ${number};`,
  created_at: '2026-10-12T00:00:00Z',
}));

function renderDrawer({ preview = MIGRATIONS, relations = [DEVELOPMENT, STAGING, PRODUCTION] } = {}) {
  server.use(
    http.get('*/license/access', () => HttpResponse.json({ multiEnvironment: true })),
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/promote/preview', () =>
      HttpResponse.json({ result: { missing_migrations: preview } })
    )
  );
  act(() => {
    useTjdbStore.getState().actions.resetStore();
    useTjdbStore.setState({ selectedEnvironment: DEVELOPMENT });
    useLicenseStore.setState({ featureAccess: {}, featuresLoaded: false });
  });
  return render(
    <MigrationHistoryDrawer
      isOpen
      onClose={() => {}}
      migrations={MIGRATIONS}
      environments={[
        { environment_id: DEVELOPMENT.id, applied_migration_ids: ['m1', 'm2'] },
        { environment_id: STAGING.id, applied_migration_ids: [] },
      ]}
      allEnvironments={[DEVELOPMENT, STAGING, PRODUCTION]}
      relationsByEnvironment={relations.map((env) => ({ environment_id: env.id, has_relation: true }))}
      organizationId="org-1"
      selectedTable={{ id: 'table-1', table_name: 'orders' }}
      refetchMigrations={() => {}}
    />
  );
}

const openPreview = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Run in staging' }));
  await screen.findByText('Run migrations in staging');
};

describe('History tabs', () => {
  test('should give every environment tab a cell of the same width, usable or not', async () => {
    renderDrawer({ relations: [DEVELOPMENT] });

    await screen.findByText('Migration history');
    const cells = ['Development', 'Staging', 'Production'].map(
      (name) => screen.getByRole('radio', { name }).parentElement
    );
    cells.forEach((cell) => expect(cell).toHaveClass('tw-flex-1'));
  });
});

describe('Promote preview', () => {
  test('should count the pending migrations and show each one with its SQL', async () => {
    renderDrawer();
    await openPreview();

    expect(await screen.findByText('2 migrations')).toBeInTheDocument();
    expect(screen.getByText('Migration 1')).toBeInTheDocument();
    expect(screen.getByText('Migration 2')).toBeInTheDocument();
    expect(screen.getByText('SELECT 1;')).toBeInTheDocument();
    expect(screen.getByText('SELECT 2;')).toBeInTheDocument();
  });

  test('should say "1 migration" for a single pending migration', async () => {
    renderDrawer({ preview: [MIGRATIONS[0]] });
    await openPreview();

    expect(await screen.findByText('1 migration')).toBeInTheDocument();
  });

  test('should warn about data loss and offer a backup', async () => {
    renderDrawer();
    await openPreview();

    expect(await screen.findByText(/Migrations can cause loss of data/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download backup' })).toBeEnabled();
  });

  test('should go back to the history from Back and from Cancel', async () => {
    renderDrawer();
    await openPreview();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText('Migration history')).toBeInTheDocument();

    await openPreview();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Migration history')).toBeInTheDocument();
  });

  test('should not run when nothing is pending', async () => {
    renderDrawer({ preview: [] });
    await openPreview();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Run in staging' })).toBeDisabled());
  });
});
