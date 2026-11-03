import { DataSourceManagerComponent } from '../DataSourceManager';
import { globalDatasourceService } from '@/_services';

jest.mock('@/_services', () => ({
  globalDatasourceService: { create: jest.fn(), save: jest.fn() },
  authenticationService: { currentSessionValue: {} },
}));
jest.mock('@/_helpers', () => ({ canUpdateDataSource: () => true }));
jest.mock('@/_helpers/utils', () => ({
  returnDevelopmentEnv: () => ({ id: 'lab-development' }),
}));
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
jest.mock('@/modules/common/components/DataSourceComponents', () => ({
  DataSourceTypes: [{ kind: 'labsource', options: { token: { encrypted: true } } }],
}));
jest.mock('@/_hoc/withRouter', () => ({
  withRouter: (component) => component,
}));
jest.mock('react-i18next', () => ({
  withTranslation: () => (component) => component,
}));
jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));
const makeForm = (overrides = {}) => {
  const props = {
    selectedDataSource: {
      name: 'Lab equipment',
      kind: 'labsource',
      scope: 'global',
      options: { token: { value: '' } },
      ...overrides,
    },
    scope: 'global',
    currentEnvironment: { id: 'lab-development' },
    hideModal: jest.fn(),
    dataSourcesChanged: jest.fn(),
    setGlobalDataSourceStatus: jest.fn(),
    t: (_key, fallback) => fallback,
  };
  const form = new DataSourceManagerComponent(props);
  form.setState = (changes, callback) => {
    Object.assign(form.state, changes);
    callback?.();
  };
  return form;
};

beforeEach(() => {
  globalDatasourceService.create.mockReset().mockResolvedValue({ id: 'saved-lab-source' });
  globalDatasourceService.save.mockReset().mockResolvedValue({});
});

test('a draft creates once on Save with the entered credentials and environment', async () => {
  const form = makeForm();
  expect(globalDatasourceService.create).not.toHaveBeenCalled();
  await form.optionchanged('token', 'synthetic-lab-token');
  form.createDataSource();
  await settled();
  expect(globalDatasourceService.create).toHaveBeenCalledTimes(1);
  expect(globalDatasourceService.create).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Lab equipment',
      kind: 'labsource',
      scope: 'global',
      environment_id: 'lab-development',
      options: [{ key: 'token', value: 'synthetic-lab-token', encrypted: true }],
    })
  );
  expect(form.props.dataSourcesChanged).toHaveBeenCalledWith(false, {
    id: 'saved-lab-source',
  });
  expect(form.props.hideModal).toHaveBeenCalled();
  expect(form.props.setGlobalDataSourceStatus).toHaveBeenLastCalledWith({
    isSaving: false,
    isEditing: false,
  });
});

test('a marketplace draft keeps its installed plugin identity on creation', async () => {
  const plugin = {
    id: 'lab-plugin',
    manifestFile: {
      data: {
        source: { kind: 'labsource', options: { token: { encrypted: true } } },
      },
    },
  };
  const form = makeForm({ pluginId: plugin.id, plugin });
  await form.optionchanged('token', 'synthetic-provider-token');
  form.createDataSource();
  await settled();
  expect(globalDatasourceService.create.mock.calls[0][0].plugin_id).toBe('lab-plugin');
});

test('failed creation keeps the populated form open and permits a successful retry', async () => {
  globalDatasourceService.create.mockRejectedValueOnce({
    error: 'Synthetic save failure',
  });
  const form = makeForm();
  await form.optionchanged('token', 'synthetic-retry-token');
  form.createDataSource();
  await settled();
  expect(form.props.hideModal).not.toHaveBeenCalled();
  expect(form.state.options.token.value).toBe('synthetic-retry-token');
  expect(form.state.isSaving).toBe(false);
  form.createDataSource();
  await settled();
  expect(form.props.dataSourcesChanged).toHaveBeenCalledTimes(1);
});

test('editing an existing source uses save instead of creating a duplicate', async () => {
  const form = makeForm({ id: 'existing-lab-source' });
  await form.optionchanged('token', 'synthetic-updated-token');
  form.createDataSource();
  await settled();
  expect(globalDatasourceService.create).not.toHaveBeenCalled();
  expect(globalDatasourceService.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'existing-lab-source' }));
});
