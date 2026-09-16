import { Injectable, OnModuleInit } from '@nestjs/common';

/**
 * CE stub for ApprovalTimeoutBootstrapService.
 * Workflow human-in-the-loop approval timeouts are an Enterprise-only feature.
 */
@Injectable()
export class ApprovalTimeoutBootstrapService implements OnModuleInit {
  async onModuleInit() {
    // No-op in CE: workflow approval timeouts are an Enterprise feature
  }
}
