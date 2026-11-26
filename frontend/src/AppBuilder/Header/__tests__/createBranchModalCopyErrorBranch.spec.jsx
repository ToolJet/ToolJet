// Copy error on Create branch names the new branch, not the active one.
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { CreateBranchModal } from '@/AppBuilder/Header/CreateBranchModal';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { settleWaitingModal } from '@/_helpers/backgroundJobs';

const APP_ID = 'app-1';

const conflict = {
  conflictGroups: [
    {
      type: 'app',
      conflictField: 'name',
      conflictKey: 'Inventory',
      conflicts: [
        { name: 'Inventory', status: 'existing', coRelationId: 'aaaaaaaa-1111-4111-8111-111111111111' },
        { name: 'Inventory', status: 'incoming', coRelationId: 'bbbbbbbb-2222-4222-8222-222222222222' },
      ],
    },
  ],
};

const scenarioWithCreateResponse = (createRoute) =>
  defineAppBuilderScenario({
    id: 'create-branch-modal-copy-error-branch',
    name: 'Create branch conflict report names the new branch',
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
        { method: 'post', url: '*/workspace-branches', ...createRoute },
      ],
    },
  });

let writeText;
const OriginalResizeObserver = window.ResizeObserver;

// jsdom lacks ResizeObserver.
beforeAll(() => {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterAll(() => {
  window.ResizeObserver = OriginalResizeObserver;
});

function startCreate(createRoute) {
  const session = new AppBuilderTestSession({ scenario: scenarioWithCreateResponse(createRoute) });
  // After the session, whose userEvent.setup() replaces the clipboard.
  writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  session.render(<CreateBranchModal appId={APP_ID} onClose={() => {}} />);

  fireEvent.change(screen.getByPlaceholderText('Enter branch name'), { target: { value: 'feature-x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create branch' }));
}

async function copiedReport() {
  const copyError = await screen.findByRole('button', { name: /copy error/i });
  await act(async () => {
    fireEvent.click(copyError);
  });
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  return writeText.mock.calls[0][0];
}

test('the copied report names the branch being created', async () => {
  startCreate({ status: 409, json: { statusCode: 409, message: JSON.stringify(conflict) } });

  const text = await copiedReport();
  expect(text).toContain('Action:    Create branch');
  expect(text).toContain('Branch:    feature-x');
});

test('the copied report names the new branch when the background job fails with conflicts', async () => {
  startCreate({ status: 201, json: { enqueued: true } });
  // Let the 201 settle; the job failure arrives later over the notifications socket.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

  act(() => {
    settleWaitingModal({
      type: 'error',
      metadata: { source: 'git-sync', action: 'git-create-branch', branchName: 'feature-x', ...conflict },
    });
  });

  const text = await copiedReport();
  expect(text).toContain('Branch:    feature-x');
});
