import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue, QueueEvents } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { OPENAPI_SPEC_PROCESSING_QUEUE } from '../constants';

/**
 * Redis-backed cancellation flag for OpenAPI spec jobs (mirrors WorkflowTerminationRegistry).
 * BullMQ can't interrupt an active job, so the processor checks this flag between steps.
 */
@Injectable()
export class OpenApiSpecTerminationRegistry implements OnModuleInit, OnModuleDestroy {
  private readonly TERMINATION_KEY_PREFIX = 'openapi-spec:terminate:';
  private readonly redis: Redis;
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue(OPENAPI_SPEC_PROCESSING_QUEUE) private readonly queue: Queue,
    private readonly logger: Logger
  ) {
    this.redis = new Redis(this.queue.opts.connection as RedisOptions);
  }

  onModuleInit(): void {
    // Required by job.waitUntilFinished in terminateAndWait.
    this.queueEvents = new QueueEvents(OPENAPI_SPEC_PROCESSING_QUEUE, {
      connection: this.queue.opts.connection as RedisOptions,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents?.close();
  }

  private key(dataSourceId: string, environmentId: string): string {
    return `${this.TERMINATION_KEY_PREFIX}${dataSourceId}:${environmentId}`;
  }

  async requestTermination(dataSourceId: string, environmentId: string): Promise<void> {
    await this.redis.set(this.key(dataSourceId, environmentId), new Date().toISOString());
    this.logger.log(`OpenAPI spec termination flag set for datasource ${dataSourceId}, environment ${environmentId}`);
  }

  async isTerminated(dataSourceId: string, environmentId: string): Promise<boolean> {
    try {
      const value = await this.redis.get(this.key(dataSourceId, environmentId));
      return value !== null;
    } catch (error) {
      // Fail-open: if Redis is unavailable, don't block processing (BullMQ is affected too).
      this.logger.error(
        `Failed to check OpenAPI spec termination status for datasource ${dataSourceId}, environment ${environmentId}, continuing`,
        error
      );
      return false;
    }
  }

  async clear(dataSourceId: string, environmentId: string): Promise<void> {
    try {
      await this.redis.del(this.key(dataSourceId, environmentId));
    } catch (error) {
      this.logger.warn(`Failed to clear OpenAPI spec termination flag for datasource ${dataSourceId}`, error);
    }
  }

  // BullMQ can't remove an active job; it stops cooperatively on the termination flag.
  // Returns the job unless it does not exist or was removed here.
  async removeIfQueued(jobId: string | number | undefined): Promise<Job | null> {
    if (!jobId) return null;
    const job = await this.queue.getJob(String(jobId));
    if (!job) return null;
    if (['waiting', 'delayed'].includes(await job.getState())) {
      await job.remove();
      return null;
    }
    return job;
  }

  // Resolves once the job is no longer running (removed, finished, or failed for any reason).
  // Throws only if it is still active after timeoutMs.
  async terminateAndWait(
    dataSourceId: string,
    environmentId: string,
    jobId: string | number | undefined,
    timeoutMs = 30000
  ): Promise<void> {
    await this.requestTermination(dataSourceId, environmentId);

    const job = await this.removeIfQueued(jobId);
    if (!job || ['completed', 'failed'].includes(await job.getState())) return;

    try {
      await job.waitUntilFinished(this.queueEvents, timeoutMs);
    } catch (error) {
      if ((error as Error).message?.includes('timed out before finishing')) {
        throw new Error(
          `OpenAPI spec processing job ${jobId} for datasource ${dataSourceId}, environment ${environmentId} did not ` +
            `stop within ${timeoutMs}ms of requesting termination - refusing to proceed while it may still be running.`
        );
      }
      this.logger.warn(
        `OpenAPI spec job ${jobId} for datasource ${dataSourceId} ended with an error while awaiting termination (treated as stopped): ${
          (error as Error).message
        }`
      );
    }
  }
}
