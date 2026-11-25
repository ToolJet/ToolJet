// The editor's Create branch modal asks before importing a branch that already exists in git.
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { CreateBranchModal } from '@/AppBuilder/Header/CreateBranchModal';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
import { settleWaitingModal } from '@/_helpers/backgroundJobs';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';

const APP_ID = 'app-1';

const scenario = defineAppBuilderScenario({
  id: 'create-branch-modal-import-confirmation',
  name: 'Create branch modal confirms an import',
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

const importConfirmationError = {
  statusCode: 409,
  data: { message: JSON.stringify({ needsImportConfirmation: true, name: 'feature-x' }) },
};

// jsdom has no ResizeObserver; the conflict modal measures its list with one.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('the editor Create branch modal when the branch already exists in git', () => {
  beforeAll(() => {
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
  });

  let session: AppBuilderTestSession;
  let create: jest.SpyInstance;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
    create = jest.spyOn(workspaceBranchesService, 'create');
  });
  afterEach(() => jest.restoreAllMocks());

  const submitName = () => {
    session.render(<CreateBranchModal appId={APP_ID} onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Enter branch name'), { target: { value: 'feature-x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create branch' }));
  };

  test('asks for an import confirmation instead of showing the raw error', async () => {
    create.mockRejectedValueOnce(importConfirmationError);

    submitName();

    // Catches: the 409 JSON shown as the field error.
    expect(await screen.findByText(/already exists in git remote/)).toBeInTheDocument();
    expect(screen.queryByText(/needsImportConfirmation/)).not.toBeInTheDocument();
  });

  test('sends the create again with the import confirmed when the user accepts', async () => {
    create.mockRejectedValueOnce(importConfirmationError).mockResolvedValueOnce({ enqueued: true, isImport: true });

    submitName();
    fireEvent.click(await screen.findByRole('button', { name: 'Import branch' }));

    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
    // create(name, sourceBranchId, commitSha, appId, versionId, confirmImport, idempotencyKey)
    expect(create.mock.calls[0][5]).toBeUndefined();
    expect(create.mock.calls[1][0]).toBe('feature-x');
    expect(create.mock.calls[1][5]).toBe(true);
  });

  test('sends nothing more when the user cancels the import', async () => {
    create.mockRejectedValueOnce(importConfirmationError);

    submitName();
    const dialog = (await screen.findByText(/already exists in git remote/)).closest(
      '.import-branch-modal'
    ) as HTMLElement;
    fireEvent.click(dialog.querySelector('[data-cy="cancel-button"]') as HTMLElement);

    expect(create).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/already exists in git remote/)).not.toBeInTheDocument();
  });

  test('lists the naming conflicts in the conflict modal when the job fails on them', async () => {
    create.mockResolvedValueOnce({ enqueued: true, isImport: false });

    submitName();
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    act(() => {
      settleWaitingModal({
        type: 'error',
        metadata: {
          source: 'git-sync',
          action: 'git-create-branch',
          branchName: 'feature-x',
          conflictGroups: [
            {
              type: 'app',
              label: 'Applications — slug',
              conflictField: 'slug',
              conflictKey: 'orders-app',
              conflicts: [
                { name: 'Orders A', status: 'incoming', coRelationId: 'a044da59-ead4-450c-b1ed-53562d3067de' },
                { name: 'Orders B', status: 'incoming', coRelationId: '7c21e0b3-1111-2222-3333-444455556666' },
              ],
            },
          ],
        },
      });
    });

    expect(await screen.findByText('Cannot create branch')).toBeInTheDocument();
    expect(screen.getByText(/App slug - 'orders-app'/)).toBeInTheDocument();
  });
});
