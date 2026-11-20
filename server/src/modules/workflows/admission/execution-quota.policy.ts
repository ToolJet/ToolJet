import { LICENSE_LIMIT } from '@modules/licensing/constants';
import { WorkflowLimits, positiveOr } from '@modules/workflows/limits/workflow-limits';

/*
 * Pure rules for the daily/monthly execution quota. The service (execution-quota.service.ts) does
 * the counting; these decide which limits apply and which period a run falls in.
 */

export interface QuotaPeriod {
  /** Stable id used in Redis keys: YYYY-MM-DD or YYYY-MM. */
  id: string;
  start: Date;
  end: Date;
}

/** The UTC day and month containing `now` (decision D14). */
export function quotaPeriods(now: Date): { day: QuotaPeriod; month: QuotaPeriod } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    day: {
      id: `${y}-${pad(m + 1)}-${pad(d)}`,
      start: new Date(Date.UTC(y, m, d)),
      end: new Date(Date.UTC(y, m, d + 1)),
    },
    month: { id: `${y}-${pad(m + 1)}`, start: new Date(Date.UTC(y, m, 1)), end: new Date(Date.UTC(y, m + 1, 1)) },
  };
}

/** The `workflows` section of the licence terms, as it may arrive ('' and strings included). */
export interface WorkflowPlanQuota {
  workspace?: { daily_executions?: unknown; monthly_executions?: unknown };
  instance?: { daily_executions?: unknown; monthly_executions?: unknown };
}

/** null = no limit. */
export interface QuotaLimits {
  workspaceDaily: number | null;
  workspaceMonthly: number | null;
  instanceDaily: number | null;
  instanceMonthly: number | null;
}

/*
 * 'UNLIMITED' means no limit. A section the plan doesn't have means no limit at that level (as
 * today). Within a section, '', null, missing, 0 or a non-number means the default cap from the
 * limits policy (decision D17): neither unlimited nor "refuse everything", which is what the old
 * guards did with ''.
 */
export function quotaLimitsFromPlan(plan: WorkflowPlanQuota | undefined, limits: WorkflowLimits): QuotaLimits {
  const read = (section: { [key: string]: unknown } | undefined, key: string, fallback: number) => {
    if (!section) return null;
    const value = section[key];
    return value === LICENSE_LIMIT.UNLIMITED ? null : positiveOr(value, fallback);
  };
  const defaults = limits.quotaDefaults;
  return {
    workspaceDaily: read(plan?.workspace, 'daily_executions', defaults.workspaceDailyExecutions),
    workspaceMonthly: read(plan?.workspace, 'monthly_executions', defaults.workspaceMonthlyExecutions),
    instanceDaily: read(plan?.instance, 'daily_executions', defaults.instanceDailyExecutions),
    instanceMonthly: read(plan?.instance, 'monthly_executions', defaults.instanceMonthlyExecutions),
  };
}
