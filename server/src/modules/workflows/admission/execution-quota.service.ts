import { HttpException, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RedisService } from '@modules/redis/service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { resolveWorkflowLimits } from '@modules/workflows/limits/workflow-limits';
import { QuotaPeriod, WorkflowPlanQuota, quotaLimitsFromPlan, quotaPeriods } from './execution-quota.policy';
import { workflowMetrics } from '@modules/workflows/governance-metrics';

/** Stored in workflow_executions.refused_reason for a run that was recorded but never started. */
export const RUN_REFUSED_REASON = {
  EXECUTION_QUOTA: 'execution_quota',
} as const;
export type RunRefusedReason = (typeof RUN_REFUSED_REASON)[keyof typeof RUN_REFUSED_REASON];

/** A daily/monthly execution limit was reached; the run must not start. HTTP 451, as before. */
export class ExecutionQuotaExceededError extends HttpException {
  /** Some callers (the webhook service) read statusCode rather than getStatus(). */
  readonly statusCode = 451;
  readonly reason: RunRefusedReason = RUN_REFUSED_REASON.EXECUTION_QUOTA;

  constructor(message: string) {
    super(message, 451);
  }
}

interface QuotaCounter {
  key: string;
  limit: number;
  period: QuotaPeriod;
  refusal: string;
}

export interface QuotaReservation {
  /** Redis keys incremented for this run; empty when nothing is limited. */
  counters: string[];
}

/*
 * Atomically, for counters in one Redis Cluster slot:
 *   1. a counter that doesn't exist yet is seeded from the database count passed in ARGV, or, if
 *      no seed was passed (-1), reported back as missing so the caller can count and retry;
 *   2. if any counter is at its limit, nothing changes and its index is returned;
 *   3. otherwise every counter is incremented.
 * KEYS: counters. ARGV per counter, in order: limit, ttl ms, seed (-1 = unknown).
 * Returns {0} reserved | {1, i} counter i full | {2, i, j, ...} counters needing a seed
 */
const RESERVE_SCRIPT = `
local missing = {}
for i = 1, #KEYS do
  if redis.call('EXISTS', KEYS[i]) == 0 then
    local seed = tonumber(ARGV[(i - 1) * 3 + 3])
    if seed < 0 then
      table.insert(missing, i)
    else
      redis.call('SET', KEYS[i], seed, 'PX', ARGV[(i - 1) * 3 + 2], 'NX')
    end
  end
end
if #missing > 0 then
  local out = {2}
  for _, i in ipairs(missing) do table.insert(out, i) end
  return out
end
for i = 1, #KEYS do
  if tonumber(redis.call('GET', KEYS[i])) >= tonumber(ARGV[(i - 1) * 3 + 1]) then
    return {1, i}
  end
end
for i = 1, #KEYS do redis.call('INCR', KEYS[i]) end
return {0}
`;

// Counters outlive their period by a day so a run started at 23:59:59 still finds its key
const COUNTER_GRACE_MS = 24 * 60 * 60 * 1000;

const MESSAGES = {
  workspaceDay: 'Maximum daily limit for workflow execution has reached for this workspace',
  workspaceMonth: 'Maximum monthly limit for workflow execution has reached for this workspace',
  instanceDay: 'Maximum daily limit for workflow execution has been reached',
  instanceMonth: 'Maximum monthly limit for workflow execution has been reached',
  notLicensed: 'Workflow is not enabled in the license, contact admin',
};

/*
 * The daily/monthly execution quota for top-level workflow runs (editor, app, public app, webhook,
 * schedule; decision D2). One reservation per run, taken where the run row is created. Unlike the
 * old guards (count, then insert), the reservation is atomic, so concurrent starts can't overshoot.
 * If Redis is unreachable it falls back to the old database check.
 */
@Injectable()
export class ExecutionQuotaService {
  private readonly logger = new Logger(ExecutionQuotaService.name);

  constructor(
    private readonly manager: EntityManager,
    private readonly redisService: RedisService,
    private readonly licenseTermsService: LicenseTermsService
  ) {}

  /** @throws ExecutionQuotaExceededError when a limit is reached or workflows aren't licensed. */
  async reserve(organizationId: string, now: Date = new Date()): Promise<QuotaReservation> {
    const plan = (await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.WORKFLOWS, organizationId)) as
      | WorkflowPlanQuota
      | undefined;
    if (!plan?.workspace && !plan?.instance) throw new ExecutionQuotaExceededError(MESSAGES.notLicensed);

    const limits = quotaLimitsFromPlan(plan, resolveWorkflowLimits(process.env));
    const { day, month } = quotaPeriods(now);
    const ws = `tj:wfq:{ws:${organizationId}}`;
    const instance = 'tj:wfq:{instance}';
    const counters = (entries: Array<[string, number | null, QuotaPeriod, string]>): QuotaCounter[] =>
      entries
        .filter(([, limit]) => limit !== null)
        .map(([key, limit, period, refusal]) => ({ key, limit: limit as number, period, refusal }));

    const workspaceCounters = counters([
      [`${ws}:d:${day.id}`, limits.workspaceDaily, day, MESSAGES.workspaceDay],
      [`${ws}:m:${month.id}`, limits.workspaceMonthly, month, MESSAGES.workspaceMonth],
    ]);
    const instanceCounters = counters([
      [`${instance}:d:${day.id}`, limits.instanceDaily, day, MESSAGES.instanceDay],
      [`${instance}:m:${month.id}`, limits.instanceMonthly, month, MESSAGES.instanceMonth],
    ]);

    try {
      // Different hash tags, so two atomic steps; the first is undone if the second refuses
      await this.reserveAll(workspaceCounters, now, (period) => this.countRuns(period, organizationId));
      try {
        await this.reserveAll(instanceCounters, now, (period) => this.countRuns(period));
      } catch (error) {
        await this.release({ counters: workspaceCounters.map((counter) => counter.key) });
        throw error;
      }
    } catch (error) {
      if (error instanceof ExecutionQuotaExceededError) throw error;
      this.logger.warn(`Execution quota falling back to a database check: Redis is unavailable (${error?.message})`);
      await this.checkWithoutRedis([...workspaceCounters, ...instanceCounters], organizationId);
      return { counters: [] };
    }

    return { counters: [...workspaceCounters, ...instanceCounters].map((counter) => counter.key) };
  }

  /** Gives back a reservation whose run was never created. */
  async release(reservation: QuotaReservation): Promise<void> {
    if (!reservation?.counters.length) return;
    try {
      const pipeline = this.redisService.getClient().pipeline();
      for (const key of reservation.counters) pipeline.decr(key);
      await pipeline.exec();
    } catch (error) {
      this.logger.warn(`Could not release an execution quota reservation (${error?.message})`);
    }
  }

  private async reserveAll(
    counters: QuotaCounter[],
    now: Date,
    countRuns: (period: QuotaPeriod) => Promise<number>
  ): Promise<void> {
    if (!counters.length) return;
    const keys = counters.map((counter) => counter.key);
    const seeds = counters.map(() => -1);

    for (let attempt = 0; attempt < 2; attempt++) {
      const args = counters.flatMap((counter, i) => [
        counter.limit,
        counter.period.end.getTime() - now.getTime() + COUNTER_GRACE_MS,
        seeds[i],
      ]);
      const [outcome, ...indexes] = (await this.redisService
        .getClient()
        .eval(RESERVE_SCRIPT, keys.length, ...keys, ...args)) as number[];

      if (outcome === 0) return;
      if (outcome === 1) {
        workflowMetrics.admissionRefused('quota');
        throw new ExecutionQuotaExceededError(counters[indexes[0] - 1].refusal);
      }
      for (const i of indexes) seeds[i - 1] = await countRuns(counters[i - 1].period);
    }
    throw new Error('execution quota counters could not be seeded');
  }

  /*
   * Top-level runs created in the UTC period: child runs (trigger_type 'workflow') and refused
   * runs don't count. created_at is a timestamp without time zone written in the database's own
   * zone, so the UTC bounds are converted into that zone (keeping the created_at index usable).
   */
  private async countRuns(period: QuotaPeriod, organizationId?: string): Promise<number> {
    const params: unknown[] = [period.start.toISOString(), period.end.toISOString()];
    const workspaceFilter = organizationId ? `AND organization_id = $${params.push(organizationId)}` : '';
    const [row] = await this.manager.query(
      `SELECT COUNT(*) AS count
         FROM workflow_executions
        WHERE created_at >= ($1::timestamptz AT TIME ZONE current_setting('TimeZone'))
          AND created_at < ($2::timestamptz AT TIME ZONE current_setting('TimeZone'))
          AND trigger_type IS DISTINCT FROM 'workflow'
          AND refused_reason IS NULL
          ${workspaceFilter}`,
      params
    );
    return parseInt(row.count, 10);
  }

  /** Redis down: the old check-then-act behaviour, so limits still apply (not atomically). */
  private async checkWithoutRedis(counters: QuotaCounter[], organizationId: string): Promise<void> {
    for (const counter of counters) {
      const isWorkspace = counter.key.includes('{ws:');
      const count = await this.countRuns(counter.period, isWorkspace ? organizationId : undefined);
      if (count >= counter.limit) throw new ExecutionQuotaExceededError(counter.refusal);
    }
  }
}
