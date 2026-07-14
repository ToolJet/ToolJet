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
  createBranch(organizationId: string, dto: CreateBranchDto, user?: User): Promise<WorkspaceBranch>;
  switchBranch(
    organizationId: string,
    branchId: string,
    appId?: string
  ): Promise<{ success: boolean; resolvedAppId?: string }>;
  deleteBranch(organizationId: string, branchId: string, user?: User): Promise<void>;
  deleteWorkspaceBranch(organizationId: string, branchId: string, user?: User): Promise<{ jobId: string }>;
  pushWorkspace(organizationId: string, dto: WorkspacePushDto, user?: User): Promise<{ success: boolean }>;
  pullWorkspace(
    organizationId: string,
    user?: User,
    sourceBranch?: string,
    branchId?: string,
  ): Promise<{ success: boolean }>;
  pullApp(
    organizationId: string,
    user: User,
    appId: string,
    branchId?: string,
    tagSha?: string,
    tagName?: string,
    tagDescription?: string,
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
    tagDescription?: string,
  ): Promise<{ success: boolean; draftVersionId: string | null }>;
  checkForUpdates(organizationId: string, branch?: string): Promise<CheckUpdatesResponse>;
  listRemoteBranches(organizationId: string): Promise<{ branches: any[] }>;
  getPullRequests(organizationId: string): Promise<any>;
  getEntityTags(organizationId: string, coRelationId: string): Promise<any[]>;
}
