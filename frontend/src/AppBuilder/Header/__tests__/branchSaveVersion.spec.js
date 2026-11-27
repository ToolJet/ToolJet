import { saveVersionAction } from '../branchSaveVersion';

// With git branching on and the workspace needing reviewers, a branch draft is saved as a version only once its review
// is approved. The server's save gate (GET /apps/:id/versions/:versionId/release-gate?action=save) decides; the branch
// menu's Save version button shows its answer instead of refusing after the modal is filled in.
const gate = (overrides) => ({ required: true, allowed: true, reason: null, reviewId: 'r-1', ...overrides });

describe('the branch menu Save version button', () => {
  it('saves once the review is approved', () => {
    expect(saveVersionAction(gate())).toEqual({ disabled: false, reason: null });
  });

  it('saves when the workspace needs no reviewers', () => {
    expect(saveVersionAction(gate({ required: false, reviewId: null }))).toEqual({ disabled: false, reason: null });
  });

  it('stays enabled while the gate is unknown, leaving the decision to the server', () => {
    expect(saveVersionAction(null)).toEqual({ disabled: false, reason: null });
  });

  it('waits for an approved review, saying why', () => {
    const reason = 'This draft needs an approved review before it can be saved as a version';
    expect(saveVersionAction(gate({ allowed: false, reason, reviewId: null }))).toEqual({ disabled: true, reason });
  });

  it('waits while the review still needs approvals', () => {
    const reason = 'Its review is waiting for 1 more approval, so it cannot be saved as a version yet';
    expect(saveVersionAction(gate({ allowed: false, reason }))).toEqual({ disabled: true, reason });
  });
});
