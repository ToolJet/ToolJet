import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisThrottlerStorage } from '@modules/rate-limit/redis-throttler-storage';
import { resolveWorkflowLimits, WorkflowLimits } from '@modules/workflows/limits/workflow-limits';
import { RUN_RATE_WINDOW_MS, RunCaller, RunEntry, runRateBuckets } from './run-rate-limits';

const RUN_ENTRY_KEY = 'tj:workflow-run-entry';

/** Marks a route as starting a workflow run; RunRateLimitGuard applies that entry's limits. */
export const RunEntryRoute = (entry: RunEntry) => SetMetadata(RUN_ENTRY_KEY, entry);

interface RunRequest {
  ip?: string;
  user?: { id?: string };
  body?: { appId?: string };
  tj_app?: { id?: string; organizationId?: string; type?: string };
  tj_workflow_query?: { options?: { workflowId?: string } };
}

/*
 * Per-minute run-start limits for the routes marked with @RunEntryRoute. Goes after the route's
 * auth guards, which resolve the caller (request.user) and the app (request.tj_app,
 * request.tj_workflow_query). Counts in Redis through the shared throttler storage, so limits hold
 * across pods and fall back to per-pod counting if Redis is down.
 */
@Injectable()
export class RunRateLimitGuard implements CanActivate {
  private readonly limits: WorkflowLimits = resolveWorkflowLimits(process.env);

  constructor(
    private readonly reflector: Reflector,
    private readonly storage: RedisThrottlerStorage
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entry = this.reflector.get<RunEntry>(RUN_ENTRY_KEY, context.getHandler());
    if (!entry) return true;

    const http = context.switchToHttp();
    const request = http.getRequest<RunRequest>();
    const buckets = runRateBuckets(entry, callerOf(entry, request), this.limits);

    let retryAfterSeconds = 0;
    for (const bucket of buckets) {
      const record = await this.storage.increment(
        `wf-run:${bucket.key}`,
        RUN_RATE_WINDOW_MS,
        bucket.limit,
        RUN_RATE_WINDOW_MS,
        'run'
      );
      if (record.isBlocked) retryAfterSeconds = Math.max(retryAfterSeconds, record.timeToBlockExpire);
    }
    if (!retryAfterSeconds) return true;

    http.getResponse().setHeader('Retry-After', String(retryAfterSeconds));
    throw new HttpException(
      `Too many workflow runs. Try again in ${retryAfterSeconds} seconds.`,
      HttpStatus.TOO_MANY_REQUESTS
    );
  }
}

/** For app triggers request.tj_app is the calling app; the workflow comes from its saved query. */
function callerOf(entry: RunEntry, request: RunRequest): RunCaller {
  const workflowId =
    entry === 'webhook' ? request.tj_app?.id : (request.tj_workflow_query?.options?.workflowId ?? request.body?.appId);
  return {
    userId: request.user?.id,
    ip: request.ip,
    workflowId,
    organizationId: request.tj_app?.organizationId,
  };
}
