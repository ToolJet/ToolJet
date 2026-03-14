import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { User } from '@entities/user.entity';
import { IWorkspaceBranchService, WorkspaceBranchListResponse, CheckUpdatesResponse } from './interfaces/IService';
import { CreateBranchDto, WorkspacePushDto } from './dto';

@Injectable()
export class WorkspaceBranchService implements IWorkspaceBranchService {
  async list(organizationId: string): Promise<WorkspaceBranchListResponse> {
    throw new NotFoundException();
  }

  async createBranch(organizationId: string, dto: CreateBranchDto, user?: User): Promise<WorkspaceBranch> {
    throw new NotFoundException();
  }

  async switchBranch(
    organizationId: string,
    branchId: string,
    appId?: string
  ): Promise<{ success: boolean; resolvedAppId?: string }> {
    throw new NotFoundException();
  }

  async deleteBranch(organizationId: string, branchId: string, user?: User): Promise<void> {
    throw new NotFoundException();
  }

  async pushWorkspace(organizationId: string, dto: WorkspacePushDto, user?: User): Promise<{ success: boolean }> {
    throw new NotFoundException();
  }

  async pullWorkspace(
    organizationId: string,
    user?: User,
    sourceBranch?: string,
    branchId?: string
  ): Promise<{ success: boolean }> {
    throw new NotFoundException();
  }

  async checkForUpdates(organizationId: string, branch?: string): Promise<CheckUpdatesResponse> {
    throw new NotFoundException();
  }

  async listRemoteBranches(organizationId: string): Promise<{ name: string }[]> {
    throw new NotFoundException();
  }

  async getPullRequests(organizationId: string): Promise<any> {
    throw new NotFoundException();
  }
}
