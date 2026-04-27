import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * CE stub for ScheduleBootstrapService.
 * Workflow scheduling is an Enterprise-only feature.
 */
@Injectable()
export class ScheduleBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(ScheduleBootstrapService.name);

  async onModuleInit() {
    // No-op in CE: workflow scheduling is an Enterprise feature
    this.logger.log('Workflow scheduling is available in Enterprise Edition');
  }
}
