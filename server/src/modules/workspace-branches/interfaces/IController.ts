import { WorkspaceBranchListResponse, CheckUpdatesResponse } from './IService';
import { CreateBranchResponseDto } from '../dto';

export interface IWorkspaceBranchController {
  list(user: any): Promise<WorkspaceBranchListResponse>;
  // Small workspaces run inline (enqueued: false, branch returned); large ones enqueue a background job
  create(user: any, dto: any): Promise<CreateBranchResponseDto>;
  switchBranch(user: any, branchId: string): Promise<{ success: boolean }>;
  deleteBranch(user: any, branchId: string): Promise<{ enqueued: boolean }>;
  pushWorkspace(user: any, dto: any): Promise<{ success: boolean }>;
  pullWorkspace(user: any): Promise<{ success: boolean }>;
  checkForUpdates(user: any, branch: string): Promise<CheckUpdatesResponse>;
  listRemoteBranches(user: any): Promise<{ branches: any[] }>;
  getPullRequests(user: any): Promise<any>;
  pullModule(user: any, dto: any): Promise<{ success: boolean; draftVersionId: string | null }>;
}
