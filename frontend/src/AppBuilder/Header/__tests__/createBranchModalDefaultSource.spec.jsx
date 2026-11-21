// "Create from" defaults to the open version; assertions run before the network responds.
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { CreateBranchModal } from '@/AppBuilder/Header/CreateBranchModal';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';

const APP_ID = 'app-1';

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
    network: [{ url: `*/app-git/gitpull/app/${APP_ID}`, json: { meta_data: { tags: [] } } }],
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

  test('falls back to Latest (main) when the open version is a branch', async () => {
    await session.store.act('setSelectedVersion', { id: 'b-1', name: 'feature-y', versionType: 'branch' });

    renderModal(session);

    expect(createFromTrigger()).toHaveTextContent('Latest (main)');
  });
});
