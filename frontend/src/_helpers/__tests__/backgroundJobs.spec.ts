import { branchJobKey, settleWaitingModal, waitForJob } from '@/_helpers/backgroundJobs';

const failure = (extra = {}) => ({
  type: 'error',
  metadata: { source: 'git-sync', action: 'git-create-branch', branchName: 'feature-x', ...extra },
});

describe('settleWaitingModal', () => {
  test('lets the waiting modal take over a failure it handled, so no error toast is shown', () => {
    waitForJob(branchJobKey('feature-x'), () => true);

    // Catches: the generic error toast shown on top of the modal's own conflict list.
    expect(settleWaitingModal(failure())).toBe(true);
  });

  test('still shows the error toast for a failure the modal did not handle', () => {
    waitForJob(branchJobKey('feature-x'), () => undefined);

    expect(settleWaitingModal(failure())).toBe(false);
  });

  test('takes over a success as before', () => {
    waitForJob(branchJobKey('feature-x'), () => undefined);

    expect(settleWaitingModal({ ...failure(), type: 'success' })).toBe(true);
  });
});
