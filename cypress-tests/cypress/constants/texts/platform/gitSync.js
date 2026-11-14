// Git sync user-facing strings; each value cites its source line.

export const gitSyncText = {
  // source: frontend/src/AppBuilder/Header/LockedBranchBanner.jsx:36
  lockBanner: (branchName, pageContext) =>
    `${branchName} is locked. Create a branch to add or edit ${pageContext}.`,
  // source: frontend/src/AppBuilder/Header/LockedBranchBanner.jsx:32
  releasedBranchBanner: "This branch has been released and is now read-only",

  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:234
  switchBranchTitle: "Switch branch",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:242
  switchBranchLocked: "Default branch is locked. Switch branches to make changes.",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:248
  recentBranchesLabel: "RECENT BRANCHES",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:347
  viewInGitRepo: "View in git repo",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:358
  createNewBranch: "Create new branch",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/SwitchBranchModal.jsx:165
  switchedTo: (name) => `Switched to ${name}`,

  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:157
  createBranchTitle: "Create branch",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:62
  branchNameRequired: "Branch name is required",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:63
  branchNameNoSpaces: "Branch name cannot contain spaces",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:65
  branchNameCharset:
    "Branch name can only contain letters, numbers, hyphens, and underscores",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:67
  branchNameDuplicate: "A branch with this name already exists",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:68
  branchNameReserved: "This branch name is reserved",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:93
  branchCreating: "Creating branch. It will show up in the list once ready.",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/CreateBranchModal.jsx:92
  branchImporting: "Importing branch. It will show up in the list once ready.",

  // source: frontend/src/_ui/WorkspaceBranchDropdown/DeleteBranchConfirmModal.jsx:24
  branchDeleting: (name) =>
    `Branch '${name}' is being deleted. Changes will be reflected in a few minutes`,
  // source: frontend/src/AppBuilder/Header/SwitchBranchModal.jsx:405
  cannotDeleteDefault: "Cannot delete default branch",

  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:239
  commitMessageRequired: "Commit message is required",
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:246
  workspacePushSuccess: "Commit was pushed to git successfully!",
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:269
  workspacePullStarted: "Pulling latest changes.",
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:385
  pullSameBranchOnly: "Apps can only be pulled from the same branch",

  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/GitSyncModal.jsx:340 (typo is in the product)
  editorPushSuccess: "Changes commited successfully",
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/GitSyncModal.jsx:401
  editorPullSuccess: "Commit pulled successfully!",

  // source: frontend/src/HomePage/HomePage.jsx:1323
  renameBlockedOnMaster:
    "Renaming isn't allowed on master. Switch branch to update name.",

  // source: frontend/ee/modules/WorkspaceSettings/pages/GitSync/providers/GithubHTTPS/GithubHTTPSModal.jsx:348
  testConnectionVerified: "Test connection verified",
  // source: frontend/ee/modules/WorkspaceSettings/pages/GitSync/providers/GithubHTTPS/GithubHTTPSModal.jsx:491
  configDeleted: "Configuration deleted Successfully!",
  // source: frontend/ee/modules/WorkspaceSettings/pages/GitSync/components/RepositoryConnections/RepositoryConnections.jsx:152
  gitSyncDisabled: "Git sync disabled successfully",
  // source: frontend/ee/modules/WorkspaceSettings/pages/GitSync/components/RepositoryConnections/RepositoryConnections.jsx:321
  oneProviderAtATime: "Only one git sync configuration can be active at a time",

  // source: frontend/src/AppBuilder/Header/LifecycleCTAButton.jsx:141
  lifecycleSync: "Sync",
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:78 (resourceType "app")
  pushUnsyncedAppsTitle: "Push unsynced apps to git",
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:163
  pushUnsyncedCommitMessage: (appName) => `Committed ${appName}`,
  // source: frontend/ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal.jsx:230
  pushUnsyncedSuccess: (defaultBranch) =>
    `Resource(s) pushed successfully. Merge this branch to ${defaultBranch} to complete sync`,

  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:232
  pullConflictTitle: "Cannot pull branch",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:418
  syncFromGitRemoteCategory: "Duplicate data: Sync from git remote",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:19, 141-143
  conflictAppNameRow: (appName) => `App name - '${appName}'`,
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:53
  conflictRemoteBadge: "Remote",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:51
  conflictLocalBadge: "Local",
  // source: frontend/src/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal.jsx:469
  syncSelected: (count) => `Sync selected (${count})`,
  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:304 (shown by App.jsx after the reload)
  conflictSyncedToast: "Resource(s) synced successfully!",

  // source: frontend/src/_ui/WorkspaceGitSyncModal/index.jsx:271
  workspacePullUpToDate: (branchName) =>
    `Already up to date. There are no new commits on ${branchName} to pull.`,
  // source: server/src/modules/versions/service.ts:441
  savedVersionRenameBlocked: "Cannot edit name or description of a saved version.",
};
