import { Injectable } from '@nestjs/common';

/**
 * CE stub – conflict detection is an EE feature.
 * Always resolves without throwing, i.e. no conflicts detected.
 */
@Injectable()
export class PullConflictDetectionService {
  async detectAndThrowConflicts(
    _organizationId: string,
    _branchId: string,
    _repoPath: string
  ): Promise<void> {
    // no-op in CE
  }
}
