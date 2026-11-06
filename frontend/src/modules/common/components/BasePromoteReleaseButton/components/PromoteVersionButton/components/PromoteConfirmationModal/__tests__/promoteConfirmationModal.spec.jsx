import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// "Promote tables and app" moves the tables first, then the app. A failed app step must say so in the dialog, with
// what already moved.

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  return { toast };
});
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key, fallback) => fallback }) }));
jest.mock('@/_helpers/routes', () => ({ getPrivateRoute: () => '/database' }));
jest.mock('@/_styles/versions.scss', () => ({}), { virtual: true });
jest.mock('@/_ui/Icon/solidIcons/ArrowRight', () => () => null);
jest.mock('@/_ui/AppButton/AppButton', () => ({
  // eslint-disable-next-line react/prop-types
  ButtonSolid: ({ children, onClick, disabled, isLoading, ...rest }) => (
    <button type="button" onClick={onClick} disabled={disabled || isLoading} data-cy={rest['data-cy']}>
      {children}
    </button>
  ),
}));
jest.mock('../PromoteConfirmationExtras', () => () => null);
jest.mock('@/AppBuilder/_contexts/ModuleContext', () => ({ useModuleContext: () => ({ moduleId: 'canvas' }) }));

const mockServices = {
  getMissingTablesForPromote: jest.fn(),
  promoteTable: jest.fn(),
};
jest.mock('@/_services', () => ({
  gitSyncService: {},
  authenticationService: { currentSessionValue: { current_organization_id: 'org-1' } },
  tooljetDatabaseService: { promoteTable: (...args) => mockServices.promoteTable(...args) },
  appVersionService: { getMissingTablesForPromote: (...args) => mockServices.getMissingTablesForPromote(...args) },
}));

const mockState = {
  currentVersionId: 'v-1',
  releasedVersionId: null,
  selectedVersion: { id: 'v-1', name: 'v1' },
  developmentVersions: [{ id: 'v-1', name: 'v1' }],
  appStore: { modules: { canvas: { app: { appId: 'app-1', creationMode: 'DEFAULT' } } } },
  isEditorOverlayOpen: false,
  promoteAppVersionAction: jest.fn(),
  debugger: { log: jest.fn() },
};
jest.mock('@/AppBuilder/_stores/store', () => {
  const useStore = (selector) => selector(mockState);
  useStore.getState = () => mockState;
  return { __esModule: true, default: useStore };
});

// eslint-disable-next-line import/first
import PromoteConfirmationModal from '../PromoteConfirmationModal';

const data = { current: { id: 'env-dev', name: 'development' }, target: { id: 'env-stg', name: 'staging' } };

beforeEach(() => {
  jest.clearAllMocks();
  mockServices.getMissingTablesForPromote.mockResolvedValue({ tables: [{ id: 't-1', name: 'expenses' }] });
  mockServices.promoteTable.mockResolvedValue({});
});

it('says in the dialog that the tables moved and the app did not, and why', async () => {
  mockState.promoteAppVersionAction.mockImplementation((_id, _ok, fail) =>
    fail({ error: "This version can't be promoted yet. It has not been checked yet." })
  );
  render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
  await userEvent.click(await screen.findByRole('button', { name: /Promote tables and app/ }));
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent("The tables are in Staging, but the app wasn't promoted");
  expect(alert).toHaveTextContent('Promoted: expenses');
  expect(alert).toHaveTextContent("This version can't be promoted yet. It has not been checked yet.");
  expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
});

it('promotes and closes when both steps go through', async () => {
  const onClose = jest.fn();
  mockState.promoteAppVersionAction.mockImplementation((_id, ok) => ok({}));
  render(<PromoteConfirmationModal data={data} onClose={onClose} />);
  await userEvent.click(await screen.findByRole('button', { name: /Promote tables and app/ }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(mockServices.promoteTable).toHaveBeenCalledWith('org-1', 't-1', 'env-dev');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
