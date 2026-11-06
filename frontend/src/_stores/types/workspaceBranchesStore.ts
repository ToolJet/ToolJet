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

// Server responses of the git calls are not typed yet, hence `unknown`; narrow at the call site.
interface IPushOptions {
  deletionOnly?: boolean;
  onlyUnsyncedDatasources?: boolean;
}

export interface IWorkspaceBranchesActions {
  initialize: (workspaceId: string) => Promise<void>;
  reinitialize: (workspaceId: string) => Promise<void>;
  fetchBranches: () => Promise<void>;
  createBranch: (
    name: string,
    sourceBranchId?: string | null,
    commitSha?: string,
    appId?: string,
    versionId?: string,
    confirmImport?: boolean
  ) => Promise<unknown>;
  switchBranch: (branchId: string) => void;
  deleteBranch: (branchId: string) => Promise<void>;
  /** Tracks `isDeletingBranch` / `deleteBranchError`, and rethrows the error. */
  deleteWorkspaceBranch: (branchId: string) => Promise<{ success: true }>;
  pushWorkspace: (
    commitMessage: string,
    targetBranch?: string,
    options?: IPushOptions,
    scope?: string
  ) => Promise<unknown>;
  /** Pulls into `targetBranchId`, or the active branch when omitted. */
  pullWorkspace: (sourceBranch?: string, targetBranchId?: string) => Promise<unknown>;
  resolveConflicts: (resolutions: unknown, targetBranchId?: string) => Promise<unknown>;
  pullApp: (appId: string, tagSha?: string, tagName?: string, tagDescription?: string) => Promise<unknown>;
  pullModule: (moduleId: string, tagSha?: string, tagName?: string, tagDescription?: string) => Promise<unknown>;
  setPullingModuleComponentId: (componentId?: string | null) => void;
  setHasUnsyncedDatasources: (value: boolean) => void;
  fetchRemoteBranches: () => Promise<{ name: string }[]>;
  loadMoreRemoteBranches: () => void;
  checkForUpdates: (branch?: string) => Promise<unknown>;
  /** Synchronous: answers from the branches already in the store (database first, then remote). */
  checkBranchExistsOnRemote: (branchName: string) => boolean;
  resetRemoteBranches: () => void;
  resetDeleteState: () => void;
  clearActiveBranchContext: () => void;
  reset: () => void;
}

// Partial: only the state read from TypeScript files is typed so far (the store is still JS).
// Add fields here as TS code needs them, and use this type for selectors in TS files.
export interface IWorkspaceBranchesStore {
  isInitialized: boolean;
  isGitSyncConfigured: boolean;
  orgGitConfig: IOrgGitConfig | null;
  currentBranch: ICurrentBranch | null;
  actions: IWorkspaceBranchesActions;
}
