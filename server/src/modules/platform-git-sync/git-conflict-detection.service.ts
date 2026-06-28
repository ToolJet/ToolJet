import { Injectable } from '@nestjs/common';

@Injectable()
export class GitConflictDetectionService {
  async detectPushConflicts(
    _organizationId: string,
    _branchId: string,
    _repoPath: string,
    _appCoRelationId?: string,
    _scope?: 'app' | 'module' | 'datasource' | 'all'
  ): Promise<void> {
    // CE no-op
  }

  async detectPullConflicts(
    _organizationId: string,
    _branchId: string,
    _repoPath: string,
    _sourceBranchId?: string
  ): Promise<void> {
    // CE no-op
  }
}
