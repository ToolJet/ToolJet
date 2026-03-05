import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { WorkspaceBranchListResponse, CheckUpdatesResponse } from './IService';

export interface IWorkspaceBranchController {
  list(user: any): Promise<WorkspaceBranchListResponse>;
  create(user: any, dto: any): Promise<WorkspaceBranch>;
  switchBranch(user: any, branchId: string): Promise<{ success: boolean }>;
  deleteBranch(user: any, branchId: string): Promise<{ success: boolean }>;
  pushWorkspace(user: any, dto: any): Promise<{ success: boolean }>;
  pullWorkspace(user: any): Promise<{ success: boolean }>;
  checkForUpdates(user: any, branch: string): Promise<CheckUpdatesResponse>;
}
