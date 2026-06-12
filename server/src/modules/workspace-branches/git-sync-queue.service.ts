import { Injectable } from '@nestjs/common';

// CE stub. Workspace branches are EE-only (the CE service throws NotFound on
// every endpoint), so nothing ever enqueues here. Inert no-ops keep the module
// graph identical across editions.
@Injectable()
export class GitSyncQueueService {
  async enqueueCreateBranch(_payload: unknown): Promise<void> {
    // no queue in CE
  }

  async enqueuePullBranch(_payload: unknown): Promise<void> {
    // no queue in CE
  }

  async enqueueDeleteBranch(_payload: unknown): Promise<void> {
    // no queue in CE
  }
}
