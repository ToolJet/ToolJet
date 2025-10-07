import { Injectable, OnModuleInit } from '@nestjs/common';

/**
 * CE stub for ScheduleBootstrapService.
 * Workflow scheduling is an Enterprise-only feature.
 */
@Injectable()
export class ScheduleBootstrapService implements OnModuleInit {
  async onModuleInit() {
    // No-op in CE: workflow scheduling is an Enterprise feature
    console.log('ℹ️ Workflow scheduling is available in Enterprise Edition');
  }
}
