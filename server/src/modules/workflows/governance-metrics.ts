import { metrics } from '@opentelemetry/api';
import type { Counter } from '@opentelemetry/api';

/*
 * Counters for every point where workflow governance refuses, delays or stops work (decision D46).
 * OpenTelemetry, like the query metrics: exported only when ENABLE_OTEL=true, no-ops otherwise.
 * Labels are low-cardinality on purpose (a reason, a limit, a pool), never a workspace or run id.
 * Instruments are created on first use, after the SDK has registered its meter provider at boot.
 */

export const WORKFLOW_METRIC = {
  ADMISSION_REFUSED: 'tooljet.workflow.admission.refused',
  SLOT_BOUNCED: 'tooljet.workflow.slot.bounced',
  BUDGET_EXCEEDED: 'tooljet.workflow.budget.exceeded',
  STEP_STOPPED: 'tooljet.workflow.step.stopped',
  SYNC_WAIT_EXPIRED: 'tooljet.workflow.sync_wait.expired',
  POOL_WAITED: 'tooljet.workflow.pool.waited',
} as const;

/** Why a run (or a request to start one) was turned away before it ran. */
export type AdmissionRefusal =
  | 'rate_limit'
  | 'payload_too_large'
  | 'queue_full'
  | 'redis_unavailable'
  | 'quota'
  | 'no_worker'
  | 'pod_waiting_full'
  | 'queue_timeout'
  | 'notification_budget'
  | 'outbound_rate';

const DESCRIPTIONS: Record<(typeof WORKFLOW_METRIC)[keyof typeof WORKFLOW_METRIC], string> = {
  [WORKFLOW_METRIC.ADMISSION_REFUSED]: 'Workflow runs refused before starting, by reason',
  [WORKFLOW_METRIC.SLOT_BOUNCED]: 'Runs sent back to the queue because their workspace had no free run slot',
  [WORKFLOW_METRIC.BUDGET_EXCEEDED]: 'Runs failed for exceeding a run budget limit, by limit',
  [WORKFLOW_METRIC.STEP_STOPPED]: "Steps stopped at their run's deadline or by termination, by reason",
  [WORKFLOW_METRIC.SYNC_WAIT_EXPIRED]: 'Sync requests answered 202 because the run outlived the wait',
  [WORKFLOW_METRIC.POOL_WAITED]: 'Work that waited for a free per-pod slot, by pool',
};

const counters = new Map<string, Counter>();

function counter(name: keyof typeof DESCRIPTIONS): Counter {
  let instrument = counters.get(name);
  if (!instrument) {
    instrument = metrics
      .getMeter('tooljet-workflows')
      .createCounter(name, { description: DESCRIPTIONS[name], unit: '1' });
    counters.set(name, instrument);
  }
  return instrument;
}

/** Never lets a metrics failure affect the run. */
function add(name: keyof typeof DESCRIPTIONS, attributes: Record<string, string> = {}): void {
  try {
    counter(name).add(1, attributes);
  } catch {
    // Metrics are best-effort
  }
}

export const workflowMetrics = {
  admissionRefused: (reason: AdmissionRefusal) => add(WORKFLOW_METRIC.ADMISSION_REFUSED, { reason }),
  slotBounced: () => add(WORKFLOW_METRIC.SLOT_BOUNCED),
  budgetExceeded: (limit: string) => add(WORKFLOW_METRIC.BUDGET_EXCEEDED, { limit }),
  stepStopped: (reason: 'timeout' | 'terminated') => add(WORKFLOW_METRIC.STEP_STOPPED, { reason }),
  syncWaitExpired: () => add(WORKFLOW_METRIC.SYNC_WAIT_EXPIRED),
  poolWaited: (pool: string) => add(WORKFLOW_METRIC.POOL_WAITED, { pool }),
};
