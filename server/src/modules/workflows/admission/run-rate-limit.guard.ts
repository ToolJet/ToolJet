import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisThrottlerStorage } from '@modules/rate-limit/redis-throttler-storage';
import { RedisRateLimiter } from '@modules/rate-limit/redis-rate-limiter';
import { resolveWorkflowLimits, WorkflowLimits } from '@modules/workflows/limits/workflow-limits';
import { RateBucket, RUN_RATE_WINDOW_MS, RunCaller, RunEntry, runRateBuckets } from './run-rate-limits';
import { QueueDepthTracker } from './queue-depth';

const RUN_ENTRY_KEY = 'tj:workflow-run-entry';

/** Marks a route as starting a workflow run; RunRateLimitGuard applies that entry's limits. */
export const RunEntryRoute = (entry: RunEntry) => SetMetadata(RUN_ENTRY_KEY, entry);

interface RunRequest {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: { id?: string };
  body?: { appId?: string } & Record<string, unknown>;
  tj_app?: { id?: string; organizationId?: string; type?: string };
  tj_workflow_query?: { options?: { workflowId?: string } };
}

/*
 * Admission checks for the routes marked with @RunEntryRoute, after the route's auth guards, which
 * resolve the caller (request.user) and the app (request.tj_app, request.tj_workflow_query):
 *   1. trigger payload size (R9): the body becomes job data in Redis; previews are exempt, since a
 *      builder's preview state is legitimately large and only signed-in builders send it;
 *   2. per-minute run-start limits, counted in Redis so they hold across pods. If Redis is down,
 *      signed-in callers fall back to per-pod counting; anonymous callers are refused (D27);
 *   3. the workspace's backlog of queued and running runs (QueueDepthTracker).
 */
@Injectable()
export class RunRateLimitGuard implements CanActivate {
  private readonly limits: WorkflowLimits = resolveWorkflowLimits(process.env);

  constructor(
    private readonly reflector: Reflector,
    private readonly storage: RedisThrottlerStorage,
    private readonly rateLimiter: RedisRateLimiter,
    private readonly queueDepth: QueueDepthTracker
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entry = this.reflector.get<RunEntry>(RUN_ENTRY_KEY, context.getHandler());
    if (!entry) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<RunRequest>();
    if (entry !== 'preview' && payloadBytes(request.body) > this.limits.trigger.maxPayloadBytes) {
      throw new PayloadTooLargeException(
        `The workflow input is larger than the ${this.limits.trigger.maxPayloadBytes} bytes allowed`
      );
    }

    const caller = callerOf(entry, request);
    const anonymous = entry === 'app' && !caller.userId;
    let retryAfterSeconds = 0;
    for (const bucket of runRateBuckets(entry, caller, this.limits)) {
      const blockedForSeconds = anonymous ? await this.chargeStrict(bucket) : await this.charge(bucket);
      retryAfterSeconds = Math.max(retryAfterSeconds, blockedForSeconds);
    }
    if (!retryAfterSeconds) {
      if (
        entry !== 'preview' &&
        (await this.queueDepth.isFull(caller.organizationId, this.limits.concurrency.queuedRunsPerWorkspace))
      ) {
        throw new HttpException(
          'Too many workflow runs are queued for this workspace. Try again shortly.',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
      return true;
    }

    http.getResponse().setHeader('Retry-After', String(retryAfterSeconds));
    throw new HttpException(
      `Too many workflow runs. Try again in ${retryAfterSeconds} seconds.`,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }

  /** Seconds the bucket stays blocked (0 = allowed); per-pod counting if Redis is down. */
  private async charge(bucket: RateBucket): Promise<number> {
    const record = await this.storage.increment(
      `wf-run:${bucket.key}`,
      RUN_RATE_WINDOW_MS,
      bucket.limit,
      RUN_RATE_WINDOW_MS,
      'run'
    );
    return record.isBlocked ? record.timeToBlockExpire : 0;
  }

  /** Same counters as charge(), but refuses rather than counting per pod when Redis is down. */
  private async chargeStrict(bucket: RateBucket): Promise<number> {
    try {
      // The throttler storage keys its counters `${key}:${throttlerName}`; share them
      const hit = await this.rateLimiter.hit(`wf-run:${bucket.key}:run`, {
        windowMs: RUN_RATE_WINDOW_MS,
        limit: bucket.limit,
        blockMs: RUN_RATE_WINDOW_MS,
      });
      return hit.isBlocked ? Math.ceil(hit.timeToBlockExpireMs / 1000) : 0;
    } catch {
      throw new ServiceUnavailableException(
        'Workflow runs from public apps are unavailable right now. Try again later.'
      );
    }
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function payloadBytes(body: unknown): number {
  return body ? Buffer.byteLength(JSON.stringify(body)) : 0;
}

/** For app triggers request.tj_app is the calling app; the workflow comes from its saved query. */
function callerOf(entry: RunEntry, request: RunRequest): RunCaller {
  const workflowId =
    entry === 'webhook' ? request.tj_app?.id : (request.tj_workflow_query?.options?.workflowId ?? request.body?.appId);
  return {
    userId: request.user?.id,
    ip: request.ip,
    workflowId,
    // The editor's routes resolve no app; JwtAuthGuard has checked the user belongs to this workspace
    organizationId: request.tj_app?.organizationId ?? firstHeader(request.headers?.['tj-workspace-id']),
  };
}
