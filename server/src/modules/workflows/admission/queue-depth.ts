import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@modules/redis/service';

/*
 * How many runs of a workspace are queued or running (R6, R9): a backlog cap, so one workspace
 * can't fill the shared queue (and Redis) while others wait.
 *
 * Checked before a run is created (RunRateLimitGuard), recorded when it's queued, cleared when its
 * job ends. Checking and recording are separate steps so a refusal never leaves a run row that was
 * created but not queued; concurrent starts can overshoot by a few, which is fine for a backlog cap.
 * Entries expire on their own, so a pod that dies mid-run can't hold a slot forever. Redis errors
 * never block a run: this is a load guard, and the quota and rate limits stay in force.
 */

// An entry outlives the longest plausible queue wait plus run; it only matters if its pod died
const ENTRY_TTL_MS = 2 * 60 * 60 * 1000;

const key = (organizationId: string) => `tj:wfdepth:{${organizationId}}`;

@Injectable()
export class QueueDepthTracker {
  private readonly logger = new Logger(QueueDepthTracker.name);

  constructor(private readonly redisService: RedisService) {}

  /** Whether the workspace already has `limit` runs queued or running. */
  async isFull(organizationId: string | null | undefined, limit: number): Promise<boolean> {
    if (!organizationId) return false;
    try {
      const redis = this.redisService.getClient();
      await redis.zremrangebyscore(key(organizationId), '-inf', Date.now());
      return (await redis.zcard(key(organizationId))) >= limit;
    } catch (error) {
      this.logger.warn(`Queue depth check skipped: Redis is unavailable (${(error as Error)?.message})`);
      return false;
    }
  }

  async track(organizationId: string | null | undefined, runId: string): Promise<void> {
    if (!organizationId) return;
    try {
      const expiresAt = Date.now() + ENTRY_TTL_MS;
      await this.redisService
        .getClient()
        .multi()
        .zadd(key(organizationId), expiresAt, runId)
        .pexpireat(key(organizationId), expiresAt)
        .exec();
    } catch (error) {
      this.logger.warn(`Queued run not tracked: Redis is unavailable (${(error as Error)?.message})`);
    }
  }

  async untrack(organizationId: string | null | undefined, runId: string): Promise<void> {
    if (!organizationId) return;
    try {
      await this.redisService.getClient().zrem(key(organizationId), runId);
    } catch (error) {
      this.logger.warn(`Finished run not untracked: Redis is unavailable (${(error as Error)?.message})`);
    }
  }
}
