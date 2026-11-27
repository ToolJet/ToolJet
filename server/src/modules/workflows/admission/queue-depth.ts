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

const workspaceKey = (organizationId: string) => `tj:wfdepth:{${organizationId}}`;
// Every queued or running run, whatever its workspace (R3: many workspaces can't fill the queue)
const INSTANCE_KEY = 'tj:wfdepth:{instance}';

/** Which backlog is full, if any. */
export type FullBacklog = 'workspace' | 'instance' | null;

@Injectable()
export class QueueDepthTracker {
  private readonly logger = new Logger(QueueDepthTracker.name);

  constructor(private readonly redisService: RedisService) {}

  /** Whether the workspace, or the whole instance, already has its limit of runs queued or running. */
  async fullBacklog(
    organizationId: string | null | undefined,
    limits: { workspace: number; instance: number }
  ): Promise<FullBacklog> {
    try {
      if (organizationId && (await this.size(workspaceKey(organizationId))) >= limits.workspace) return 'workspace';
      if ((await this.size(INSTANCE_KEY)) >= limits.instance) return 'instance';
      return null;
    } catch (error) {
      this.logger.warn(`Queue depth check skipped: Redis is unavailable (${(error as Error)?.message})`);
      return null;
    }
  }

  async track(organizationId: string | null | undefined, runId: string): Promise<void> {
    const expiresAt = Date.now() + ENTRY_TTL_MS;
    for (const key of this.keysOf(organizationId)) {
      try {
        await this.redisService.getClient().multi().zadd(key, expiresAt, runId).pexpireat(key, expiresAt).exec();
      } catch (error) {
        this.logger.warn(`Queued run not tracked: Redis is unavailable (${(error as Error)?.message})`);
      }
    }
  }

  async untrack(organizationId: string | null | undefined, runId: string): Promise<void> {
    for (const key of this.keysOf(organizationId)) {
      try {
        await this.redisService.getClient().zrem(key, runId);
      } catch (error) {
        this.logger.warn(`Finished run not untracked: Redis is unavailable (${(error as Error)?.message})`);
      }
    }
  }

  private keysOf(organizationId: string | null | undefined): string[] {
    return organizationId ? [workspaceKey(organizationId), INSTANCE_KEY] : [INSTANCE_KEY];
  }

  private async size(key: string): Promise<number> {
    const redis = this.redisService.getClient();
    await redis.zremrangebyscore(key, '-inf', Date.now());
    return redis.zcard(key);
  }
}
