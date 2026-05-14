export const gitSyncSelectors = {
  // ─── Configure Git Page ────────────────────────────────────────────────────
  repoUrlInput: 'input[placeholder="Enter HTTPS repo URL"]',
  branchInput: 'input[placeholder="Enter Branch Name"]',
  appIdInput: 'input[placeholder="Enter GitHub app ID"]',
  installationIdInput: 'input[placeholder="Enter GitHub app installation ID"]',
  privateKeyInput: ".position-relative > .form-control",
  githubEnabledBadge: "Enabled",
  githubDisabledBadge: "Disabled",
  testConnectionBtn: "Test connection",
  saveConfigBtn: "Save config",

  // ─── Header (Dashboard / Data Sources) ────────────────────────────────────
  wsBranchHeader: '[data-cy="workspace-branch-dropdown-header"]',
  wsCurrentBranch: '[data-cy="workspace-current-branch-name"]',
  masterLockBanner: '[data-cy="locked-branch-banner"]',
  pullBtn: "Pull",
  lockBannerApps: "Create a branch to add or edit apps.",
  lockBannerDataSources: "Create a branch to add or edit data sources.",

  // ─── Workspace Git CTA Buttons (Dashboard header) ─────────────────────────
  wsGitPullBtn: '[data-cy="workspace-git-pull-button"]',
  wsGitCommitBtn: '[data-cy="workspace-git-commit-button"]',

  // ─── AppBuilder Lifecycle CTA Button ──────────────────────────────────────
  lifecycleCTABtn: '[data-cy="lifecycle-cta-button"]',

  // ─── Branch Popover (Dashboard) ───────────────────────────────────────────
  wsBranchPopover: '[data-cy="workspace-branch-dropdown-popover"]',
  wsCreateBranchBtn: '[data-cy="workspace-create-branch-btn"]',
  wsSwitchBranchBtn: '[data-cy="workspace-switch-branch-btn"]',
  wsFetchPrsBtn: '[data-cy="workspace-fetch-prs-btn"]',
  wsCreatePrBtn: '[data-cy="workspace-create-pr-btn"]',
  wsBranchSearchInput: '[data-cy="workspace-branch-search-input"]',
  wsBranchListItem: (name) => `[data-cy="workspace-branch-list-item-${name}"]`,
  wsCommitBtn: '[data-cy="workspace-commit-btn"]',
  branchPopoverDefaultBranch: "Default branch",
  branchPopoverUpdatedToday: "Updated today",
  branchPopoverFetchPRs: "Fetch PRs",
  branchPopoverCreateNewBranch: "Create new branch",
  branchPopoverSwitchBranch: "Switch branch",

  // ─── AppBuilder Branch Dropdown ────────────────────────────────────────────
  abBranchHeader: '[data-cy="branch-dropdown-header"]',
  abBranchPopover: '[data-cy="branch-dropdown-popover"]',
  abCurrentBranch: '[data-cy="current-branch-name"]',
  abCreateBranchBtn: '[data-cy="create-branch-btn"]',
  abSwitchBranchBtn: '[data-cy="switch-branch-btn"]',
  abCreatePrBtn: '[data-cy="create-pr-btn"]',
  abBranchSearchInput: '[data-cy="branch-search-input"]',
  abBranchListItem: (name) => `[data-cy="branch-list-item-${name}"]`,

  // ─── Configure Git Modal ───────────────────────────────────────────────────
  gitModalComponent: '[data-cy="modal-component"]',

  // ─── Push / Pull Modal ─────────────────────────────────────────────────────
  modalTitle: '[data-cy="modal-title"]',
  modalClose: '[data-cy="modal-close-button"]',
  commitMessageInput: '[data-cy="commit-message-input"]',
  pullModalTitle: "Pull Commit",
  checkForUpdatesLabel: '[data-cy="check-for-updates-label"]',
  pullModalCancelBtn: '[data-cy="cancel-button"]',
  pullModalPullChangesBtn: '[data-cy="pull-button"]',
  modalCommitBtn: '[data-cy="commit-button"]',
  modalContinueBtn: '[data-cy="continue-button"]',
  branchSelect: '[data-cy="branch-select"]',
  versionSelect: '[data-cy="version-select"]',

  // ─── Create Branch Modal ───────────────────────────────────────────────────
  createBranchModalTitle: "Create branch",
  createBranchInput: 'input[placeholder="Enter branch name"]',
  branchNameInput: '#branch-name-input',
  createBranchHelperText: "Branch name must be unique and max 50 characters",
  createBranchCommitChanges: "Commit changes",
  createBranchGitSyncNote: "Branch will always be created in git to ensure sync with ToolJet",
  createBranchMasterOnly: "Branch can only be created from master",

  // ─── Switch Branch Modal ───────────────────────────────────────────────────
  switchBranchModalTitle: "Switch branch",
  switchBranchLockedMsg: "Default branch is locked. Switch branches to make changes.",
  switchBranchAllOpen: "ALL OPEN BRANCHES",
  switchBranchSearchInput: 'input[placeholder="Search.."]',
  switchBranchDefaultLabel: "(default)",
  switchBranchCreatedBy: "Created by default, today",
  switchBranchViewInGit: "View in git repo",
  switchBranchCreateNew: "Create new branch",

  // ─── Delete Config ─────────────────────────────────────────────────────────
  deleteConfigBtn: "Delete config",
  deleteConfigModalTitle: "Delete configuration",
  deleteConfigModalMsg:
    "Deleting this configuration will result in the permanent removal of all associated connections. This action cannot be undone. Are you sure you wish to proceed with the deletion?",
  deleteConfigConfirmBtn: "Delete",
  deleteConfigSuccessToast: "Configuration deleted Successfully!",

  // ─── Dashboard App Card ────────────────────────────────────────────────────
  appCard: '[data-cy$="-card"]',

  // ─── App Builder Widgets ───────────────────────────────────────────────────
  queryStatusWidget: '[data-cy="draggable-widget-query_status"]',
};
