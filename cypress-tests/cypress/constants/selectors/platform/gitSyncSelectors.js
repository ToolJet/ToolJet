// Selectors for the rewritten git sync suite. Each entry cites the component
// that renders it. The legacy `gitsync.js` stays until the old specs are retired.

export const gitSyncSelectors = {
  // source: frontend/src/_ui/WorkspaceBranchDropdown/index.jsx:591
  wsBranchHeader: '[data-cy="workspace-branch-dropdown-header"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/index.jsx:594
  wsCurrentBranch: '[data-cy="workspace-current-branch-name"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/index.jsx:229
  wsBranchPopover: '[data-cy="workspace-branch-dropdown-popover"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/index.jsx:530
  wsCreateBranchBtn: '[data-cy="workspace-create-branch-btn"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/index.jsx:542
  wsSwitchBranchBtn: '[data-cy="workspace-switch-branch-btn"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/index.jsx:269
  enableBranchingBtn: '[data-cy="enable-branching-btn"]',

  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:238
  branchNameInput: '[data-cy="branch-name-input"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:281
  createBranchButton: '[data-cy="create-branch-button"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:240 (no data-cy — tracked for add-data-cy)
  branchNameError: ".form-error-message",

  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:257
  switchBranchSearch: '[data-cy="workspace-branch-search-input"]',
  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:283
  switchBranchItem: (name) => `[data-cy="workspace-branch-list-item-${name}"]`,
  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:355
  switchCreateBranchBtn: '[data-cy="workspace-create-branch-from-modal-btn"]',

  // source: frontend/src/_ui/WorkspaceBranchDropdown/ImportBranchModal.jsx:41
  importBranchButton: '[data-cy="import-branch-button"]',

  // source: frontend/src/_ui/WorkspaceGitCTA/index.jsx:74
  wsPullButton: '[data-cy="workspace-git-pull-button"]',
  // source: frontend/src/_ui/WorkspaceGitCTA/index.jsx:88
  wsCommitButton: '[data-cy="workspace-git-commit-button"]',
  // source: frontend/src/_ui/WorkspaceGitCTA/index.jsx:104
  wsSyncDataSourcesButton: '[data-cy="workspace-git-sync-datasources-button"]',

  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:713
  gitModalTitle: '[data-cy="modal-title"]',
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:469
  commitMessageInput: '[data-cy="commit-message-input"]',
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:609
  commitButton: '[data-cy="commit-button"]',
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:655
  pullButton: '[data-cy="pull-button"]',
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:394
  viewLatestCommitLabel: '[data-cy="view-latest-commit-label"]',

  // shared across modals (CreateBranchModal.jsx:272, ImportBranchModal.jsx:32, WorkspaceGitSyncModal/index.jsx:601)
  cancelButton: '[data-cy="cancel-button"]',

  // source: frontend/src/AppBuilder/Header/LockedBranchBanner.jsx:45
  lockedBanner: '[data-cy="locked-branch-banner"]',
  // source: frontend/src/AppBuilder/Header/LifecycleCTAButton.jsx (lifecycle-cta-button)
  lifecycleCta: '[data-cy="lifecycle-cta-button"]',
};
