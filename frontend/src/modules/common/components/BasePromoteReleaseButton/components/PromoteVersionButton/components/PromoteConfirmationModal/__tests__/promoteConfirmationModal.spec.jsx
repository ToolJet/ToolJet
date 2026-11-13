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

describe('the Promote tables button in the banner', () => {
  const observations = { id: 't-obs', name: 'observations', needed_by_app: false, depends_on: [] };
  const actions = { id: 't-act', name: 'actions', needed_by_app: true, depends_on: ['t-obs'] };
  const sites = { id: 't-sit', name: 'sites', needed_by_app: true, depends_on: [] };

  beforeEach(() => {
    mockServices.getMissingTablesForPromote.mockResolvedValue({ tables: [observations, sites, actions] });
  });

  it('shows what each table needs and what needs it, with one button for all of them', async () => {
    render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
    const alert = await screen.findByRole('alert');
    expect(await screen.findAllByRole('button', { name: 'Promote tables' })).toHaveLength(1);
    expect(alert).toHaveTextContent('Needed by actions');
    expect(alert).toHaveTextContent('Promotes observations first');
  });

  it('says Promote table when only one table is listed', async () => {
    mockServices.getMissingTablesForPromote.mockResolvedValue({ tables: [sites] });
    render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
    expect(await screen.findByRole('button', { name: 'Promote table' })).toBeInTheDocument();
  });

  it('promotes every listed table in list order without the app, and drops the banner once the server lists none', async () => {
    render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
    const button = await screen.findByRole('button', { name: 'Promote tables' });
    mockServices.getMissingTablesForPromote.mockResolvedValue({ tables: [] });
    await userEvent.click(button);
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(mockServices.promoteTable.mock.calls).toEqual([
      ['org-1', 't-obs', 'env-dev'],
      ['org-1', 't-sit', 'env-dev'],
      ['org-1', 't-act', 'env-dev'],
    ]);
    expect(screen.getByRole('button', { name: /^Promote$/ })).toBeInTheDocument();
    expect(mockState.promoteAppVersionAction).not.toHaveBeenCalled();
  });

  it('holds the footer button and Cancel while tables are being promoted, so nothing runs alongside', async () => {
    let finishPromote;
    mockServices.promoteTable.mockReturnValue(new Promise((resolve) => (finishPromote = resolve)));
    const onClose = jest.fn();
    render(<PromoteConfirmationModal data={data} onClose={onClose} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Promote tables' }));

    expect(screen.getByRole('button', { name: /Promote tables and app/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Promote tables' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).not.toHaveBeenCalled();

    finishPromote({});
    await waitFor(() => expect(screen.getByRole('button', { name: /Promote tables and app/ })).toBeEnabled());
  });

  it('keeps the tables in the banner and says why when one cannot be promoted', async () => {
    mockServices.promoteTable
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ error: { message: 'no access to staging' } });
    render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Promote tables' }));
    expect(await screen.findByText(/Couldn't promote sites: no access to staging/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Promote tables' })).toBeInTheDocument();
  });
});

describe('in the workflow editor, which keeps its app under the workflow slot', () => {
  const canvasApp = mockState.appStore;

  afterEach(() => {
    mockState.appStore = canvasApp;
  });

  it('asks which tables the workflow needs when the dialog opens', async () => {
    mockState.appStore = {
      modules: { canvas: { app: { creationMode: 'DEFAULT' } }, workflow: { app: { appId: 'wf-1' } } },
    };
    mockServices.getMissingTablesForPromote.mockResolvedValue({
      tables: [{ id: 't-1', name: 'expenses', needed_by_app: true, depends_on: [] }],
    });
    render(<PromoteConfirmationModal data={data} onClose={jest.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('expenses');
    expect(mockServices.getMissingTablesForPromote).toHaveBeenCalledWith('wf-1', 'v-1');
  });
});
