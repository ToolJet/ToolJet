import { Injectable } from '@nestjs/common';

// CE stub: an HTTP-only instance may create approval requests but never schedules
// or cancels timeout timers for them (no BullMQ worker attached in CE). The EE
// implementation (server/ee/workflows/services/workflow-approval-timeout.service.ts)
// is the one registered when the timeout queue actually exists.
@Injectable()
export class WorkflowApprovalTimeoutService {
  async scheduleTimers(): Promise<void> {
    // no-op
  }

  async cancelTimers(): Promise<void> {
    // no-op
  }
}
