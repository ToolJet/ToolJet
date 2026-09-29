import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ApprovalTimeoutBootstrapService implements OnModuleInit {
  async onModuleInit() {
    // No-op in CE: workflow approval timeouts are an Enterprise feature
  }
}
