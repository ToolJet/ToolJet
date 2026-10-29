import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import config from 'config';
// Real store is exercised through AppBuilderTestSession.
import _useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession } from '@/test/app-builder';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import VersionManagerDropdown from '../../VersionManagerDropdown';
import CreateVersionModal from '../../../CreateVersionModal';
import CreateDraftVersionModal from '../../../CreateDraftVersionModal';
import EditVersionModal from '../../EditVersionModal';

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
const cy = (value) => document.querySelector(`[data-cy="${value}"]`);
async function setup(
  rows = [draft, { ...draft, id: 'draft-b', name: 'candidate.two' }, saved],
  git = false,
  extraRoutes = []
) {
  versions = rows;
  saves = [];
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

describe('Modules lifecycle characterization', () => {
  it('keeps multiple named drafts and a saved source in the real dropdown', async () => {
    await setup();
    render(<VersionManagerDropdown />);
    await open();
    expect(cy('candidate.two-version-name')).toBeInTheDocument();
    expect(screen.getByText('Create draft version')).toBeInTheDocument();
    expect(screen.getAllByText('Save version')).toHaveLength(2);
  });
  it('offers Edit details only for drafts', async () => {
    await setup();
    render(<VersionManagerDropdown />);
    await open();
    await session.user.click(cy('candidate.one-version-more-menu-button'));
    expect(screen.getByText('Edit details')).toBeInTheDocument();
    await session.user.click(document.body);
    await waitFor(() => expect(cy('v1-version-more-menu-button')).not.toBeInTheDocument());
    await open();
    await session.user.click(cy('v1-version-more-menu-button'));
    await waitFor(() => expect(cy('v1-delete-version-button')).toBeInTheDocument());
    expect(screen.queryByText('Edit details')).not.toBeInTheDocument();
  });
  it('has no create-draft source before the first saved version', async () => {
    await setup([draft]);
    render(<VersionManagerDropdown />);
    await open();
    expect(screen.queryByText('Create draft version')).not.toBeInTheDocument();
  });
  it('saves unchanged content with its existing name and description', async () => {
    await setup();
    render(<CreateVersionModal showCreateAppVersion setShowCreateAppVersion={() => {}} versionId={draft.id} />);
    expect(cy('version-name-input-field')).toHaveValue(draft.name);
    fireEvent.submit(cy('version-name-input-field').closest('form'));
    await waitFor(() =>
      expect(saves).toEqual([
        {
          id: draft.id,
          body: {
            name: draft.name,
            description: draft.description,
            status: 'PUBLISHED',
            is_user_switched_version: false,
          },
        },
      ])
    );
  });
  it('retains the existing inline metadata validation', async () => {
    await setup();
    render(<EditVersionModal showEditAppVersion setShowEditAppVersion={() => {}} versionToEdit={draft} />);
    fireEvent.change(cy('edit-version-name-input-field'), { target: { value: 'bad name' } });
    expect(cy('version-name-helper-text')).toHaveTextContent(
      'Version name cannot contain spaces or special characters'
    );
    fireEvent.submit(cy('edit-version-name-input-field').closest('form'));
    expect(saves).toHaveLength(0);
  });
  it('creates a named draft from saved versions, with editable name input', async () => {
    await setup();
    render(<CreateDraftVersionModal showCreateAppVersion setShowCreateAppVersion={() => {}} />);
    expect(cy('version-name-input-field')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.queryByText('candidate.two')).not.toBeInTheDocument();
  });
  it('keeps Git draft labels, immutable save notice and the Git save endpoint', async () => {
    await setup(
      [
        { ...draft, isSynced: true },
        { ...saved, isSynced: true },
      ],
      true
    );
    render(<VersionManagerDropdown />);
    await session.user.click(cy('version-switcher-button'));
    expect(await screen.findByText('main')).toBeInTheDocument();
    expect(screen.queryByText('Edit details')).not.toBeInTheDocument();
    render(
      <CreateVersionModal
        showCreateAppVersion
        setShowCreateAppVersion={() => {}}
        versionId={draft.id}
        orgGit={{ git_https: { is_enabled: true } }}
      />
    );
    expect(screen.getByText('Name and description cannot be edited after saving')).toBeInTheDocument();
    fireEvent.submit(cy('version-name-input-field').closest('form'));
    await waitFor(() =>
      expect(
        global.fetch.mock.calls.some(
          ([url, opts]) => url.includes('/app-git/module-1/versions/') && opts.method === 'PUT'
        )
      ).toBe(true)
    );
  });
  it('uses Git branch naming when creating a tracked draft', async () => {
    await setup(
      [
        { ...saved, isSynced: true },
        { ...draft, isSynced: true },
      ],
      true
    );
    render(<CreateDraftVersionModal showCreateAppVersion setShowCreateAppVersion={() => {}} />);
    expect(cy('version-name-input-field')).not.toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });
  it('shows release only on the selected saved row and keeps read-only actions disabled', async () => {
    await setup([saved, draft]);
    render(<VersionManagerDropdown />);
    await open();
    expect(document.querySelectorAll('[data-cy="release-version-button"]')).toHaveLength(1);
    await session.store.act('setIsEditorReadOnly', true);
    expect(cy('release-version-button')).toBeDisabled();
    expect(cy('candidate.one-save-version-button')).toBeDisabled();
    expect(cy('candidate.one-version-more-menu-button')).not.toBeInTheDocument();
  });
  it('keeps Git tag conflicts from saving a version and re-enables the form', async () => {
    await setup([draft, saved], true, [
      { url: `${config.apiUrl}/app-git/module-1/check-tag`, json: { exists: true, tagName: 'candidate.one' } },
    ]);
    render(
      <CreateVersionModal
        showCreateAppVersion
        setShowCreateAppVersion={() => {}}
        versionId={draft.id}
        orgGit={{ git_https: { is_enabled: true } }}
        isBranchingEnabled
      />
    );
    fireEvent.submit(cy('version-name-input-field').closest('form'));
    await waitFor(() => expect(cy('version-name-input-field')).not.toBeDisabled());
    expect(global.fetch.mock.calls.some(([url]) => url.includes('/check-tag?'))).toBe(true);
    expect(saves).toHaveLength(0);
  });
  it('refreshes remote Git tags and pulls the chosen remote version with its tag metadata', async () => {
    await setup(
      [
        { ...draft, isSynced: true },
        { ...saved, isSynced: true },
      ],
      true,
      [
        {
          url: `${config.apiUrl}/workspace-branches/entity-tags`,
          json: [
            { name: 'module/v1', commit: { sha: 'sha1' } },
            { name: 'module/v2', commit: { sha: 'sha2' }, message: 'Remote description' },
          ],
        },
        { method: 'post', url: `${config.apiUrl}/workspace-branches/pull-app`, json: { success: true } },
      ]
    );
    render(<VersionManagerDropdown />);
    await session.user.click(cy('version-switcher-button'));
    await session.user.click(await screen.findByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(cy('v2-version-name')).toBeInTheDocument());
    await session.user.click(cy('v2-pull-version-button'));
    await waitFor(() =>
      expect(
        global.fetch.mock.calls.some(
          ([url, opts]) => url.endsWith('/workspace-branches/pull-app') && JSON.parse(opts.body).tagName === 'v2'
        )
      ).toBe(true)
    );
    const [, request] = global.fetch.mock.calls.find(([url]) => url.endsWith('/workspace-branches/pull-app'));
    expect(JSON.parse(request.body)).toMatchObject({
      appId: 'module-1',
      tagSha: 'sha2',
      tagName: 'v2',
      tagDescription: 'Remote description',
    });
  });
  it('switches the real module store to a saved read-only snapshot', async () => {
    await setup([draft, saved], false, [
      {
        url: `${config.apiUrl}/v2/apps/module-1/versions/${saved.id}`,
        json: { editing_version: saved, should_freeze_editor: true },
      },
      { url: `${config.apiUrl}/organization-constants/environment/dev`, json: { constants: [] } },
      { url: `${config.apiUrl}/data-sources/org-1/environments/dev/versions/${saved.id}`, json: { data_sources: [] } },
    ]);
    render(<VersionManagerDropdown />);
    await open();
    await session.user.click(cy('v1-version-name'));
    await waitFor(() => expect(session.store.read((state) => state.currentVersionId)).toBe(saved.id));
    expect(session.store.read((state) => state.isEditorFreezed)).toBe(true);
    expect(cy('version-switcher-button')).toHaveTextContent(saved.name);
  });
  (config.TOOLJET_EDITION === 'ce' ? it.skip : it)(
    'browses an environment without switching the editor until a row is selected',
    async () => {
      const production = { ...saved, currentEnvironmentId: 'prod' };
      await setup([draft, production], false, [
        {
          url: `${config.apiUrl}/license/access`,
          json: { multiEnvironment: true, licenseStatus: { isLicenseValid: true, licenseType: 'enterprise' } },
        },
        {
          method: 'post',
          url: `${config.apiUrl}/app-environments/post-action/environment_changed`,
          json: { editorVersion: production },
        },
        {
          url: `${config.apiUrl}/v2/apps/module-1/versions/${saved.id}`,
          json: { editing_version: production, should_freeze_editor: true },
        },
        { url: `${config.apiUrl}/organization-constants/environment/prod`, json: { constants: [] } },
        {
          url: `${config.apiUrl}/data-sources/org-1/environments/prod/versions/${saved.id}`,
          json: { data_sources: [] },
        },
      ]);
      await session.store.act('updateFeatureAccess');
      await waitFor(() =>
        expect(session.store.read((state) => state.license.featureAccess?.multiEnvironment)).toBe(true)
      );
      render(<VersionManagerDropdown />);
      await open();
      await session.user.click(screen.getByRole('button', { name: 'Production' }));
      expect(session.store.read((state) => state.selectedEnvironment.id)).toBe('dev');
      expect(session.store.read((state) => state.currentVersionId)).toBe(draft.id);
      await session.user.click(cy('v1-version-name'));
      await waitFor(() => expect(session.store.read((state) => state.selectedEnvironment.id)).toBe('prod'));
      expect(session.store.read((state) => state.currentVersionId)).toBe(saved.id);
    }
  );
  it('shows draft metadata edits immediately while the dropdown row cache still has the old name', async () => {
    await setup();
    render(<VersionManagerDropdown />);
    await open();
    await session.user.click(cy('candidate.one-version-more-menu-button'));
    await session.user.click(screen.getByText('Edit details'));
    fireEvent.change(cy('edit-version-name-input-field'), { target: { value: 'renamed.candidate' } });
    fireEvent.change(cy('edit-version-description-input-field'), { target: { value: 'Updated description' } });
    fireEvent.submit(cy('edit-version-name-input-field').closest('form'));
    await waitFor(() => expect(cy('version-switcher-button')).toHaveTextContent('renamed.candidate'));
    expect(session.store.read((state) => state.selectedVersion.description)).toBe('Updated description');
    expect(versions[0].name).toBe(draft.name);
    expect(saves[0]).toEqual({
      id: draft.id,
      body: { name: 'renamed.candidate', description: 'Updated description', is_user_switched_version: false },
    });
  });
  it('uses refreshed row metadata after each promotion through Staging and Production', async () => {
    const lifecycleEnvironments = [
      { id: 'dev', name: 'development', priority: 1, appVersionsCount: 2 },
      { id: 'stage', name: 'staging', priority: 2, appVersionsCount: 1 },
      { id: 'prod', name: 'production', priority: 3, appVersionsCount: 1, isDefault: true },
    ];
    let promotedEnvironmentIndex = 0;
    await setup([saved, draft], false, [
      {
        url: `${config.apiUrl}/app-environments/init`,
        json: {
          environments: lifecycleEnvironments,
          editorEnvironment: lifecycleEnvironments[0],
          editorVersion: saved,
          appVersionEnvironment: lifecycleEnvironments[0],
        },
      },
      {
        url: `${config.apiUrl}/license/access`,
        json: { multiEnvironment: true, licenseStatus: { isLicenseValid: true, licenseType: 'enterprise' } },
      },
      {
        method: 'put',
        url: `${config.apiUrl}/v2/apps/module-1/versions/${saved.id}/promote`,
        json: () => {
          const target = lifecycleEnvironments[++promotedEnvironmentIndex];
          versions = [{ ...saved, currentEnvironmentId: target.id }, draft];
          return { editorEnvironment: target, promotedToEnvironment: target, environments: lifecycleEnvironments };
        },
      },
      { url: `${config.apiUrl}/organization-constants/environment/:environmentId`, json: { constants: [] } },
      {
        url: `${config.apiUrl}/data-sources/org-1/environments/:environmentId/versions/${saved.id}`,
        json: { data_sources: [] },
      },
      { url: `${config.apiUrl}/apps/module-1/versions/${saved.id}/library-pins`, json: { pins: [] } },
      { method: 'put', url: `${config.apiUrl}/apps/module-1/release`, json: {} },
    ]);
    await session.store.act('updateFeatureAccess');
    await waitFor(() =>
      expect(session.store.read((state) => state.license.featureAccess?.multiEnvironment)).toBe(true)
    );
    render(<VersionManagerDropdown />);
    await open();
    await session.user.click(cy('promote-version-button'));
    expect(cy('current-env-name')).toHaveTextContent('Development');
    expect(cy('target-env-name')).toHaveTextContent('Staging');
    await session.user.click(cy('promote-button'));
    await waitFor(() => expect(session.store.read((state) => state.selectedEnvironment.id)).toBe('stage'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // The unchanged promotion action intentionally does not rewrite the selected snapshot.
    expect(session.store.read((state) => state.selectedVersion.currentEnvironmentId)).toBe('dev');
    await session.user.click(document.body);
    await waitFor(() => expect(cy('v1-version-name')).not.toBeInTheDocument());
    await open();
    await waitFor(() => expect(cy('promote-version-button')).toBeInTheDocument());
    await session.user.click(cy('promote-version-button'));
    expect(cy('current-env-name')).toHaveTextContent('Staging');
    expect(cy('target-env-name')).toHaveTextContent('Production');
    await session.user.click(cy('promote-button'));
    await waitFor(() => expect(session.store.read((state) => state.selectedEnvironment.id)).toBe('prod'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await session.user.click(document.body);
    await waitFor(() => expect(cy('v1-version-name')).not.toBeInTheDocument());
    await open();
    await waitFor(() => expect(cy('release-version-button')).toBeInTheDocument());
    expect(cy('promote-version-button')).not.toBeInTheDocument();
    await session.user.click(cy('release-version-button'));
    expect(screen.getByText('Release v1')).toBeInTheDocument();
    await session.user.click(screen.getByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(session.store.read((state) => state.releasedVersionId)).toBe(saved.id));
    expect(saves.filter(({ id }) => id === 'promote').map(({ body }) => body.currentEnvironmentId)).toEqual([
      'dev',
      'stage',
    ]);
    expect(promotedEnvironmentIndex).toBe(2);
  });
});
