interface IOrgGitConfig {
  id: string;
  git_type: string;
  repo_url: string;
  default_git_branch: string;
  is_branching_enabled: boolean;
  is_git_sync_configured: boolean;
}

interface ICurrentBranch {
  id: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  sourceBranchId: string | null;
  createdBy: string;
  lastSyncedCommit: string;
  appsGitTreeSha: string | null;
  modulesGitTreeSha: string | null;
  dataSourcesGitTreeSha: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IWorkspaceBranchesStore {
  isInitialized: boolean;
  orgGitConfig: IOrgGitConfig | null;
  currentBranch: ICurrentBranch | null;
}
