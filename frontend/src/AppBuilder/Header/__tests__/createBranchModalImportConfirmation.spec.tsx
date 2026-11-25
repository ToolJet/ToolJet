// The editor's Create branch modal asks before importing a branch that already exists in git.
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { CreateBranchModal } from '@/AppBuilder/Header/CreateBranchModal';
import { workspaceBranchesService } from '@/_services/workspace_branches.service';
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

describe('the editor Create branch modal when the branch already exists in git', () => {
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
});
