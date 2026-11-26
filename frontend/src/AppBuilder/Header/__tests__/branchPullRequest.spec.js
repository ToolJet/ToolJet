import { approvedCommitNote, pullRequestAction } from '../branchPullRequest';

// With git branching on, a branch's pull request is created only once every app committed on it is approved.
const status = (overrides) => ({ pullRequest: null, apps: [], ready: true, ...overrides });

describe('the branch menu pull request button', () => {
  it('creates a pull request once every committed app is approved', () => {
    expect(pullRequestAction(status({ apps: [{ name: 'Orders', status: 'approved' }] }))).toEqual({
      label: 'Create pull request',
      url: null,
      disabled: false,
      reason: null,
    });
  });

  it('waits for approval, naming the apps still waiting', () => {
    const action = pullRequestAction(
      status({
        ready: false,
        apps: [
          { name: 'Orders', status: 'approved' },
          { name: 'Invoices', status: 'none' },
          { name: 'Reports', status: 'changes_requested' },
          { name: 'Scratch', status: 'uncommitted' },
        ],
      })
    );
    expect(action).toMatchObject({ disabled: true, reason: 'Needs an approved review first: Invoices, Reports' });
  });

  it('opens the pull request that is already open', () => {
    const action = pullRequestAction(
      status({ ready: false, pullRequest: { status: 'open', url: 'https://git.example/pr/42' } })
    );
    expect(action).toEqual({
      label: 'View pull request',
      url: 'https://git.example/pr/42',
      disabled: false,
      reason: null,
    });
  });

  it('offers a new pull request after the last one was merged', () => {
    const action = pullRequestAction(status({ pullRequest: { status: 'merged', url: 'https://git.example/pr/41' } }));
    expect(action).toMatchObject({ label: 'Create pull request', url: null, disabled: false });
  });

  it('stays usable while the status is unknown', () => {
    expect(pullRequestAction(null)).toMatchObject({ disabled: false, label: 'Create pull request' });
  });
});

// The review's approved step names the commit ToolJet's pull request comment is for: a later commit needs a new
// approval before the pull request can merge.
describe("the review's note about the approved commit", () => {
  const SHA = 'abcdef1234567890abcdef1234567890abcdef12';

  it('names the commit once the pull request comment does', () => {
    expect(approvedCommitNote(status({ reviewComment: { state: 'approved', commit: SHA } }))).toBe(
      'Approved for commit abcdef1. A new commit needs a new approval.'
    );
  });

  it('says nothing until the branch is approved and the pull request is open', () => {
    expect(approvedCommitNote(status({ reviewComment: { state: 'pending', commit: SHA } }))).toBeNull();
    expect(approvedCommitNote(status({ reviewComment: { state: 'approved', commit: null } }))).toBeNull();
    expect(approvedCommitNote(null)).toBeNull();
  });
});
