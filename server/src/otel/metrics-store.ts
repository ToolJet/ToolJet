/**
 * Internal Metrics Store
 *
 * An always-on ring buffer for query events, used to power the built-in
 * observability dashboard. This module operates independently of OTEL —
 * it collects data regardless of whether ENABLE_OTEL is set.
 */

export interface QueryEvent {
  timestamp: number;
  appId: string;
  appName: string;
  queryId: string;
  queryName: string;
  dataSourceType: string;
  mode: string; // 'edit' | 'view'
  environment: string;
  status: 'success' | 'failure';
  duration?: number;
  errorMessage?: string;    // Short error message (up to 300 chars)
  errorDescription?: string; // Detailed description / HTTP response body (up to 500 chars)
  queryText?: string;
  organizationId: string;
}

const MAX_EVENTS = parseInt(process.env.OBSERVABILITY_MAX_EVENTS || '50000', 10);
const queryEventBuffer: QueryEvent[] = [];

// Track distinct filter values seen so far for dropdown population
const seenApps = new Set<string>();
const seenEnvironments = new Set<string>();
const seenModes = new Set<string>();

/**
 * Push a query event into the ring buffer.
 * When the buffer exceeds MAX_EVENTS the oldest entry is evicted.
 */
export const recordQueryEventInternal = (event: QueryEvent): void => {
  if (queryEventBuffer.length >= MAX_EVENTS) {
    queryEventBuffer.shift();
  }
  queryEventBuffer.push(event);

  // Track distinct filter values
  if (event.appName && event.appName !== 'unknown') seenApps.add(event.appName);
  if (event.environment && event.environment !== 'unknown') seenEnvironments.add(event.environment);
  if (event.mode && event.mode !== 'unknown') seenModes.add(event.mode);
};

/**
 * Return events that match the supplied filters.
 * All filters are optional; omitting a filter means "match all".
 */
export const getFilteredEvents = (filters: {
  appName?: string;
  environment?: string;
  mode?: string;
  from?: number;
  to?: number;
}): QueryEvent[] => {
  const { appName, environment, mode, from, to } = filters;

  return queryEventBuffer.filter((event) => {
    if (from != null && event.timestamp < from) return false;
    if (to != null && event.timestamp > to) return false;
    if (appName && appName !== 'All' && event.appName !== appName) return false;
    if (environment && environment !== 'All' && event.environment !== environment) return false;
    if (mode && mode !== 'All' && event.mode !== mode) return false;
    return true;
  });
};

/**
 * Return the distinct values seen across all buffered events.
 * Prepends 'All' so the frontend dropdowns always have a catch-all option.
 */
export const getFilterValues = (): { apps: string[]; environments: string[]; modes: string[] } => {
  return {
    apps: ['All', ...Array.from(seenApps).sort()],
    environments: ['All', ...Array.from(seenEnvironments).sort()],
    modes: ['All', ...Array.from(seenModes).sort()],
  };
};

/**
 * Return the most recent N failure events (newest first).
 */
export const getRecentFailures = (limit = 50): QueryEvent[] => {
  const failures: QueryEvent[] = [];
  for (let i = queryEventBuffer.length - 1; i >= 0 && failures.length < limit; i--) {
    if (queryEventBuffer[i].status === 'failure') {
      failures.push(queryEventBuffer[i]);
    }
  }
  return failures;
};

/**
 * Clear the buffer — mainly useful in tests.
 */
export const clearMetricsStore = (): void => {
  queryEventBuffer.length = 0;
  seenApps.clear();
  seenEnvironments.clear();
  seenModes.clear();
};
