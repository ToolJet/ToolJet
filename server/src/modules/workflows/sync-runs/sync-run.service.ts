import { Injectable, NotImplementedException } from '@nestjs/common';

/** CE stub: workflow runs are an EE feature (the implementation is in ee/workflows/sync-runs). */
@Injectable()
export class SyncRunService {
  async execute(): Promise<never> {
    throw new NotImplementedException();
  }

  async previewNode(): Promise<never> {
    throw new NotImplementedException();
  }
}
