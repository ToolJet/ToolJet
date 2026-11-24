import { CreateBranchResponseDto } from '../dto';
import { WorkspacePullResponseDto } from '../dto';
import { WorkspaceBranchListResponse, CheckUpdatesResponse } from './IService';

export interface IWorkspaceBranchController {
  list(user: any): Promise<WorkspaceBranchListResponse>;
  create(user: any, dto: any): Promise<CreateBranchResponseDto>;
  switchBranch(user: any, branchId: string): Promise<{ success: boolean }>;
  deleteBranch(user: any, branchId: string): Promise<{ enqueued: boolean }>;
  pushWorkspace(user: any, dto: any): Promise<{ success: boolean }>;
  pullWorkspace(user: any): Promise<WorkspacePullResponseDto>;
  checkForUpdates(user: any, branch: string): Promise<CheckUpdatesResponse>;
  listRemoteBranches(user: any): Promise<{ branches: any[] }>;
  getPullRequests(user: any): Promise<any>;
  pullModule(user: any, dto: any): Promise<{ success: boolean; draftVersionId: string | null }>;
}
