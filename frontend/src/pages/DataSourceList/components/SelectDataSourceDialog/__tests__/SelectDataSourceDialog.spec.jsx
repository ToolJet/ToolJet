import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SelectDataSourceDialog from '../index';

const mockCreate = jest.fn();

jest.mock('@/modules/common/components/DataSourceComponents', () => ({
  DataBaseSources: [
    { name: 'MySQL', kind: 'mysql' },
    { name: 'PostgreSQL', kind: 'postgresql' },
  ],
  ApiSources: [{ name: 'REST API', kind: 'restapi' }],
  CloudStorageSources: [{ name: 'AWS S3', kind: 's3' }],
  AiSources: [{ name: 'Gemini', kind: 'gemini' }],
  getCommonlyUsedDataSources: () => [{ name: 'PostgreSQL', kind: 'postgresql' }],
}));
// The shared lucide dynamic-icon mock throws for any `isLucid` Button with the installed lucide version.
jest.mock('@/components/ui/Button/Button', () => ({
  Button: ({ children, onClick, disabled, 'aria-label': ariaLabel }) => (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));
jest.mock('@/_helpers/appUtils', () => ({ getSvgIcon: () => <svg /> }));
jest.mock('@/_services/plugins.service', () => ({
  pluginsService: { findAll: jest.fn(() => Promise.resolve({ data: [] })) },
}));
jest.mock('@/_services/globalDatasource.service', () => ({
  globalDatasourceService: { create: (...args) => mockCreate(...args) },
}));
jest.mock('@/_services/authentication.service', () => ({
  authenticationService: { currentSessionValue: { admin: true } },
}));
jest.mock('@/_helpers/global-datasources', () => ({ canCreateDataSource: () => true }));
jest.mock('@/_ui/WorkspaceBranchDropdown/SwitchBranchModal', () => ({ WorkspaceSwitchBranchModal: () => null }));
jest.mock('@/modules/common/helpers/utils', () => ({ fetchEdition: () => 'ee' }));
jest.mock('@/_helpers/utils', () => ({ checkIfToolJetCloud: () => false }));
jest.mock('@/_helpers/gitSyncLicense', () => ({ isGitSyncLicenseInvalid: () => false }));
// The real stores pull in the whole App Builder; these cover only what the dialog reads.
jest.mock('@/_stores/appDataStore', () => ({
  useAppDataStore: (selector) => selector({ metadata: { installed_version: '3.0.0' } }),
}));
jest.mock('@/_stores/licenseStore', () => ({ useLicenseStore: (selector) => selector({ featureAccess: {} }) }));
jest.mock('@/_stores/workspaceBranchesStore', () => {
  const state = { isGitSyncConfigured: false, isInitialized: false, currentBranch: null, actions: {} };
  const useWorkspaceBranchesStore = (selector) => selector(state);
  useWorkspaceBranchesStore.getState = () => state;
  return { useWorkspaceBranchesStore };
});

const renderDialog = (props = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onOpenChange = jest.fn();
  const onCreated = jest.fn();
  render(
    <QueryClientProvider client={client}>
      <SelectDataSourceDialog open onOpenChange={onOpenChange} onCreated={onCreated} {...props} />
    </QueryClientProvider>
  );
  return { onOpenChange, onCreated };
};

describe('SelectDataSourceDialog', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    Element.prototype.scrollIntoView = jest.fn();
  });

  test('lists each section with its card count', async () => {
    renderDialog();

    expect(await screen.findByRole('heading', { name: 'Popular (1)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Databases (2)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "API's (1)" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cloud storage (1)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI (1)' })).toBeInTheDocument();
  });

  test('search keeps matching cards, drops empty sections and disables their pills', async () => {
    renderDialog();
    await screen.findByRole('heading', { name: 'Databases (2)' });

    await userEvent.type(screen.getByLabelText('Search data sources'), 'mysql');

    expect(screen.getByRole('heading', { name: 'Databases (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^AI/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Databases' })).toBeEnabled();
  });

  test('shows an empty state when nothing matches', async () => {
    renderDialog();
    await screen.findByRole('heading', { name: 'Databases (2)' });

    await userEvent.type(screen.getByLabelText('Search data sources'), 'zzzz');

    expect(screen.getByText('No datasources found')).toBeInTheDocument();
    expect(screen.getByText(/matching “zzzz”/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore marketplace' })).toBeInTheDocument();
    // Pills stay enabled in this state, per design.
    expect(screen.getByRole('button', { name: 'Databases' })).toBeEnabled();
  });

  test('Request new datasource calls the handler from the no-results state', async () => {
    const onRequestDataSource = jest.fn();
    renderDialog({ onRequestDataSource });
    await screen.findByRole('heading', { name: 'Databases (2)' });

    await userEvent.type(screen.getByLabelText('Search data sources'), 'zzzz');
    await userEvent.click(screen.getByRole('button', { name: 'Request new datasource' }));

    expect(onRequestDataSource).toHaveBeenCalledTimes(1);
  });

  test('a pill scrolls its section into view and becomes pressed', async () => {
    renderDialog();
    const heading = await screen.findByRole('heading', { name: 'Databases (2)' });

    await userEvent.click(screen.getByRole('button', { name: 'Databases' }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(Element.prototype.scrollIntoView.mock.instances[0]).toBe(heading.closest('section'));
    expect(screen.getByRole('button', { name: 'Databases' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('Connect creates the data source, then closes and reports it', async () => {
    mockCreate.mockResolvedValue({ id: 'ds-1' });
    const { onOpenChange, onCreated } = renderDialog();
    const section = (await screen.findByRole('heading', { name: 'Databases (2)' })).closest('section');

    await userEvent.click(within(section).getByRole('button', { name: 'Connect MySQL' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 'ds-1' }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'mysql', kind: 'mysql', scope: 'global' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('a failed create keeps the dialog open', async () => {
    mockCreate.mockRejectedValue({ error: 'nope' });
    const { onOpenChange, onCreated } = renderDialog();
    const section = (await screen.findByRole('heading', { name: 'Databases (2)' })).closest('section');

    await userEvent.click(within(section).getByRole('button', { name: 'Connect MySQL' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(onCreated).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
