import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram, Meter } from '@opentelemetry/api';
import { getWorkspaceLabel, getWorkspaceNameLabel } from './org-plan-cache';
import { ATTR, BUCKETS_SECONDS, METRIC } from './semconv';

/**
 * Query execution metrics.
 *
 * Emitted directly at the query execution site rather than off the audit
 * pipeline, so they flow regardless of audit-log licensing and carry the full
 * label set the app drilldown needs.
 *
 * The audit-log counter family that used to live here (audit.logs.*,
 * user.sessions.total, app.usage/errors/lifecycle.*, datasource.lifecycle.*)
 * was removed: no dashboard ever queried it, and every emit carried label
 * cardinality for nothing.
 */

let appMeter: Meter;
let queryExecutionsCounter: Counter;
let queryDurationHistogram: Histogram;

export const initializeAuditLogMetrics = () => {
  appMeter = metrics.getMeter('tooljet-app');

  // No authored `_total` — the Prometheus exporter appends it.
  queryExecutionsCounter = appMeter.createCounter(METRIC.QUERY_EXECUTIONS, {
    description: 'Query executions, labeled by app, workspace, mode and environment',
    unit: '1',
  });

  queryDurationHistogram = appMeter.createHistogram(METRIC.QUERY_DURATION, {
    description: 'Query execution duration',
    unit: 's',
    advice: { explicitBucketBoundaries: [...BUCKETS_SECONDS.QUERY] },
  });

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log(`[OTEL] Query metrics initialized: ${METRIC.QUERY_EXECUTIONS}, ${METRIC.QUERY_DURATION}`);
    console.log(
      `[OTEL] OTEL_INCLUDE_QUERY_TEXT: ${
        process.env.OTEL_INCLUDE_QUERY_TEXT === 'true'
          ? 'enabled — query text becomes a label, high cardinality'
          : 'disabled (default)'
      }`
    );
  }
};

export interface QueryMetricPayload {
  userId: string;
  organizationId: string;
  organizationName?: string;
  appId: string;
  appName?: string;
  queryId: string;
  queryName?: string;
  dataSourceType: string;
  appMode: string; // 'edit' | 'view'
  environment: string; // environment name
  status: 'success' | 'failure' | string;
  duration?: number; // ms at the call site; recorded in seconds
  error?: string;
  errorType?: string;
  queryText?: string; // only labeled if OTEL_INCLUDE_QUERY_TEXT=true
  queryType?: string; // 'sql' | 'gui' | etc.
  versionName?: string;
}

/**
 * Categorize an error message into a low-cardinality error.type value.
 */
function categorizeError(error: unknown): string {
  if (!error) return 'unknown';

  const errorStr = typeof error === 'string' ? error : (error as Error)?.message || String(error);
  const lowerError = errorStr.toLowerCase();

  if (lowerError.includes('timeout')) return 'timeout';
  if (lowerError.includes('connection')) return 'connection_error';
  if (lowerError.includes('syntax')) return 'syntax_error';
  if (lowerError.includes('permission') || lowerError.includes('denied')) return 'permission_error';
  if (lowerError.includes('not found')) return 'not_found';

  return 'unknown_error';
}

export const recordQueryMetric = (payload: QueryMetricPayload) => {
  if (!queryExecutionsCounter) return;

  try {
    const {
      organizationId,
      organizationName = 'unknown',
      appId,
      appName = 'unknown',
      queryId,
      queryName = 'unknown',
      dataSourceType,
      appMode,
      environment,
      status,
      duration,
      error,
      queryText = '',
      queryType = 'unknown',
      versionName = 'unknown',
    } = payload;

    const failed = status === 'failure' || !!error;

    // App-level metric — free-tier orgs bucket on Cloud; id and name gate together
    const labels: Record<string, string> = {
      [ATTR.APP_ID]: appId || 'unknown',
      [ATTR.APP_NAME]: appName,
      [ATTR.QUERY_ID]: queryId,
      [ATTR.QUERY_NAME]: queryName,
      [ATTR.QUERY_TYPE]: queryType,
      [ATTR.DATA_SOURCE_TYPE]: dataSourceType,
      [ATTR.ORGANIZATION_ID]: getWorkspaceLabel(organizationId),
      [ATTR.ORGANIZATION_NAME]: getWorkspaceNameLabel(organizationId, organizationName),
      [ATTR.APP_MODE]: appMode,
      [ATTR.APP_RELEASED]: appMode === 'view' ? 'true' : 'false',
      [ATTR.ENVIRONMENT_NAME]: environment,
      [ATTR.APP_VERSION]: versionName,
      [ATTR.QUERY_TEXT]: process.env.OTEL_INCLUDE_QUERY_TEXT === 'true' ? queryText : '',
    };

    // error.type is set if and only if the query failed. Its absence is what
    // marks success, which is why there is no separate `status` label and no
    // separate failures counter to drift out of step with this one.
    if (failed) {
      labels[ATTR.ERROR_TYPE] = payload.errorType || categorizeError(error);
    }

    queryExecutionsCounter.add(1, labels);

    if (typeof duration === 'number') {
      queryDurationHistogram.record(duration / 1000, labels);
    }
  } catch (err) {
    // Observability must never break query execution
    console.error('[OTEL] Error in recordQueryMetric:', err);
  }
};
