import {
  WorkspaceBranchListResponse,
  CheckUpdatesResponse,
  PullWorkspaceResponse,
  BranchReviewStatusResponse,
} from './IService';

export interface IWorkspaceBranchController {
  list(user: any): Promise<WorkspaceBranchListResponse>;
  // Create runs as a background job — the response is an enqueue ack
  create(user: any, dto: any): Promise<{ enqueued: boolean }>;
  switchBranch(user: any, branchId: string): Promise<{ success: boolean }>;
  deleteBranch(user: any, branchId: string): Promise<{ enqueued: boolean }>;
  pushWorkspace(user: any, dto: any): Promise<{ success: boolean }>;
  pullWorkspace(user: any): Promise<PullWorkspaceResponse>;
  checkForUpdates(user: any, branch: string): Promise<CheckUpdatesResponse>;
  listRemoteBranches(user: any): Promise<{ branches: any[] }>;
  getPullRequests(user: any): Promise<any>;
  getBranchReviewStatus(user: any, branchId: string): Promise<BranchReviewStatusResponse>;
  pullModule(user: any, dto: any): Promise<{ success: boolean; draftVersionId: string | null }>;
}
