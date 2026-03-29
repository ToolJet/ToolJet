import { Injectable } from '@nestjs/common';
import { TransactionLogger } from '@modules/logging/service';
import { BackgroundProcessorJobStore } from './store';

@Injectable()
export class BackgroundProcessorService {
  constructor(
    private readonly transactionLogger: TransactionLogger,
    private readonly jobStore: BackgroundProcessorJobStore
  ) {}

  /**
   * Returns the observable stream for the given job, but only if
   * the requesting userId matches the job owner.
   */
  getEventStream(jobId: string, userId: string) {
    this.transactionLogger.log(`[BackgroundProcessor] getEventStream invoked for jobId: ${jobId}, userId: ${userId}`);

    const job = this.jobStore.get(jobId);
    if (!job) {
      this.transactionLogger.warn(`[BackgroundProcessor] Job not found for jobId: ${jobId}`);
      return null;
    }

    this.transactionLogger.log(`[BackgroundProcessor] Job found for jobId: ${jobId}, job owner: ${job.userId}`);

    if (job.userId && job.userId !== userId) {
      this.transactionLogger.error(
        `[BackgroundProcessor] Access denied for jobId: ${jobId} - requesting userId: ${userId} does not match job owner: ${job.userId}`
      );
      // If job is not associated with a user or userId matches, allow access. Otherwise, deny.
      return 'FORBIDDEN' as const;
    }

    this.transactionLogger.log(`[BackgroundProcessor] Access granted for jobId: ${jobId}, returning event stream`);
    return job.subject.asObservable();
  }
}
