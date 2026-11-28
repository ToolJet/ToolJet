import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataSourceManagerComponent } from '../DataSourceManager';

jest.mock('@/_services', () => ({
  globalDatasourceService: { create: jest.fn(), save: jest.fn() },
  datasourceService: {},
  pluginsService: { findAll: () => Promise.resolve({ data: [] }) },
  libraryAppService: {},
  authenticationService: { currentSessionValue: {} },
}));
jest.mock('@/_helpers', () => ({ canUpdateDataSource: () => true }));
jest.mock('@/_helpers/appUtils', () => ({ getSvgIcon: () => null }));
jest.mock('@/_components', () => ({
  ConfirmDialog: () => null,
  ToolTip: () => null,
}));
jest.mock('@/_stores/appVersionStore', () => ({
  useAppVersionStore: { getState: () => ({}) },
}));
jest.mock('@/_stores/dataSourcesStore', () => ({
  useDataSourcesStore: jest.fn(),
}));
jest.mock('@/_hooks/useGlobalDatasourceUnsavedChanges', () => () => ({}));
jest.mock('@/LicenseTooltip', () => ({ LicenseTooltip: () => null }));
jest.mock('../TestConnection', () => ({ TestConnection: () => null }));
jest.mock('../MultiEnvTabs', () => () => null);
jest.mock('../SampleDataSourceBody', () => () => null);
// The plugin form is replaced by one plain box that reads the Client ID the same way the OAuth form does.
jest.mock('@/modules/common/components/DataSourceComponents', () => ({
  DataSourceTypes: [{ kind: 'labsheets', options: {} }],
  SourceComponents: {},
  SourceComponent: ({ options }) => (
    <input data-testid="client-id" value={options?.client_id?.value} onChange={() => {}} />
  ),
}));
jest.mock('@/_hoc/withRouter', () => ({
  withRouter: (component) => component,
}));
jest.mock('react-i18next', () => ({
  withTranslation: () => (component) => component,
  useTranslation: () => ({ t: (_key, fallback) => fallback }),
}));
jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const DEVELOPMENT = { id: 'env-development', name: 'development', priority: 1, enabled: true };
const STAGING = { id: 'env-staging', name: 'staging', priority: 2, enabled: true };
const PRODUCTION = { id: 'env-production', name: 'production', priority: 3, enabled: true };

// One saved data source; each environment object is what the server returns for that environment.
const sourceIn = (options) => ({
  id: 'sheets-source',
  name: 'Sheets',
  kind: 'labsheets',
  scope: 'global',
  options,
});
const DEVELOPMENT_SOURCE = sourceIn({ auth_type: { value: 'oauth2' }, client_id: { value: 'DEV-CLIENT-ID' } });
const STAGING_SOURCE = sourceIn({ auth_type: { value: 'oauth2' } });
const PRODUCTION_SOURCE = sourceIn({ auth_type: { value: 'oauth2' } });

const baseProps = {
  scope: 'global',
  showDataSourceManagerModal: true,
  environments: [DEVELOPMENT, STAGING, PRODUCTION],
  hideModal: jest.fn(),
  dataSourcesChanged: jest.fn(),
  setGlobalDataSourceStatus: jest.fn(),
  handleActions: (action) => action(),
  environmentChanged: jest.fn(),
  t: (_key, fallback) => fallback,
};

const FormAt = ({ environment, source, loading }) => (
  <DataSourceManagerComponent
    {...baseProps}
    currentEnvironment={environment}
    selectedDataSource={source}
    environmentLoading={loading}
  />
);

// The page first shows the loader for the new tab, then hands over that tab's data.
const switchTo = (rerender, environment, previousSource, nextSource) => {
  rerender(<FormAt environment={environment} source={previousSource} loading />);
  rerender(<FormAt environment={environment} source={nextSource} loading={false} />);
};

// The form draws only after the plugin list loads.
const openInDevelopment = async () => {
  const view = render(<FormAt environment={DEVELOPMENT} source={DEVELOPMENT_SOURCE} loading={false} />);
  await screen.findByTestId('client-id');
  return view;
};

describe('Data source form: switching environments', () => {
  it('shows an empty Client ID in Staging when only Development has one', async () => {
    const { rerender } = await openInDevelopment();
    expect(screen.getByTestId('client-id').value).toBe('DEV-CLIENT-ID');

    switchTo(rerender, STAGING, DEVELOPMENT_SOURCE, STAGING_SOURCE);

    expect(screen.getByTestId('client-id').value).toBe('');
  });

  it('shows an empty Client ID in Production when coming straight from Development', async () => {
    const { rerender } = await openInDevelopment();

    switchTo(rerender, PRODUCTION, DEVELOPMENT_SOURCE, PRODUCTION_SOURCE);

    expect(screen.getByTestId('client-id').value).toBe('');
  });

  it('shows the Development Client ID again when coming back to Development', async () => {
    const { rerender } = await openInDevelopment();
    switchTo(rerender, STAGING, DEVELOPMENT_SOURCE, STAGING_SOURCE);

    switchTo(rerender, DEVELOPMENT, STAGING_SOURCE, DEVELOPMENT_SOURCE);

    expect(screen.getByTestId('client-id').value).toBe('DEV-CLIENT-ID');
  });
});
