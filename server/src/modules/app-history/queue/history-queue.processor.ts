import { Processor, Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { TransactionLogger } from '@modules/logging/service';

@Injectable()
@Processor('app-history')
export class HistoryQueueProcessor {
  constructor(private readonly logger: TransactionLogger) {}

  @Process('capture-change')
  async handleHistoryCapture(job: Job<any>): Promise<void> {
    const { appVersionId, actionType } = job.data;
    this.logger.log(`[QueueProcessor] Processing history capture for app ${appVersionId}, action: ${actionType}`);
  }
}
