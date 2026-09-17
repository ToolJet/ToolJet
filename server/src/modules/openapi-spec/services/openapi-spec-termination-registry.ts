import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { OPENAPI_SPEC_PROCESSING_QUEUE } from '../constants';

// Timed out waiting for an active job to actually stop after termination was requested -
// distinct from "the job itself failed", which is a normal (non-blocking) reason to proceed.
export class OpenApiSpecTerminationTimeoutError extends Error {}

/**
 * Distributed cancellation flag for OpenAPI spec processing jobs, mirroring
 * WorkflowTerminationRegistry. Needed for two reasons:
 *  - Correctness: the processor's final step deletes-and-reinserts openapi_spec_operations
 *    rows for (dataSourceId, environmentId). A cancelled-then-replaced job pair must never
 *    run that write concurrently, or the rows end up interleaved/corrupted.
 *  - BullMQ can't interrupt code already blocked on a network call (e.g. fetching a spec
 *    from an unresponsive URL) - only a flag checked cooperatively between steps can.
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
    // Reuse the same Redis instance as the queue, matching WorkflowTerminationRegistry.
    this.redis = new Redis(this.queue.opts.connection as RedisOptions);
  }

  onModuleInit(): void {
    // Only needed for terminateAndWait's job.waitUntilFinished call below - reuses the same
    // connection config idiom as WorkflowStreamService's QueueEvents instance.
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

  // Used by datasource delete, which must not proceed while a job for that datasource may
  // still be writing to openapi_spec_operations. Sets the flag, then:
  //  - a waiting/delayed job (never started) is removed from the queue outright
  //  - an active job is waited on (bounded by timeoutMs) via the processor's own cooperative
  //    termination check - throws OpenApiSpecTerminationTimeoutError if it doesn't stop in time,
  //    so the caller can refuse to delete rather than proceeding against a still-running job
  //  - if the job fails for any OTHER reason while we're waiting, that still means it's no
  //    longer running, so this resolves normally rather than treating it as a blocker
  async terminateAndWait(
    dataSourceId: string,
    environmentId: string,
    jobId: string | number | undefined,
    timeoutMs = 30000
  ): Promise<void> {
    await this.requestTermination(dataSourceId, environmentId);

    if (!jobId) return;
    const job = await this.queue.getJob(String(jobId));
    if (!job) return;

    const state = await job.getState();
    if (['waiting', 'delayed'].includes(state)) {
      await job.remove();
      return;
    }
    if (['completed', 'failed'].includes(state)) return;

    try {
      await job.waitUntilFinished(this.queueEvents, timeoutMs);
    } catch (error) {
      if ((error as Error).message?.includes('timed out before finishing')) {
        throw new OpenApiSpecTerminationTimeoutError(
          `OpenAPI spec processing job ${jobId} for datasource ${dataSourceId}, environment ${environmentId} did not ` +
            `stop within ${timeoutMs}ms of requesting termination - refusing to proceed while it may still be running.`
        );
      }
      // Job failed for an unrelated reason - it's no longer active, safe to proceed.
      this.logger.warn(
        `OpenAPI spec job ${jobId} for datasource ${dataSourceId} ended with an error while awaiting termination (treated as stopped): ${
          (error as Error).message
        }`
      );
    }
  }
}
