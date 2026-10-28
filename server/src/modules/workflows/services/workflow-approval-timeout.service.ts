import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowApprovalTimeoutService {
  async scheduleTimers(): Promise<void> {
    // no-op
  }

  async cancelTimers(): Promise<void> {
    // no-op
  }
}
