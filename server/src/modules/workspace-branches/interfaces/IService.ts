import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { User } from '@entities/user.entity';
import { CreateBranchDto, WorkspacePushDto, PullConflictResolutionDto } from '../dto';

export interface WorkspaceBranchListResponse {
  branches: WorkspaceBranch[];
  activeBranchId: string | null;
  // Whether the workspace supports multiple branches. When false (single-branch mode) only the
  // default branch is returned and the UI disables branch create / switch.
  isMultiBranchingEnabled?: boolean;
}

// A branch's pull request into the default branch, as the git provider reports it.
export interface BranchPullRequest {
  number: number;
  url: string;
  status: 'open' | 'merged' | 'closed';
  mergedAt: string | null;
}

// Where a git branch stands for its pull request: each app draft's review, and whether every committed app is
// approved (`ready`). `pullRequest` is null when there is none, or when the provider could not be asked
// (`pullRequestError`).
export interface BranchReviewStatusResponse {
  branchName: string;
  defaultBranchName: string | null;
  isDefault: boolean;
  pullRequest: BranchPullRequest | null;
  pullRequestError: string | null;
  apps: Array<{
    appId: string;
    versionId: string;
    name: string;
    reviewId: string | null;
    status: string;
    mergedWithoutApproval: boolean;
  }>;
  ready: boolean;
}

export interface CheckUpdatesResponse {
  hasUpdates: boolean;
  latestCommit: {
    message: string;
    author: string;
    date: string;
    sha: string;
  } | null;
}

// upToDate: the remote branch HEAD hasn't moved since the last full pull, so the pull was skipped
export interface PullWorkspaceResponse {
  success: boolean;
  upToDate?: boolean;
}

export interface IWorkspaceBranchService {
  list(organizationId: string, userId?: string): Promise<WorkspaceBranchListResponse>;
  createBranch(
    organizationId: string,
    dto: CreateBranchDto,
    user?: User
  ): Promise<{ enqueued: boolean; isImport: boolean }>;
  switchBranch(
    organizationId: string,
    branchId: string,
    appId?: string,
    userId?: string
  ): Promise<{ success: boolean; resolvedAppId?: string }>;
  // Heavy delete (remote ref + DB cascade) runs on the git-sync queue — the request only enqueues
  deleteWorkspaceBranch(organizationId: string, branchId: string, user?: User): Promise<{ enqueued: boolean }>;
  pushWorkspace(organizationId: string, dto: WorkspacePushDto, user?: User): Promise<{ success: boolean }>;
  pullWorkspace(
    organizationId: string,
    user?: User,
    sourceBranch?: string,
    branchId?: string
  ): Promise<PullWorkspaceResponse>;
  resolveConflicts(
    organizationId: string,
    resolutions: PullConflictResolutionDto[],
    branchId?: string
  ): Promise<{ success: boolean }>;
  pullApp(
    organizationId: string,
    user: User,
    appId: string,
    branchId?: string,
    tagSha?: string,
    tagName?: string,
    tagDescription?: string
  ): Promise<{ success: boolean; draftVersionId: string | null }>;
  ensureAppDraft(
    organizationId: string,
    appId: string,
    branchId: string | undefined,
    user: User,
    tagSha?: string,
    tagName?: string
  ): Promise<{ draftVersionId: string | null }>;
  pullModule(
    organizationId: string,
    user: User,
    moduleId: string,
    branchId?: string,
    tagSha?: string,
    tagName?: string,
    tagDescription?: string
  ): Promise<{ success: boolean; draftVersionId: string | null }>;
  checkForUpdates(organizationId: string, branch?: string): Promise<CheckUpdatesResponse>;
  listRemoteBranches(organizationId: string): Promise<{ branches: any[] }>;
  getPullRequests(organizationId: string): Promise<any>;
  getBranchReviewStatus(organizationId: string, branchId: string): Promise<BranchReviewStatusResponse>;
  getEntityTags(organizationId: string, coRelationId: string): Promise<any[]>;
}
