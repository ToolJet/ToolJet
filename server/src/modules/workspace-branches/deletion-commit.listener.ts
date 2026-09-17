import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class DeletionCommitListener {
  @OnEvent('app.deletion.push-to-git')
  async handleDeletionCommit(_event: any) {
    // No-op in CE — git sync is an EE feature
  }
}
