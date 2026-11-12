// Git sync user-facing strings. Every value cites its source line; update the
// citation when the source moves. Paths are relative to the repo root.

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
};
