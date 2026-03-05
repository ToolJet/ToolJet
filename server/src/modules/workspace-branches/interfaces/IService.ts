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
  switchBranch(organizationId: string, branchId: string): Promise<void>;
  deleteBranch(organizationId: string, branchId: string, user?: User): Promise<void>;
  pushWorkspace(organizationId: string, dto: WorkspacePushDto, user?: User): Promise<{ success: boolean }>;
  pullWorkspace(organizationId: string, user?: User): Promise<{ success: boolean }>;
  checkForUpdates(organizationId: string, branch?: string): Promise<CheckUpdatesResponse>;
}
