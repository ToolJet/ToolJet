
export const gitSyncSelectors = {
  wsBranchHeader: '[data-cy="workspace-branch-dropdown-header"]',
  wsCurrentBranch: '[data-cy="workspace-current-branch-name"]',
  wsBranchPopover: '[data-cy="workspace-branch-dropdown-popover"]',
  wsCreateBranchBtn: '[data-cy="workspace-create-branch-btn"]',
  wsSwitchBranchBtn: '[data-cy="workspace-switch-branch-btn"]',
  enableBranchingBtn: '[data-cy="enable-branching-btn"]',

  branchNameInput: '[data-cy="branch-name-input"]',
  createBranchButton: '[data-cy="create-branch-button"]',
  branchNameError: ".form-error-message",

  switchBranchSearch: '[data-cy="workspace-branch-search-input"]',
  switchBranchItem: (name) => `[data-cy="workspace-branch-list-item-${name}"]`,
  switchCreateBranchBtn: '[data-cy="workspace-create-branch-from-modal-btn"]',

  importBranchButton: '[data-cy="import-branch-button"]',

  wsPullButton: '[data-cy="workspace-git-pull-button"]',
  wsCommitButton: '[data-cy="workspace-git-commit-button"]',
  wsSyncDataSourcesButton: '[data-cy="workspace-git-sync-datasources-button"]',

  gitModalTitle: '[data-cy="modal-title"]',
  commitMessageInput: '[data-cy="commit-message-input"]',
  commitButton: '[data-cy="commit-button"]',
  pullButton: '[data-cy="pull-button"]',
  // Single-branch editors open a Push/Pull modal; the Pull tab has no data-cy.
  pullTab: ".push-pull-tabs .tab-pull button",
  viewLatestCommitLabel: '[data-cy="view-latest-commit-label"]',

  // shared across modals
  cancelButton: '[data-cy="cancel-button"]',

  lockedBanner: '[data-cy="locked-branch-banner"]',
  lifecycleCta: '[data-cy="lifecycle-cta-button"]',

  editorBranchHeader: '[data-cy="branch-dropdown-header"]',
  saveVersionBtn: '[data-cy="save-version-btn"]',
  versionNameInput: '[data-cy="version-name-input-field"]',
  createVersionSaveBtn: '[data-cy="create-version-save-button"]',
  workflowVersionSelect: '[data-cy="workflow-version-select"]',

  appCard: (name) => `[data-cy="${name.toLowerCase().replace(/\s+/g, "-")}-card"]`,
  unsyncedBadgeIdle: '[data-cy="unsynced-badge-idle"]',
  unsyncedBadge: '[data-cy="unsynced-badge"]',
  versionLockBanner: '[data-cy="version-lock-banner"]',

  pushAppsModal: ".git-sync-modal",
  pushAppsModalTitle: '[data-cy="push-apps-modal-title"]',
  pushAppsBranchInput: '[data-cy="push-apps-branch-input"]',
  pushAppsCreateBranch: '[data-cy="push-apps-create-branch"]',
  pushAppsSubmit: '[data-cy="push-apps-submit"]',

  pullConflictModal: ".pull-conflict-modal",
  conflictTitle: ".conflict-title",
  conflictCategoryTitle: ".conflict-category-title",
  conflictRowHeader: ".conflict-row-header",
  conflictRowCheckbox: ".conflict-row-checkbox",
  conflictItem: ".conflict-item",
  conflictSyncSelectedBtn: '[data-cy="conflict-sync-selected-button"]',

  createNewAppButton: '[data-cy="create-new-apps-button"]',
  importDropdownToggle: '[data-cy="import-dropdown-menu"]',
  chooseFromTemplateButton: '[data-cy="choose-from-template-button"]',
  importFromDeviceOption: '[data-cy="import-option-label"]',

  workflowRunButton: '[data-cy="workflow-run-button"]',
  workflowGitButton: '[data-cy="workflow-git-commit-button"]',
  workflowLogsPanel: '[data-cy="logs-panel"]',
  versionSwitcherButton: '[data-cy="version-switcher-button"]',
  developmentEnvName: '[data-cy="development-environment-name"]',
  versionRowSaveButton: '[data-cy$="-save-version-button"]',
};
