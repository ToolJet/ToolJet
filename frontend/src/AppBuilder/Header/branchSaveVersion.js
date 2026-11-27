// What the branch menu's Save version button does, from the server's save gate for the branch draft
// (workspaceBranchesService.getSaveGate). Where the workspace needs reviewers, a branch draft is saved as a version only
// once its review is approved; the button says why instead of refusing after the modal is filled in.
export const saveVersionAction = (gate) =>
  // Unknown (still loading, or no gate on this edition): the server still refuses an unapproved save.
  !gate || gate.allowed ? { disabled: false, reason: null } : { disabled: true, reason: gate.reason };
