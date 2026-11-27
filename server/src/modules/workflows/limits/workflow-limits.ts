/*
 * One place for every number that bounds workflow runs. Order: built-in defaults, then the plan
 * (only the run timeout comes from the plan today), then env overrides for operators. Every value
 * is normalised with positiveOr, so 0, '', null, negative or non-numeric input means "use the
 * fallback": on a shared server no limit silently becomes unbounded.
 *
 * Phase 0 defines the policy; later phases read it (admission, run budget, node limits).
 */

export interface WorkflowLimits {
  run: {
    timeoutSeconds: number;
    maxNodes: number;
    maxDepth: number;
    maxChildren: number;
    maxLoopIterations: number;
    maxFilterItems: number;
    maxLogEntries: number;
    maxLogBytes: number;
    maxNodeResultBytes: number;
    maxStateBytes: number;
    /** Default per-step deadline for queries, HTTP and agent calls (capped by the run's remaining time). */
    stepTimeoutMs: number;
  };
  trigger: { maxPayloadBytes: number };
  ratesPerMinute: {
    anonymousPerWorkflow: number;
    anonymousPerWorkspace: number;
    anonymousPerIp: number;
    appPerUserPerWorkflow: number;
    webhookPerWorkflow: number;
    editorPerUser: number;
  };
  concurrency: {
    activeRunsPerWorkspace: number;
    queuedRunsPerWorkspace: number;
    waitingSyncRequestsPerPod: number;
  };
  waiting: { maxWaitingRunsPerWorkspace: number };
  schedules: { maxPerWorkflow: number; maxPerWorkspace: number };
  /** Daily/monthly execution caps used when the plan's value is '', null or missing (decision D17). */
  quotaDefaults: {
    workspaceDailyExecutions: number;
    workspaceMonthlyExecutions: number;
    instanceDailyExecutions: number;
    instanceMonthlyExecutions: number;
  };
}

const MB = 1024 * 1024;

export const DEFAULT_WORKFLOW_LIMITS: WorkflowLimits = Object.freeze({
  run: {
    timeoutSeconds: 60,
    maxNodes: 1000,
    maxDepth: 5,
    maxChildren: 50,
    maxLoopIterations: 1000,
    maxFilterItems: 10000,
    maxLogEntries: 1000,
    maxLogBytes: 1 * MB,
    maxNodeResultBytes: 5 * MB,
    maxStateBytes: 20 * MB,
    stepTimeoutMs: 30_000,
  },
  trigger: { maxPayloadBytes: 1 * MB },
  ratesPerMinute: {
    anonymousPerWorkflow: 30,
    anonymousPerWorkspace: 120,
    anonymousPerIp: 20,
    appPerUserPerWorkflow: 60,
    webhookPerWorkflow: 100,
    editorPerUser: 60,
  },
  concurrency: { activeRunsPerWorkspace: 10, queuedRunsPerWorkspace: 200, waitingSyncRequestsPerPod: 100 },
  waiting: { maxWaitingRunsPerWorkspace: 500 },
  schedules: { maxPerWorkflow: 20, maxPerWorkspace: 200 },
  // The Basic plan's values
  quotaDefaults: {
    workspaceDailyExecutions: 500,
    workspaceMonthlyExecutions: 10000,
    instanceDailyExecutions: 25000,
    instanceMonthlyExecutions: 50000,
  },
}) as WorkflowLimits;

type Section = keyof WorkflowLimits;
type LimitPath = { [S in Section]: `${S}.${Extract<keyof WorkflowLimits[S], string>}` }[Section];

/** The env var that overrides each limit. The run timeout keeps its existing name. */
export const WORKFLOW_LIMIT_ENV_VARS: Record<LimitPath, string> = {
  'run.timeoutSeconds': 'WORKFLOW_TIMEOUT_SECONDS',
  'run.maxNodes': 'WORKFLOW_LIMIT_MAX_NODES',
  'run.maxDepth': 'WORKFLOW_LIMIT_MAX_DEPTH',
  'run.maxChildren': 'WORKFLOW_LIMIT_MAX_CHILDREN',
  'run.maxLoopIterations': 'WORKFLOW_LIMIT_MAX_LOOP_ITERATIONS',
  'run.maxFilterItems': 'WORKFLOW_LIMIT_MAX_FILTER_ITEMS',
  'run.maxLogEntries': 'WORKFLOW_LIMIT_MAX_LOG_ENTRIES',
  'run.maxLogBytes': 'WORKFLOW_LIMIT_MAX_LOG_BYTES',
  'run.maxNodeResultBytes': 'WORKFLOW_LIMIT_MAX_NODE_RESULT_BYTES',
  'run.maxStateBytes': 'WORKFLOW_LIMIT_MAX_STATE_BYTES',
  'run.stepTimeoutMs': 'WORKFLOW_LIMIT_STEP_TIMEOUT_MS',
  'trigger.maxPayloadBytes': 'WORKFLOW_LIMIT_MAX_PAYLOAD_BYTES',
  'ratesPerMinute.anonymousPerWorkflow': 'WORKFLOW_LIMIT_ANONYMOUS_RUNS_PER_WORKFLOW_PER_MINUTE',
  'ratesPerMinute.anonymousPerWorkspace': 'WORKFLOW_LIMIT_ANONYMOUS_RUNS_PER_WORKSPACE_PER_MINUTE',
  'ratesPerMinute.anonymousPerIp': 'WORKFLOW_LIMIT_ANONYMOUS_RUNS_PER_IP_PER_MINUTE',
  'ratesPerMinute.appPerUserPerWorkflow': 'WORKFLOW_LIMIT_APP_RUNS_PER_USER_PER_WORKFLOW_PER_MINUTE',
  'ratesPerMinute.webhookPerWorkflow': 'WORKFLOW_LIMIT_WEBHOOK_RUNS_PER_WORKFLOW_PER_MINUTE',
  'ratesPerMinute.editorPerUser': 'WORKFLOW_LIMIT_EDITOR_RUNS_PER_USER_PER_MINUTE',
  'concurrency.activeRunsPerWorkspace': 'WORKFLOW_LIMIT_ACTIVE_RUNS_PER_WORKSPACE',
  'concurrency.queuedRunsPerWorkspace': 'WORKFLOW_LIMIT_QUEUED_RUNS_PER_WORKSPACE',
  'concurrency.waitingSyncRequestsPerPod': 'WORKFLOW_LIMIT_WAITING_SYNC_REQUESTS_PER_POD',
  'waiting.maxWaitingRunsPerWorkspace': 'WORKFLOW_LIMIT_MAX_WAITING_RUNS_PER_WORKSPACE',
  'schedules.maxPerWorkflow': 'WORKFLOW_LIMIT_MAX_SCHEDULES_PER_WORKFLOW',
  'schedules.maxPerWorkspace': 'WORKFLOW_LIMIT_MAX_SCHEDULES_PER_WORKSPACE',
  'quotaDefaults.workspaceDailyExecutions': 'WORKFLOW_LIMIT_DEFAULT_WORKSPACE_DAILY_EXECUTIONS',
  'quotaDefaults.workspaceMonthlyExecutions': 'WORKFLOW_LIMIT_DEFAULT_WORKSPACE_MONTHLY_EXECUTIONS',
  'quotaDefaults.instanceDailyExecutions': 'WORKFLOW_LIMIT_DEFAULT_INSTANCE_DAILY_EXECUTIONS',
  'quotaDefaults.instanceMonthlyExecutions': 'WORKFLOW_LIMIT_DEFAULT_INSTANCE_MONTHLY_EXECUTIONS',
};

/** `value` as a positive finite number, else `fallback`. */
export function positiveOr(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface WorkflowPlanLimits {
  /** The plan's `workflows.execution_timeout`, as stored (may be 0, '' or missing). */
  executionTimeoutSeconds?: unknown;
}

export function resolveWorkflowLimits(
  env: Record<string, string | undefined>,
  plan: WorkflowPlanLimits = {}
): WorkflowLimits {
  const limits = structuredClone(DEFAULT_WORKFLOW_LIMITS) as WorkflowLimits;
  limits.run.timeoutSeconds = positiveOr(plan.executionTimeoutSeconds, limits.run.timeoutSeconds);

  for (const [path, envVar] of Object.entries(WORKFLOW_LIMIT_ENV_VARS)) {
    const [section, field] = path.split('.') as [Section, string];
    const group = limits[section] as unknown as Record<string, number>;
    group[field] = positiveOr(env[envVar], group[field]);
  }
  return limits;
}
