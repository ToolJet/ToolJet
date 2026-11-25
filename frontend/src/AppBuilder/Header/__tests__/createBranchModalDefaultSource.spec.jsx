// "Create from" defaults to the open version; assertions run before the network responds.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { CreateBranchModal } from '@/AppBuilder/Header/CreateBranchModal';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';

const APP_ID = 'app-1';
const DEVELOPMENT = { id: 'env-dev', name: 'development', priority: 1 };

const scenario = defineAppBuilderScenario({
  id: 'create-branch-modal-default-source',
  name: 'Create branch modal defaults to the open version',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {
    network: [
      { url: `*/app-git/gitpull/app/${APP_ID}`, json: { meta_data: { tags: [] } } },
      {
        url: '*/app-environments/init',
        json: { environments: [DEVELOPMENT], editorEnvironment: DEVELOPMENT, editorVersion: { appId: APP_ID } },
      },
      { method: 'post', url: '*/app-environments/post-action/environment_changed', json: {} },
      {
        url: `*/app-environments/${DEVELOPMENT.id}/versions`,
        json: { appVersions: [{ id: 'v-2', name: 'v2', versionType: 'version', status: 'PUBLISHED' }] },
      },
    ],
  },
});

const savedVersion = { id: 'v-2', name: 'v2', versionType: 'version', status: 'PUBLISHED' };

function renderModal(session) {
  session.render(<CreateBranchModal appId={APP_ID} onClose={() => {}} />);
}

function createFromTrigger() {
  return screen.getByText('Create from').closest('.form-group').querySelector('.custom-dropdown-trigger');
}

describe('the Create branch modal "Create from" default', () => {
  let session;
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  test('preselects the saved version open in the editor without waiting for the version lists', async () => {
    await session.store.act('setSelectedVersion', savedVersion);

    renderModal(session);

    const trigger = createFromTrigger();
    // Catches: trigger blocked until options load.
    expect(trigger).toHaveTextContent('v2');
    expect(trigger).not.toHaveTextContent('Loading...');
    expect(trigger).toBeEnabled();
  });

  test('marks the preselected version as Released when it is the released version', async () => {
    await session.store.act('setSelectedVersion', savedVersion);
    await session.store.act('updateReleasedVersionId', savedVersion.id);

    renderModal(session);

    expect(createFromTrigger()).toHaveTextContent('Released');
  });

  test('lets the user create a branch before the version lists finish loading', async () => {
    await session.store.act('setSelectedVersion', savedVersion);
    renderModal(session);

    fireEvent.change(screen.getByPlaceholderText('Enter branch name'), { target: { value: 'feature-x' } });

    // Catches: Create disabled while options load.
    expect(screen.getByRole('button', { name: 'Create branch' })).toBeEnabled();
  });

  test('falls back to Latest (main) when the open version is a draft', async () => {
    await session.store.act('setSelectedVersion', { ...savedVersion, status: 'DRAFT' });

    renderModal(session);

    expect(createFromTrigger()).toHaveTextContent('Latest (main)');
  });

  test('falls back to Latest (main) once the versions load without the open version', async () => {
    await session.store.act('init');
    // v1 is open but not in the loaded list.
    await session.store.act('setSelectedVersion', { ...savedVersion, id: 'v-1', name: 'v1' });
    renderModal(session);

    expect(createFromTrigger()).toHaveTextContent('v1');

    // Catches: a stale preselection staying selected.
    await waitFor(() => expect(createFromTrigger()).toHaveTextContent('Latest (main)'));
  });

  test('keeps the open version once the versions load with it listed', async () => {
    await session.store.act('init');
    await session.store.act('setSelectedVersion', savedVersion);
    renderModal(session);

    await waitFor(() => expect(screen.queryByText('Loading more versions...')).not.toBeInTheDocument());
    fireEvent.click(createFromTrigger());

    // Catches: falling back when the open version is listed.
    expect(createFromTrigger()).toHaveTextContent('v2');
    expect(screen.getAllByText('v2').length).toBeGreaterThan(1);
  });

  test('falls back to Latest (main) when the open version is a branch', async () => {
    await session.store.act('setSelectedVersion', { id: 'b-1', name: 'feature-y', versionType: 'branch' });

    renderModal(session);

    expect(createFromTrigger()).toHaveTextContent('Latest (main)');
  });
});
