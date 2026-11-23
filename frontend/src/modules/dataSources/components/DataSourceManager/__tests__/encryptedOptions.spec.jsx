import { DataSourceManagerComponent } from '../DataSourceManager';
import { globalDatasourceService } from '@/_services';
import openaiManifest from '../../../../../../../marketplace/plugins/openai/lib/manifest.json';
import anthropicManifest from '../../../../../../../marketplace/plugins/anthropic/lib/manifest.json';
import geminiManifest from '../../../../../../../marketplace/plugins/gemini/lib/manifest.json';
import openrouterManifest from '../../../../../../../marketplace/plugins/openrouter/lib/manifest.json';

jest.mock('@/_services', () => ({
  globalDatasourceService: { create: jest.fn(), save: jest.fn() },
  authenticationService: { currentSessionValue: {} },
}));
jest.mock('@/_helpers', () => ({ canUpdateDataSource: () => true }));
jest.mock('@/_helpers/utils', () => ({
  returnDevelopmentEnv: () => ({ id: 'env-development' }),
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
  DataSourceTypes: [],
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

// Marketplace data source built from a tj:version manifest with a camelCase encrypted key
const makeMarketplaceForm = (manifest) => {
  const plugin = { id: 'openai-plugin', manifestFile: { data: manifest } };
  const props = {
    selectedDataSource: {
      name: 'openai_ai',
      kind: manifest['tj:source'].kind,
      scope: 'global',
      pluginId: plugin.id,
      plugin,
      options: { apiKey: { value: '' } },
    },
    scope: 'global',
    currentEnvironment: { id: 'env-development' },
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
  globalDatasourceService.create.mockReset().mockResolvedValue({ id: 'saved-source' });
  globalDatasourceService.save.mockReset().mockResolvedValue({});
});

const savedOptions = () => globalDatasourceService.create.mock.calls[0][0].options;

test.each([
  ['openai', openaiManifest],
  ['anthropic', anthropicManifest],
  ['gemini', geminiManifest],
  ['openrouter', openrouterManifest],
])('saving a %s data source sends apiKey flagged as encrypted', async (_kind, manifest) => {
  expect(manifest['tj:encrypted']).toContain('apiKey');
  const form = makeMarketplaceForm(manifest);
  await form.optionchanged('apiKey', 'sk-synthetic-test-key');
  form.createDataSource();
  await settled();

  expect(globalDatasourceService.create).toHaveBeenCalledTimes(1);
  expect(savedOptions()).toContainEqual(expect.objectContaining({ key: 'apiKey', encrypted: true }));
});

test('a camelCase option the manifest does not encrypt stays plain', async () => {
  const manifest = {
    ...openaiManifest,
    properties: { ...openaiManifest.properties, baseUrl: { type: 'string' } },
  };
  const form = makeMarketplaceForm(manifest);
  await form.optionchanged('apiKey', 'sk-synthetic-test-key');
  await form.optionchanged('baseUrl', 'https://example.test');
  form.createDataSource();
  await settled();

  expect(savedOptions()).toContainEqual(expect.objectContaining({ key: 'baseUrl', encrypted: undefined }));
  expect(savedOptions()).toContainEqual(expect.objectContaining({ key: 'apiKey', encrypted: true }));
});
