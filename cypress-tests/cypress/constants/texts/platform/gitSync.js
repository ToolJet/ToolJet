
export const gitSyncText = {
  lockBanner: (branchName, pageContext) =>
    `${branchName} is locked. Create a branch to add or edit ${pageContext}.`,
  releasedBranchBanner: "This branch has been released and is now read-only",

  switchBranchTitle: "Switch branch",
  switchBranchLocked: "Default branch is locked. Switch branches to make changes.",
  recentBranchesLabel: "RECENT BRANCHES",
  viewInGitRepo: "View in git repo",
  createNewBranch: "Create new branch",
  switchedTo: (name) => `Switched to ${name}`,

  createBranchTitle: "Create branch",
  branchNameRequired: "Branch name is required",
  branchNameNoSpaces: "Branch name cannot contain spaces",
  branchNameCharset:
    "Branch name can only contain letters, numbers, hyphens, and underscores",
  branchNameDuplicate: "A branch with this name already exists",
  branchNameReserved: "This branch name is reserved",
  branchCreating: "Creating branch. It will show up in the list once ready.",
  branchImporting: "Importing branch. It will show up in the list once ready.",

  branchDeleting: (name) =>
    `Branch '${name}' is being deleted. Changes will be reflected in a few minutes`,
  cannotDeleteDefault: "Cannot delete default branch",

  commitMessageRequired: "Commit message is required",
  workspacePushSuccess: "Commit was pushed to git successfully!",
  workspacePullStarted: "Pulling latest changes.",
  pullSameBranchOnly: "Apps can only be pulled from the same branch",

  editorPushSuccess: "Changes commited successfully",
  editorPullSuccess: "Commit pulled successfully!",

  renameBlockedOnMaster:
    "Renaming isn't allowed on master. Switch branch to update name.",

  testConnectionVerified: "Test connection verified",
  configDeleted: "Configuration deleted Successfully!",
  gitSyncDisabled: "Git sync disabled successfully",
  oneProviderAtATime: "Only one git sync configuration can be active at a time",

  lifecycleSync: "Sync",
  pushUnsyncedAppsTitle: "Push unsynced apps to git",
  pushUnsyncedCommitMessage: (appName) => `Committed ${appName}`,
  pushUnsyncedSuccess: (defaultBranch) =>
    `Resource(s) pushed successfully. Merge this branch to ${defaultBranch} to complete sync`,

  pullConflictTitle: "Cannot pull branch",
  syncFromGitRemoteCategory: "Duplicate data: Sync from git remote",
  conflictAppNameRow: (appName) => `App name - '${appName}'`,
  conflictRemoteBadge: "Remote",
  conflictLocalBadge: "Local",
  syncSelected: (count) => `Sync selected (${count})`,
  conflictSyncedToast: "Resource(s) synced successfully!",

  workspacePullUpToDate: (branchName) =>
    `Already up to date. There are no new commits on ${branchName} to pull.`,
  savedVersionRenameBlocked: "Cannot edit name or description of a saved version.",
};
