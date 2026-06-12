import { WorkspaceBranchListResponse, CheckUpdatesResponse } from './IService';

export interface IWorkspaceBranchController {
  list(user: any): Promise<WorkspaceBranchListResponse>;
  // Create runs as a background job — the response is an enqueue ack
  create(user: any, dto: any): Promise<{ enqueued: boolean }>;
  switchBranch(user: any, branchId: string): Promise<{ success: boolean }>;
  deleteBranch(user: any, branchId: string): Promise<{ jobId: string }>;
  pushWorkspace(user: any, dto: any): Promise<{ success: boolean }>;
  pullWorkspace(user: any): Promise<{ success: boolean }>;
  checkForUpdates(user: any, branch: string): Promise<CheckUpdatesResponse>;
  listRemoteBranches(user: any): Promise<{ name: string }[]>;
  getPullRequests(user: any): Promise<any>;
}
