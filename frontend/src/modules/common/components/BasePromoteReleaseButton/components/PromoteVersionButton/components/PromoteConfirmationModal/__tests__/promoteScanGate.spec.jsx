import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// An app built in code: its security result holds Promote before anything moves.

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  return { toast };
});
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key, fallback) => fallback }) }));
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
const mockExtras = { locked: false };
jest.mock('../PromoteConfirmationExtras', () => {
  const ReactActual = jest.requireActual('react');
  // eslint-disable-next-line react/prop-types
  return ({ onLockedChange }) => {
    ReactActual.useEffect(() => onLockedChange?.(mockExtras.locked), [onLockedChange]);
    return null;
  };
});
jest.mock('@/AppBuilder/_contexts/ModuleContext', () => ({ useModuleContext: () => ({ moduleId: 'canvas' }) }));

const mockGate = { locked: false };
jest.mock('@/AppBuilder/_helpers/codeModeHooks', () => {
  const ReactActual = jest.requireActual('react');
  return {
    // eslint-disable-next-line react/prop-types
    ReleaseScanGate: ({ onLockedChange, action }) => {
      ReactActual.useEffect(() => onLockedChange?.(mockGate.locked), [onLockedChange]);
      return <div data-cy="scan-gate">gate:{action}</div>;
    },
  };
});

jest.mock('@/_services', () => ({
  gitSyncService: {},
  authenticationService: { currentSessionValue: { current_organization_id: 'org-1' } },
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
  mockGate.locked = false;
  mockExtras.locked = false;
});

it('holds Promote while the security result blocks it', async () => {
  mockGate.locked = true;
  render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
  expect(screen.getByText('gate:promote')).toBeInTheDocument();
  const button = screen.getByRole('button', { name: /Promote/ });
  await waitFor(() => expect(button).toBeDisabled());
  expect(mockState.promoteAppVersionAction).not.toHaveBeenCalled();
});

it('promotes when the security result allows it', async () => {
  render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /Promote/ }));
  expect(mockState.promoteAppVersionAction).toHaveBeenCalled();
});

it('holds Promote while a review still waits, even when the security result allows it', async () => {
  mockExtras.locked = true;
  render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
  const button = screen.getByRole('button', { name: /Promote/ });
  await waitFor(() => expect(button).toBeDisabled());
  await userEvent.click(button);
  expect(mockState.promoteAppVersionAction).not.toHaveBeenCalled();
});
