import { metrics } from '@opentelemetry/api';
import type { Counter, ObservableGauge, ObservableResult } from '@opentelemetry/api';
import { getWorkspaceLabel } from './org-plan-cache';
import { ATTR, METRIC } from './semconv';

// Instruments for the EE query response cache. The cache lives in the private submodule; it reports
// through these functions, which do nothing until OpenTelemetry initializes them.

export type QueryCacheWriteResult = 'stored' | 'over_limit' | 'token_refused' | 'confirm_refused' | 'token_changed';

export interface QueryCacheUsage {
  usedBytes: number;
  limitBytes: number;
}

let writesCounter: Counter | undefined;
let bytesStoredCounter: Counter | undefined;
let memoryUsedGauge: ObservableGauge | undefined;
let memoryLimitGauge: ObservableGauge | undefined;
// Gauge callbacks are synchronous, so the cache polls Redis and leaves the latest reading here.
let latestUsage: QueryCacheUsage | null = null;

export const initializeQueryCacheMetrics = () => {
  const meter = metrics.getMeter('tooljet-app');

  writesCounter = meter.createCounter(METRIC.QUERY_CACHE_WRITES, {
    description: 'Query cache write attempts, labeled by result',
    unit: '1',
  });
  bytesStoredCounter = meter.createCounter(METRIC.QUERY_CACHE_BYTES_STORED, {
    description: 'Bytes charged to the query cache budget by stored responses, labeled by workspace',
    unit: 'By',
  });
  memoryUsedGauge = meter.createObservableGauge(METRIC.QUERY_CACHE_MEMORY_USED, {
    description: 'Bytes charged against the global query cache budget. Every pod reports it; aggregate with max',
    unit: 'By',
  });
  memoryLimitGauge = meter.createObservableGauge(METRIC.QUERY_CACHE_MEMORY_LIMIT, {
    description: 'Global query cache budget (QUERY_CACHE_MAX_TOTAL_BYTES). Aggregate with max',
    unit: 'By',
  });

  memoryUsedGauge.addCallback((result: ObservableResult) => {
    if (latestUsage) result.observe(latestUsage.usedBytes);
  });
  memoryLimitGauge.addCallback((result: ObservableResult) => {
    if (latestUsage) result.observe(latestUsage.limitBytes);
  });
};

export const recordQueryCacheWrite = (result: QueryCacheWriteResult, organizationId: string, bytes?: number) => {
  try {
    writesCounter?.add(1, { [ATTR.QUERY_CACHE_WRITE_RESULT]: result });
    if (result === 'stored' && typeof bytes === 'number' && bytes > 0) {
      bytesStoredCounter?.add(bytes, { [ATTR.ORGANIZATION_ID]: getWorkspaceLabel(organizationId) });
    }
  } catch {
    // Observability must never break caching
  }
};

export const setQueryCacheUsage = (usage: QueryCacheUsage) => {
  latestUsage = usage;
};

/** True once OpenTelemetry has created the instruments, so callers can skip work only metrics need. */
export const isQueryCacheMetricsEnabled = (): boolean => !!writesCounter;
