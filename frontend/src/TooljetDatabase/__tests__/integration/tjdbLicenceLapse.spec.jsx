// After a multi-environment licence lapse the server still lists staging and production, flagged
// `enabled: false` (the App Builder greys those out the same way). TJDB must keep Development
// reachable, lock the other environments, and move a user who was on one back to Development.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import EnvironmentSwitcher from '@/TooljetDatabase/EnvironmentSwitcher';
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
const LAPSED_STAGING = { id: 'env-staging', name: 'staging', priority: 2, enabled: false };
const LAPSED_ENVIRONMENTS = [DEVELOPMENT, LAPSED_STAGING];
const BOTH_HAVE_RELATION = LAPSED_ENVIRONMENTS.map((env) => ({ environment_id: env.id, has_relation: true }));

// The sparkle the App Builder's environment toggle puts on a plan-locked environment.
const UPGRADE_ICON = '[data-cy="enterprise-gradient-sm-icon"]';

const serveLapsedLicence = () =>
  server.use(
    http.get('*/license/access', () => HttpResponse.json({ multiEnvironment: false })),
    http.get('*/tooljet-db/organizations/:organizationId/table/:tableId/migrations', () =>
      HttpResponse.json({ result: { migrations: [], environments: [] } })
    )
  );

describe('TJDB after a multi-environment licence lapse', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    act(() => {
      useTjdbStore.getState().actions.resetStore();
      useLicenseStore.setState({ featureAccess: {}, featuresLoaded: false });
    });
  });

  test('should open on Development when the last-viewed environment is no longer licensed', async () => {
    server.use(http.get('*/app-environments', () => HttpResponse.json({ environments: LAPSED_ENVIRONMENTS })));
    window.sessionStorage.setItem('tjdb-selected-environment-id', LAPSED_STAGING.id);

    await act(() => useTjdbStore.getState().actions.loadEnvironments());

    expect(useTjdbStore.getState().selectedEnvironment).toEqual(DEVELOPMENT);
  });

  test('should lock the unlicensed environment in the switcher and keep Development selectable', async () => {
    serveLapsedLicence();
    act(() => useTjdbStore.setState({ environments: LAPSED_ENVIRONMENTS, selectedEnvironment: DEVELOPMENT }));

    render(
      <TooljetDatabaseContext.Provider
        value={{ organizationId: 'org-1', tables: [], setTables: () => {}, selectedTable: {} }}
      >
        <EnvironmentSwitcher />
      </TooljetDatabaseContext.Provider>
    );
    await userEvent.click(screen.getByRole('button', { name: /development/i }));

    const staging = await screen.findByRole('button', { name: /staging/i });
    const development = document.querySelector('[data-cy="development-environment-option"]');
    expect(staging).toBeDisabled();
    expect(development).toBeEnabled();
    expect(staging.querySelector(UPGRADE_ICON)).toBeInTheDocument();
    expect(development.querySelector(UPGRADE_ICON)).not.toBeInTheDocument();
  });

  describe.each([
    ['the environment list already flags it', LAPSED_ENVIRONMENTS],
    // The list was loaded before the lapse; only the live licence verdict knows.
    ['the environment list is stale', [DEVELOPMENT, { ...LAPSED_STAGING, enabled: true }]],
  ])('migration history drawer when %s', (_name, allEnvironments) => {
    test('should keep the Development tab usable and lock the others', async () => {
      serveLapsedLicence();
      act(() => useTjdbStore.setState({ environments: allEnvironments, selectedEnvironment: DEVELOPMENT }));

      render(
        <MigrationHistoryDrawer
          isOpen
          onClose={() => {}}
          migrations={[]}
          environments={[]}
          allEnvironments={allEnvironments}
          relationsByEnvironment={BOTH_HAVE_RELATION}
          organizationId="org-1"
          selectedTable={{ id: 'table-1', table_name: 'orders' }}
          refetchMigrations={() => {}}
        />
      );

      // The licence verdict arrives after open; wait for it before judging either tab.
      await waitFor(() => expect(useLicenseStore.getState().featuresLoaded).toBe(true));
      const staging = screen.getByRole('button', { name: 'Staging' });
      const development = screen.getByRole('button', { name: 'Development' });
      expect(staging).toBeDisabled();
      expect(development).toBeEnabled();
      expect(staging.querySelector(UPGRADE_ICON)).toBeInTheDocument();
      expect(development.querySelector(UPGRADE_ICON)).not.toBeInTheDocument();
    });
  });
});
