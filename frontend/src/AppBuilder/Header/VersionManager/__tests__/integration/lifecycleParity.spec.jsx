import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import config from 'config';
// Real store is exercised through AppBuilderTestSession.
import _useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession } from '@/test/app-builder';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import VersionManagerDropdown from '../../VersionManagerDropdown';
import LibraryVersionDropdown from '@/AppBuilder/QueryLibrary/LibraryVersionDropdown';
import { authenticationService } from '@/_services';

const environments = [
  { id: 'dev', name: 'development', priority: 1, appVersionsCount: 3 },
  { id: 'prod', name: 'production', priority: 3, appVersionsCount: 1 },
];
const draft = {
  id: 'draft-a',
  name: 'candidate.one',
  description: 'Existing changes',
  status: 'DRAFT',
  currentEnvironmentId: 'dev',
  versionType: 'version',
  isSynced: false,
};
const saved = {
  id: 'saved-a',
  name: 'v1',
  status: 'PUBLISHED',
  currentEnvironmentId: 'dev',
  versionType: 'version',
  isSynced: false,
};
let session;
let versions;
let saves;
let resource;
let originalSession;
const cy = (value) => document.querySelector(`[data-cy="${value}"]`);
async function setup(
  rows = [draft, { ...draft, id: 'draft-b', name: 'candidate.two' }, saved],
  git = false,
  extraRoutes = []
) {
  versions = rows;
  saves = [];
  if (resource === 'library') {
    originalSession = authenticationService.currentSessionValue;
    authenticationService.updateCurrentSession({ ...originalSession, admin: true });
    const libraryRows = () => ({
      drafts: versions.filter((v) => v.status === 'DRAFT').map((v) => ({ ...v, dataSourceId: 'source-one' })),
      versions: versions
        .filter((v) => v.status !== 'DRAFT')
        .map((v) => ({
          ...v,
          dataSourceId: 'source-one',
          environment: environments.find((env) => env.id === v.currentEnvironmentId),
        })),
    });
    session = new AppBuilderTestSession({
      scenario: {
        surface: 'module-editor',
        capabilities: {
          network: [
            ...extraRoutes,
            { url: `${config.apiUrl}/query-library/queries/query-one/versions`, json: libraryRows },
          ],
        },
      },
    });
    _useStore.setState((state) => ({
      license: { featureAccess: { ...state.license.featureAccess, queryLibraryEnabled: true } },
    }));
    await session.store.act((state) => state.queryLibrary.beginLibrarySession('org-1'));
    await session.store.act((state) => state.queryLibrary.setLibraryEnvironments(environments));
    await session.store.act((state) => state.queryLibrary.loadLibraryVersions('query-one'));
    await session.store.act((state) => state.queryLibrary.viewLibraryVersion('query-one', rows[0].id));
    const originalFetch = global.fetch;
    jest.spyOn(global, 'fetch').mockImplementation((url, options) => originalFetch(url, options));
    return;
  }

  session = new AppBuilderTestSession({
    scenario: {
      surface: 'module-editor',
      capabilities: {
        network: [
          ...extraRoutes,
          {
            url: `${config.apiUrl}/app-environments/init`,
            json: {
              environments,
              editorEnvironment: environments[0],
              editorVersion: rows[0],
              appVersionEnvironment: environments[0],
            },
          },
          { url: `${config.apiUrl}/app-environments/:id/versions`, json: () => ({ appVersions: versions }) },
          { method: 'put', url: `${config.apiUrl}/v2/apps/module-1/versions/:id`, json: {} },
          { url: `${config.apiUrl}/v2/apps/module-1/versions/:id`, json: {} },
          { url: `${config.apiUrl}/apps/module-1/versions/:id/library-pins`, json: { pins: [] } },
          { method: 'put', url: `${config.apiUrl}/app-git/module-1/versions/:id`, json: {} },
          {
            url: `${config.apiUrl}/app-git/org-1/app/:id/configs`,
            json: { app_git: { org_git: { git_https: { is_enabled: git, github_branch: 'main' } } } },
          },
        ],
      },
    },
  });
  const originalFetch = global.fetch;
  jest.spyOn(global, 'fetch').mockImplementation((url, options) => {
    if (options?.method === 'PUT') saves.push({ id: url.split('/').pop(), body: JSON.parse(options.body) });
    return originalFetch(url, options);
  });
  await session.store.act('setApp', {
    appId: 'module-1',
    appType: 'module',
    co_relation_id: 'module-correlation',
    organizationId: 'org-1',
  });
  await session.store.act('init', rows[0]?.id);
  await session.store.act('setCurrentVersionId', rows[0]?.id);
  await session.store.act('fetchDevelopmentVersions', 'module-1');
  if (git) await session.store.act('fetchAppGit', 'org-1', rows[0]?.id);
}
function render(ui) {
  return session.render(
    <ModuleProvider moduleId="canvas" appType="module">
      {ui}
    </ModuleProvider>
  );
}
async function open() {
  await session.user.click(cy('version-switcher-button'));
  await waitFor(() => expect(cy('candidate.one-version-name')).toBeInTheDocument());
}

afterEach(() => {
  if (resource === 'library' && global.fetch.mock)
    expect(global.fetch.mock.calls.every(([url]) => url.includes('/query-library/'))).toBe(true);
  if (originalSession) authenticationService.updateCurrentSession(originalSession);
  originalSession = undefined;
  jest.restoreAllMocks();
});
const dropdown = (darkMode) =>
  resource === 'library' ? (
    <LibraryVersionDropdown queryId="query-one" darkMode={darkMode} />
  ) : (
    <VersionManagerDropdown darkMode={darkMode} />
  );

describe.each(['module', 'library'])('%s lifecycle parity', (kind) => {
  beforeEach(() => {
    resource = kind;
  });
  it.each([false, true])(
    'shows the same Save fields and locking warning; cancel makes no write (dark=%s)',
    async (darkMode) => {
      await setup();
      render(dropdown(darkMode));
      await open();
      await session.user.click(screen.getAllByText('Save version')[0]);
      expect(cy('version-name-input-field')).toHaveValue('candidate.one');
      expect(cy('version-immutability-info')).toHaveTextContent('Name and description cannot be edited after saving');
      expect(document.querySelector('textarea')).toHaveValue('Existing changes');
      await session.user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(saves).toHaveLength(0);
    }
  );
  it.each([false, true])('opens the same release confirmation for a selected saved row (dark=%s)', async (darkMode) => {
    await setup([saved, draft]);
    render(dropdown(darkMode));
    await open();
    await session.user.click(cy('release-version-button'));
    expect(cy('modal-title')).toHaveTextContent('Release v1');
    expect(document.querySelector('.release-confirm-dialogue-modal')).toHaveClass(
      ...(darkMode ? ['dark-theme'] : ['modal-content'])
    );
    expect(cy('confirm-dialogue-box-text')).toBeInTheDocument();
    expect(cy('cancel-button')).toHaveTextContent('Cancel');
    expect(cy('yes-button')).toHaveTextContent('Yes');
  });
  it.each([false, true])('uses the same ordered promotion confirmation (dark=%s)', async (darkMode) => {
    await setup([saved, draft], false, [
      { url: `${config.apiUrl}/license/access`, json: { multiEnvironment: true, queryLibraryEnabled: true } },
    ]);
    await session.store.act('updateFeatureAccess');
    render(dropdown(darkMode));
    await open();
    await session.user.click(cy('promote-version-button'));
    expect(cy('modal-title')).toHaveTextContent('Promote v1');
    expect(cy('current-env-name')).toHaveTextContent('Development');
    expect(cy('target-env-name')).toHaveTextContent('Production');
    expect(document.querySelector('.promote-confirm-dialogue-modal')).toHaveClass(
      ...(darkMode ? ['dark-theme'] : ['modal-content'])
    );
    expect(cy('cancel-button')).toHaveTextContent('Cancel');
    expect(cy('promote-button')).toHaveTextContent('Promote');
  });
  it('keeps Create draft enabled with multiple drafts and accepts name/source', async () => {
    await setup();
    render(dropdown(false));
    await open();
    expect(cy('candidate.two-version-name')).toBeInTheDocument();
    await session.user.click(screen.getByText('Create draft version'));
    expect(cy('version-name-input-field')).toBeEnabled();
    fireEvent.change(cy('version-name-input-field'), { target: { value: 'candidate/three' } });
    expect(cy('version-name-input-field')).toHaveValue('candidate/three');
    expect(cy('create-draft-version-from-input-field')).toHaveTextContent('v1');
    expect(screen.queryByText('candidate.two')).not.toBeInTheDocument();
  });
  it('offers Edit details only for drafts and keeps saved lifecycle actions available', async () => {
    await setup([saved, draft]);
    render(dropdown(false));
    await open();
    expect(cy('release-version-button')).toBeEnabled();
    await session.user.click(cy('candidate.one-version-more-menu-button'));
    expect(screen.getByText('Edit details')).toBeInTheDocument();
    await session.user.click(document.body);
    await waitFor(() => expect(cy('v1-version-more-menu-button')).not.toBeInTheDocument());
    await open();
    await session.user.click(cy('v1-version-more-menu-button'));
    expect(screen.queryByText('Edit details')).not.toBeInTheDocument();
  });
  it('uses shared search and distinguishes an empty search result', async () => {
    await setup([
      draft,
      ...Array.from({ length: 6 }, (_, i) => ({ ...saved, id: `saved-${i}`, name: `release.${i}` })),
    ]);
    render(dropdown(false));
    await open();
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'missing' } });
    expect(screen.getByText('No versions found')).toBeInTheDocument();
  });
  it('shows Promote after out-of-band publish while selectedVersion status stays DRAFT', async () => {
    if (kind !== 'module') return;
    const row = { ...draft, id: 'v1-id', name: 'v1' };
    await setup([row], false, [
      { url: `${config.apiUrl}/license/access`, json: { multiEnvironment: true, queryLibraryEnabled: true } },
    ]);
    await session.store.act('updateFeatureAccess');
    // Server advanced to PUBLISHED (e.g. cy.apiPublishDraftVersion); client snapshot stays DRAFT
    versions = [{ ...row, status: 'PUBLISHED' }];
    render(dropdown(false));
    await session.user.click(cy('version-switcher-button'));
    await waitFor(() => expect(cy('promote-version-button')).toBeInTheDocument());
    expect(document.querySelector('[data-cy="v1-draft-tag"]')).toBeNull();
  });
  it('keeps the selected version visible when environment version lists are still empty', async () => {
    if (kind !== 'module') return;
    const { useVersionManagerStore } = require('@/_stores/versionManagerStore');
    await setup([saved]);
    // Simulate the boot gap: selectedVersion is known from init(), but environment
    // list fetches have not populated yet (or returned before environments hydrated).
    await session.store.act((state) => {
      state.developmentVersions = [];
    });
    useVersionManagerStore.setState({ versions: [], loading: false, error: null });
    render(dropdown(false));
    await session.user.click(cy('version-switcher-button'));
    await waitFor(() => {
      expect(screen.queryByText('No versions available')).not.toBeInTheDocument();
      expect(cy('create-draft-version-button')).toBeInTheDocument();
      expect(cy('v1-version-name')).toBeInTheDocument();
    });
  });
});
