// Git sync selectors; each entry cites the component that renders it.

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

  // source: frontend/src/AppBuilder/Header/BranchDropdown.jsx:836
  editorBranchHeader: '[data-cy="branch-dropdown-header"]',
  // source: frontend/src/AppBuilder/Header/BranchDropdown.jsx:789
  saveVersionBtn: '[data-cy="save-version-btn"]',
  // source: frontend/src/AppBuilder/Header/CreateVersionModal.jsx:365
  versionNameInput: '[data-cy="version-name-input-field"]',
  // source: frontend/src/AppBuilder/Header/CreateVersionModal.jsx:487
  createVersionSaveBtn: '[data-cy="create-version-save-button"]',
  // source: frontend/src/AppBuilder/QueryManager/QueryEditors/Workflows.jsx:225 (select rendered next to it)
  workflowVersionSelect: '[data-cy="workflow-version-select"]',

  // source: frontend/src/HomePage/AppCard.jsx:364
  appCard: (name) => `[data-cy="${name.toLowerCase().replace(/\s+/g, "-")}-card"]`,
  // source: frontend/src/HomePage/AppCard.jsx:414 (red refresh icon, card not hovered)
  unsyncedBadgeIdle: '[data-cy="unsynced-badge-idle"]',
  // source: frontend/src/HomePage/AppCard.jsx:394 (same icon while the card is hovered)
  unsyncedBadge: '[data-cy="unsynced-badge"]',
  // source: frontend/ee/modules/Appbuilder/components/VersionLockBanner/VersionLockBanner.jsx:152
  versionLockBanner: '[data-cy="version-lock-banner"]',

  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:271 (contentClassName, no data-cy)
  pushAppsModal: ".git-sync-modal",
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:274
  pushAppsModalTitle: '[data-cy="push-apps-modal-title"]',
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:378
  pushAppsBranchInput: '[data-cy="push-apps-branch-input"]',
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:453
  pushAppsCreateBranch: '[data-cy="push-apps-create-branch"]',
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:495
  pushAppsSubmit: '[data-cy="push-apps-submit"]',

  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:299 (no data-cy, class names)
  pullConflictModal: ".pull-conflict-modal",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:312
  conflictTitle: ".conflict-title",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:418
  conflictCategoryTitle: ".conflict-category-title",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:115
  conflictRowHeader: ".conflict-row-header",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:129
  conflictRowCheckbox: ".conflict-row-checkbox",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:167
  conflictItem: ".conflict-item",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:467
  conflictSyncSelectedBtn: '[data-cy="conflict-sync-selected-button"]',

  // source: frontend/src/HomePage/HomePage.jsx:2461 (create-new-${apps|modules|workflows}-button)
  createNewAppButton: '[data-cy="create-new-apps-button"]',
  // source: frontend/src/HomePage/HomePage.jsx:2487
  importDropdownToggle: '[data-cy="import-dropdown-menu"]',
  // source: frontend/src/modules/common/components/BaseImportAppMenu/BaseImportAppMenu.jsx:42
  chooseFromTemplateButton: '[data-cy="choose-from-template-button"]',
  // source: frontend/src/modules/common/components/BaseImportAppMenu/BaseImportAppMenu.jsx:50
  importFromDeviceOption: '[data-cy="import-option-label"]',

  // source: frontend/ee/modules/Workflows/pages/WorkflowEditorPage/components/Header/index.jsx:151
  workflowRunButton: '[data-cy="workflow-run-button"]',
  // source: frontend/ee/modules/Workflows/pages/WorkflowEditorPage/components/Header/WorkflowGitCTA.jsx:116
  workflowGitButton: '[data-cy="workflow-git-commit-button"]',
  // source: frontend/ee/modules/Workflows/pages/WorkflowEditorPage/components/LogsPanel/index.jsx:230
  workflowLogsPanel: '[data-cy="logs-panel"]',
  // source: frontend/src/AppBuilder/Header/VersionManager/VersionSwitcherButton.jsx:44
  versionSwitcherButton: '[data-cy="version-switcher-button"]',
  // source: frontend/src/AppBuilder/Header/VersionManager/VersionDropdownItem.jsx:454 (<version-name>-save-version-button)
  versionRowSaveButton: '[data-cy$="-save-version-button"]',
};
