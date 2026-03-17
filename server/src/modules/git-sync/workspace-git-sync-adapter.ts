import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkspaceGitSyncAdapter {
  async serializeWorkspaceResources(
    _organizationId: string,
    _branchId: string,
    _repoPath: string
  ): Promise<void> {
    // CE stub — no-op
  }

  async deserializeWorkspaceResources(
    _organizationId: string,
    _branchId: string,
    _repoPath: string
  ): Promise<void> {
    // CE stub — no-op
  }
}
