import { Injectable } from '@nestjs/common';
import { ACTION_TYPE } from '@modules/app-history/constants';

@Injectable()
export class QueueHistoryIntegrationService {
  constructor() {}

  async queueHistoryCapture(
    appVersionId: string,
    actionType: ACTION_TYPE,
    operationScope?: Record<string, any>,
    isAiGenerated?: boolean,
    userId?: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getQueueStats(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async cleanupFailedJobs(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
