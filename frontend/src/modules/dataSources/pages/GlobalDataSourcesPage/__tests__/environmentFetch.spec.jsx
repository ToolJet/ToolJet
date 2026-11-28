import React from 'react';
import { render, act, waitFor } from '@/test/test-utils';
import { globalDatasourceService } from '@/_services';
import { toast } from 'react-hot-toast';
import { BreadCrumbContext } from '@/App/BreadCrumbContext';
import { GlobalDataSourcesPage } from '../index';

jest.mock('@/_services', () => ({
  globalDatasourceService: {
    getAll: jest.fn(() => Promise.resolve({ data_sources: [] })),
    getDataSourceByEnvironmentId: jest.fn(),
  },
  appEnvironmentService: {
    getAllEnvironments: jest.fn(() =>
      Promise.resolve({
        environments: [
          { id: 'env-development', name: 'development', priority: 1, enabled: true },
          { id: 'env-staging', name: 'staging', priority: 2, enabled: true },
          { id: 'env-production', name: 'production', priority: 3, enabled: true },
        ],
      })
    ),
  },
  authenticationService: { currentSessionValue: { admin: true, current_organization_id: 'workspace-1' } },
  licenseService: {
    getFeatureAccess: jest.fn(() => Promise.resolve({ multiEnvironment: true, isLicenseValid: true })),
  },
  dataSourceFolderService: { getFolders: jest.fn(() => Promise.resolve({ folders: [] })) },
}));
jest.mock('@/_ui/Layout', () => ({ children }) => <>{children}</>);
jest.mock('@white-label/whiteLabelling', () => ({
  fetchAndSetWindowTitle: jest.fn(),
  pageTitles: { DATA_SOURCES: 'Data sources' },
}));
jest.mock('@/_stores/workspaceBranchesStore', () => {
  const state = { activeBranchId: null, isInitialized: false, actions: { setHasUnsyncedDatasources: () => {} } };
  return { useWorkspaceBranchesStore: (select) => select(state) };
});
jest.mock('@/_stores/notificationsStore', () => ({ subscribeLiveNotifications: () => () => {} }));
jest.mock('@/modules/common/helpers/utils', () => ({
  ...jest.requireActual('@/modules/common/helpers/utils'),
  fetchEdition: () => 'ee',
}));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

// The page's own child is replaced by a probe that reads what the page provides.
let page;
jest.mock('../../../components/GlobalDataSources', () => ({
  GlobalDataSources: () => {
    const { GlobalDataSourcesContext: Context } = jest.requireActual('../index');
    page = require('react').useContext(Context);
    return null;
  },
}));

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1, enabled: true };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2, enabled: true };
const PRODUCTION = { id: 'env-production', name: 'production', priority: 3, enabled: true };
const LIST_SOURCE = { id: 'sheets-source', options: { access_type: { value: 'list' } } };
const STAGING_SOURCE = { id: 'sheets-source', options: { access_type: { value: 'write' } } };
const PRODUCTION_SOURCE = { id: 'sheets-source', options: { access_type: { value: 'read' } } };
const OTHER_SOURCE = { id: 'other-source', options: { access_type: { value: 'read' } } };

// Each environment request waits until the test answers it, so answers can come in any order.
// Requests for the same environment queue up; answer/fail settles the oldest one.
let pendingAnswers = {};
const answer = (environmentId, source) => act(async () => pendingAnswers[environmentId].shift().resolve(source));
const fail = (environmentId) =>
  act(async () => pendingAnswers[environmentId].shift().reject(new Error('network down')));

// What a tab click does: open the tab, then ask for that tab's data.
const clickTab = (environment) =>
  act(() => {
    page.setCurrentEnvironment(environment);
    page.fetchDataSourceByEnvironment('sheets-source', environment.id);
  });

// What a sidebar click does: open the data source with its list data in the first environment.
const openFromSidebar = (source) =>
  act(() => {
    page.setSelectedDataSource(source);
    page.setCurrentEnvironment(DEVELOPMENT);
  });

beforeEach(async () => {
  toast.error.mockClear();
  pendingAnswers = {};
  globalDatasourceService.getDataSourceByEnvironmentId.mockImplementation(
    (_dataSourceId, environmentId) =>
      new Promise((resolve, reject) => {
        (pendingAnswers[environmentId] ||= []).push({ resolve, reject });
      })
  );
  render(
    <BreadCrumbContext.Provider value={{ updateSidebarNAV: () => {} }}>
      <GlobalDataSourcesPage />
    </BreadCrumbContext.Provider>
  );
  await waitFor(() => expect(page?.environments).toHaveLength(3));
  openFromSidebar(LIST_SOURCE);
});

describe('Data sources page: loading one environment', () => {
  it('keeps the open tab data when an older tab answers last', async () => {
    clickTab(STAGING);
    clickTab(PRODUCTION);

    await answer(PRODUCTION.id, PRODUCTION_SOURCE);
    await answer(STAGING.id, STAGING_SOURCE);

    expect(page.currentEnvironment.id).toBe(PRODUCTION.id);
    expect(page.selectedDataSource.options).toEqual(PRODUCTION_SOURCE.options);
    expect(page.environmentLoading).toBe(false);
  });

  it('keeps the loader on when an older tab answers first', async () => {
    clickTab(STAGING);
    clickTab(PRODUCTION);

    await answer(STAGING.id, STAGING_SOURCE);

    expect(page.environmentLoading).toBe(true);
    expect(page.selectedDataSource?.options).not.toEqual(STAGING_SOURCE.options);

    await answer(PRODUCTION.id, PRODUCTION_SOURCE);

    expect(page.selectedDataSource.options).toEqual(PRODUCTION_SOURCE.options);
    expect(page.environmentLoading).toBe(false);
  });

  it('removes the loader and goes back to the shown tab when a request fails', async () => {
    clickTab(STAGING);
    await answer(STAGING.id, STAGING_SOURCE);

    clickTab(PRODUCTION);
    await fail(PRODUCTION.id);

    expect(page.environmentLoading).toBe(false);
    expect(page.currentEnvironment.id).toBe(STAGING.id);
    expect(page.selectedDataSource.options).toEqual(STAGING_SOURCE.options);
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('production'));
  });

  it('keeps the newly opened data source when the previous one answers late', async () => {
    clickTab(STAGING);
    openFromSidebar(OTHER_SOURCE);

    await answer(STAGING.id, STAGING_SOURCE);

    expect(page.selectedDataSource.id).toBe(OTHER_SOURCE.id);
  });

  it('keeps the newly opened data source when the previous one answers late for the same tab', async () => {
    clickTab(STAGING);
    await answer(STAGING.id, STAGING_SOURCE);
    clickTab(DEVELOPMENT);
    openFromSidebar(OTHER_SOURCE);

    await answer(DEVELOPMENT.id, { id: 'sheets-source', options: { access_type: { value: 'development' } } });

    expect(page.selectedDataSource).toEqual(OTHER_SOURCE);
  });

  it('shows the newly opened data source at once, without waiting for the previous one', async () => {
    clickTab(STAGING);
    openFromSidebar(OTHER_SOURCE);

    expect(page.environmentLoading).toBe(false);
  });

  it('ignores a failed request for a data source that is no longer open', async () => {
    clickTab(PRODUCTION);
    await answer(PRODUCTION.id, PRODUCTION_SOURCE);
    clickTab(STAGING);
    openFromSidebar(OTHER_SOURCE);

    await fail(STAGING.id);

    expect(page.currentEnvironment.id).toBe(DEVELOPMENT.id);
    expect(page.selectedDataSource.id).toBe(OTHER_SOURCE.id);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('ignores a late answer after going back to the same data source in another tab', async () => {
    clickTab(STAGING);
    openFromSidebar(OTHER_SOURCE);
    openFromSidebar(LIST_SOURCE);

    await answer(STAGING.id, STAGING_SOURCE);

    expect(page.currentEnvironment.id).toBe(DEVELOPMENT.id);
    expect(page.selectedDataSource.options).toEqual(LIST_SOURCE.options);
    expect(page.environmentLoading).toBe(false);
  });

  it('ignores an older tab that fails after a newer tab loaded', async () => {
    clickTab(STAGING);
    clickTab(PRODUCTION);
    await answer(PRODUCTION.id, PRODUCTION_SOURCE);

    await fail(STAGING.id);

    expect(page.currentEnvironment.id).toBe(PRODUCTION.id);
    expect(page.selectedDataSource.options).toEqual(PRODUCTION_SOURCE.options);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('ignores an older request for the same tab that fails while a newer one is loading', async () => {
    clickTab(STAGING);
    clickTab(PRODUCTION);
    clickTab(STAGING);

    await fail(STAGING.id);

    expect(toast.error).not.toHaveBeenCalled();
    expect(page.currentEnvironment.id).toBe(STAGING.id);
    expect(page.environmentLoading).toBe(true);

    await answer(STAGING.id, STAGING_SOURCE);

    expect(page.selectedDataSource.options).toEqual(STAGING_SOURCE.options);
    expect(page.environmentLoading).toBe(false);
  });
});
