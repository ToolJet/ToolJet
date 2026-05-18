import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TransactionLogger } from '@modules/logging/service';
import { BackgroundProcessorJobStore } from './store';
import { SseProgressEvent } from './types';

@Injectable()
export class BackgroundProcessorService {
  constructor(
    private readonly transactionLogger: TransactionLogger,
    private readonly jobStore: BackgroundProcessorJobStore
  ) {}

  /**
   * Returns the observable stream for the given job, but only if
   * the requesting userId matches the job owner.
   *
   * Works across pods via Redis pub/sub - the SSE request can hit any pod
   * and will receive events from the executor pod.
   */
  async getEventStream(jobId: string, userId: string): Promise<Observable<SseProgressEvent> | null | 'FORBIDDEN'> {
    this.transactionLogger.log(`[BackgroundProcessor] getEventStream invoked for jobId: ${jobId}, userId: ${userId}`);

    // Check job metadata from Redis
    const metadata = await this.jobStore.getMetadata(jobId);
    if (!metadata) {
      this.transactionLogger.warn(`[BackgroundProcessor] Job not found for jobId: ${jobId}`);
      return null;
    }

    this.transactionLogger.log(`[BackgroundProcessor] Job found for jobId: ${jobId}, job owner: ${metadata.userId}`);

    if (metadata.userId && metadata.userId !== userId) {
      this.transactionLogger.error(
        `[BackgroundProcessor] Access denied for jobId: ${jobId} - requesting userId: ${userId} does not match job owner: ${metadata.userId}`
      );
      return 'FORBIDDEN' as const;
    }

    this.transactionLogger.log(`[BackgroundProcessor] Access granted for jobId: ${jobId}, subscribing to event stream`);

    // Subscribe to Redis channel and return Observable
    return this.jobStore.subscribeToEvents(jobId);
  }

  /**
   * Cleans up SSE subscription resources when client disconnects.
   * Called by controller's finalize operator.
   */
  cleanupSubscription(jobId: string): void {
    this.transactionLogger.log(`[BackgroundProcessor] cleanupSubscription called for jobId: ${jobId}`);
    this.jobStore.cleanupSubscription(jobId);
  }
}
