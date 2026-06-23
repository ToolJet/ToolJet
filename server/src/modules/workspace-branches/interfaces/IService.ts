import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { User } from '@entities/user.entity';
import { CreateBranchDto, WorkspacePushDto } from '../dto';

export interface WorkspaceBranchListResponse {
  branches: WorkspaceBranch[];
  activeBranchId: string | null;
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

export interface IWorkspaceBranchService {
  list(organizationId: string): Promise<WorkspaceBranchListResponse>;
  // Heavy git work runs on the git-sync queue — the request only validates and enqueues
  createBranch(organizationId: string, dto: CreateBranchDto, user?: User): Promise<{ enqueued: boolean }>;
  switchBranch(
    organizationId: string,
    branchId: string,
    appId?: string
  ): Promise<{ success: boolean; resolvedAppId?: string }>;
  // Heavy delete (remote ref + DB cascade) runs on the git-sync queue — the request only enqueues
  deleteWorkspaceBranch(organizationId: string, branchId: string, user?: User): Promise<{ enqueued: boolean }>;
  pushWorkspace(organizationId: string, dto: WorkspacePushDto, user?: User): Promise<{ success: boolean }>;
  pullWorkspace(
    organizationId: string,
    user?: User,
    sourceBranch?: string,
    branchId?: string
  ): Promise<{ success: boolean }>;
  ensureAppDraft(
    organizationId: string,
    appId: string,
    branchId: string | undefined,
    user: User,
    tagSha?: string,
    tagName?: string
  ): Promise<{ draftVersionId: string | null }>;
  checkForUpdates(organizationId: string, branch?: string): Promise<CheckUpdatesResponse>;
  listRemoteBranches(organizationId: string): Promise<{ branches: any[] }>;
  getPullRequests(organizationId: string): Promise<any>;
}
