import { metrics, trace, context } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

/**
 * Plugin Performance Metrics for ToolJet
 *
 * Comprehensive plugin and datasource monitoring as requested by team lead:
 * 1. Data query execution time by datasource kind
 * 2. Active cached connection by kind
 * 3. Data query success & failures by kind
 * 4. Connection pool monitoring
 * 5. Plugin-specific performance insights
 *
 * Follows OpenTelemetry semantic conventions for database and HTTP operations
 */

// === PLUGIN-SPECIFIC METRICS ===
let pluginQueryExecutionDuration: any;
let pluginQueryExecutionCount: any;
let pluginQuerySuccessFailureCount: any;
let pluginConnectionPoolGauge: any;
let pluginActiveCachedConnections: any;
let pluginConnectionCreateTime: any;
let pluginConnectionWaitTime: any;
let pluginConnectionUseTime: any;
let pluginDataTransferSize: any;
let pluginOperationLatency: any;

// === CONNECTION POOL TRACKING ===
interface ConnectionPoolStats {
  datasourceKind: string;
  organizationId: string;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  maxConnections: number;
  connectionTimeouts: number;
  cachedConnections: number;
  lastUpdated: number;
}

const connectionPools = new Map<string, ConnectionPoolStats>();
const cachedConnections = new Map<string, { count: number; lastUsed: number }>();

// === QUERY EXECUTION TRACKING ===
interface QueryExecutionContext {
  queryId: string;
  datasourceKind: string;
  organizationId: string;
  appId: string;
  queryName: string;
  startTime: number;
  connectionWaitTime?: number;
  executionPhases: Array<{
    phase: 'connection' | 'preparation' | 'execution' | 'result_processing';
    duration: number;
    details?: any;
  }>;
}

const activeQueries = new Map<string, QueryExecutionContext>();

export const initializePluginPerformanceMetrics = () => {
  const meter = metrics.getMeter('tooljet-plugin-performance', '1.0.0');

  // === DATA QUERY EXECUTION METRICS BY DATASOURCE ===
  pluginQueryExecutionDuration = meter.createHistogram('tooljet.plugin.query.execution.duration', {
    description: 'Duration of data query execution by datasource kind',
    unit: 's',
  });

  pluginQueryExecutionCount = meter.createCounter('tooljet.plugin.query.execution.count', {
    description: 'Total number of query executions by datasource kind and status',
  });

  pluginQuerySuccessFailureCount = meter.createCounter('tooljet.plugin.query.result.total', {
    description: 'Data query success and failure counts by datasource kind',
  });

  // === CONNECTION POOL METRICS ===
  pluginConnectionPoolGauge = meter.createObservableGauge('tooljet.plugin.connection.pool.size', {
    description: 'Current connection pool statistics by datasource kind',
  });

  pluginActiveCachedConnections = meter.createObservableGauge('tooljet.plugin.connection.cached.active', {
    description: 'Number of active cached connections by datasource kind',
  });

  pluginConnectionCreateTime = meter.createHistogram('tooljet.plugin.connection.create.duration', {
    description: 'Time taken to create new database connections',
    unit: 's',
  });

  pluginConnectionWaitTime = meter.createHistogram('tooljet.plugin.connection.wait.duration', {
    description: 'Time spent waiting for available connections',
    unit: 's',
  });

  pluginConnectionUseTime = meter.createHistogram('tooljet.plugin.connection.use.duration', {
    description: 'Time connection was in use for query execution',
    unit: 's',
  });

  // === ADDITIONAL PLUGIN METRICS ===
  pluginDataTransferSize = meter.createHistogram('tooljet.plugin.data.transfer.size', {
    description: 'Size of data transferred in plugin operations',
    unit: 'By',
  });

  pluginOperationLatency = meter.createHistogram('tooljet.plugin.operation.latency', {
    description: 'Latency of plugin operations by type and datasource',
    unit: 's',
  });

  // Setup observable gauge callbacks
  setupConnectionPoolCallbacks();

  console.log('[ToolJet Backend] Plugin Performance metrics initialized');
};

// === QUERY EXECUTION TRACKING ===

export const startPluginQuery = (
  queryId: string,
  datasourceKind: string,
  organizationId: string,
  appId: string,
  queryName: string,
  queryOptions?: any
): void => {
  const startTime = performance.now();

  activeQueries.set(queryId, {
    queryId,
    datasourceKind: datasourceKind.toLowerCase(),
    organizationId,
    appId,
    queryName,
    startTime,
    executionPhases: [],
  });

  console.log(`[ToolJet Plugin Performance] Started query:`, {
    queryId,
    datasourceKind,
    queryName,
    organizationId,
    appId
  });
};

export const recordQueryPhase = (
  queryId: string,
  phase: 'connection' | 'preparation' | 'execution' | 'result_processing',
  duration: number,
  details?: any
): void => {
  const context = activeQueries.get(queryId);
  if (context) {
    context.executionPhases.push({ phase, duration, details });
  }
};

export const endPluginQuery = (
  queryId: string,
  status: 'success' | 'failure',
  result?: {
    rowsReturned?: number;
    dataSize?: number;
    errorType?: string;
    errorMessage?: string;
  }
): void => {
  const context = activeQueries.get(queryId);
  if (!context) return;

  const endTime = performance.now();
  const totalDuration = (endTime - context.startTime) / 1000; // Convert to seconds

  const baseAttributes = {
    'tooljet.datasource.kind': context.datasourceKind,
    'tooljet.organization.id': context.organizationId,
    'tooljet.app.id': context.appId,
    'tooljet.query.name': context.queryName,
    'tooljet.query.status': status,
    ...(result?.errorType && { 'error.type': result.errorType }),
  };

  // Record query execution duration
  if (pluginQueryExecutionDuration) {
    pluginQueryExecutionDuration.record(totalDuration, baseAttributes);
  }

  // Record query execution count
  if (pluginQueryExecutionCount) {
    pluginQueryExecutionCount.add(1, baseAttributes);
  }

  // Record success/failure count
  if (pluginQuerySuccessFailureCount) {
    pluginQuerySuccessFailureCount.add(1, {
      'tooljet.datasource.kind': context.datasourceKind,
      'tooljet.query.result': status,
      'tooljet.organization.id': context.organizationId,
    });
  }

  // Record data transfer size if provided
  if (pluginDataTransferSize && result?.dataSize) {
    pluginDataTransferSize.record(result.dataSize, {
      'tooljet.datasource.kind': context.datasourceKind,
      'tooljet.operation.type': 'query_result',
      'tooljet.organization.id': context.organizationId,
    });
  }

  // Record phase-specific latencies
  if (pluginOperationLatency) {
    context.executionPhases.forEach(phase => {
      pluginOperationLatency.record(phase.duration / 1000, {
        'tooljet.datasource.kind': context.datasourceKind,
        'tooljet.operation.phase': phase.phase,
        'tooljet.organization.id': context.organizationId,
      });
    });
  }

  // Clean up
  activeQueries.delete(queryId);

  console.log(`[ToolJet Plugin Performance] Query completed:`, {
    queryId,
    datasourceKind: context.datasourceKind,
    queryName: context.queryName,
    duration: `${totalDuration.toFixed(3)}s`,
    status,
    phases: context.executionPhases.length,
    organizationId: context.organizationId
  });
};

// === CONNECTION POOL MANAGEMENT ===

export const updateConnectionPool = (
  datasourceKind: string,
  organizationId: string,
  stats: {
    activeConnections: number;
    idleConnections: number;
    pendingRequests?: number;
    maxConnections: number;
    connectionTimeouts?: number;
    cachedConnections?: number;
  }
): void => {
  const key = `${organizationId}:${datasourceKind.toLowerCase()}`;

  connectionPools.set(key, {
    datasourceKind: datasourceKind.toLowerCase(),
    organizationId,
    activeConnections: stats.activeConnections,
    idleConnections: stats.idleConnections,
    pendingRequests: stats.pendingRequests || 0,
    maxConnections: stats.maxConnections,
    connectionTimeouts: stats.connectionTimeouts || 0,
    cachedConnections: stats.cachedConnections || 0,
    lastUpdated: Date.now(),
  });
};

export const recordConnectionCreation = (
  datasourceKind: string,
  organizationId: string,
  creationTime: number // in milliseconds
): void => {
  if (pluginConnectionCreateTime) {
    pluginConnectionCreateTime.record(creationTime / 1000, {
      'tooljet.datasource.kind': datasourceKind.toLowerCase(),
      'tooljet.organization.id': organizationId,
    });
  }
};

export const recordConnectionWait = (
  datasourceKind: string,
  organizationId: string,
  waitTime: number // in milliseconds
): void => {
  if (pluginConnectionWaitTime) {
    pluginConnectionWaitTime.record(waitTime / 1000, {
      'tooljet.datasource.kind': datasourceKind.toLowerCase(),
      'tooljet.organization.id': organizationId,
    });
  }
};

export const recordConnectionUse = (
  datasourceKind: string,
  organizationId: string,
  useTime: number // in milliseconds
): void => {
  if (pluginConnectionUseTime) {
    pluginConnectionUseTime.record(useTime / 1000, {
      'tooljet.datasource.kind': datasourceKind.toLowerCase(),
      'tooljet.organization.id': organizationId,
    });
  }
};

// === CACHED CONNECTION MANAGEMENT ===

export const updateCachedConnections = (
  datasourceKind: string,
  organizationId: string,
  count: number
): void => {
  const key = `${organizationId}:${datasourceKind.toLowerCase()}`;
  cachedConnections.set(key, {
    count,
    lastUsed: Date.now(),
  });
};

export const incrementCachedConnection = (datasourceKind: string, organizationId: string): void => {
  const key = `${organizationId}:${datasourceKind.toLowerCase()}`;
  const current = cachedConnections.get(key);
  cachedConnections.set(key, {
    count: (current?.count || 0) + 1,
    lastUsed: Date.now(),
  });
};

export const decrementCachedConnection = (datasourceKind: string, organizationId: string): void => {
  const key = `${organizationId}:${datasourceKind.toLowerCase()}`;
  const current = cachedConnections.get(key);
  if (current && current.count > 0) {
    cachedConnections.set(key, {
      count: current.count - 1,
      lastUsed: Date.now(),
    });
  }
};

// === DATASOURCE-SPECIFIC METRICS ===

export const recordDatasourceSpecificMetric = (
  datasourceKind: string,
  organizationId: string,
  metricType: 'rows_processed' | 'api_calls' | 'file_operations' | 'cache_hits' | 'cache_misses',
  value: number,
  additionalAttributes?: Record<string, string>
): void => {
  const baseAttributes = {
    'tooljet.datasource.kind': datasourceKind.toLowerCase(),
    'tooljet.organization.id': organizationId,
    'tooljet.metric.type': metricType,
    ...additionalAttributes,
  };

  if (pluginQueryExecutionCount) {
    pluginQueryExecutionCount.add(value, baseAttributes);
  }
};

// === OBSERVABLE GAUGE CALLBACKS ===

const setupConnectionPoolCallbacks = (): void => {
  // Connection pool statistics callback
  if (pluginConnectionPoolGauge) {
    pluginConnectionPoolGauge.addCallback((observableResult: any) => {
      for (const stats of Array.from(connectionPools.values())) {
        // Active connections
        observableResult.observe(stats.activeConnections, {
          'tooljet.datasource.kind': stats.datasourceKind,
          'tooljet.organization.id': stats.organizationId,
          'tooljet.connection.type': 'active',
        });

        // Idle connections
        observableResult.observe(stats.idleConnections, {
          'tooljet.datasource.kind': stats.datasourceKind,
          'tooljet.organization.id': stats.organizationId,
          'tooljet.connection.type': 'idle',
        });

        // Pending requests
        observableResult.observe(stats.pendingRequests, {
          'tooljet.datasource.kind': stats.datasourceKind,
          'tooljet.organization.id': stats.organizationId,
          'tooljet.connection.type': 'pending',
        });

        // Max connections
        observableResult.observe(stats.maxConnections, {
          'tooljet.datasource.kind': stats.datasourceKind,
          'tooljet.organization.id': stats.organizationId,
          'tooljet.connection.type': 'max',
        });
      }
    });
  }

  // Cached connections callback
  if (pluginActiveCachedConnections) {
    pluginActiveCachedConnections.addCallback((observableResult: any) => {
      for (const [key, connection] of Array.from(cachedConnections.entries())) {
        const [organizationId, datasourceKind] = key.split(':');
        observableResult.observe(connection.count, {
          'tooljet.datasource.kind': datasourceKind,
          'tooljet.organization.id': organizationId,
        });
      }
    });
  }

  // Cleanup stale cached connections (older than 30 minutes)
  setInterval(() => {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    for (const [key, connection] of Array.from(cachedConnections.entries())) {
      if (connection.lastUsed < thirtyMinutesAgo) {
        cachedConnections.delete(key);
      }
    }

    // Cleanup stale connection pool stats (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    for (const [key, stats] of Array.from(connectionPools.entries())) {
      if (stats.lastUpdated < fiveMinutesAgo) {
        connectionPools.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
};

// === DATASOURCE KIND MAPPING ===

export const normalizeDatasourceKind = (kind: string): string => {
  const normalizedMap: Record<string, string> = {
    'postgresql': 'postgresql',
    'postgres': 'postgresql',
    'pg': 'postgresql',
    'mysql': 'mysql',
    'mongodb': 'mongodb',
    'mongo': 'mongodb',
    'redis': 'redis',
    'elasticsearch': 'elasticsearch',
    'es': 'elasticsearch',
    'restapi': 'rest_api',
    'graphql': 'graphql',
    's3': 'aws_s3',
    'aws-s3': 'aws_s3',
    'googlesheets': 'google_sheets',
    'google-sheets': 'google_sheets',
    'airtable': 'airtable',
    'stripe': 'stripe',
    'slack': 'slack',
    'firebase': 'firebase',
    'bigquery': 'bigquery',
    'snowflake': 'snowflake',
  };

  return normalizedMap[kind.toLowerCase()] || kind.toLowerCase();
};

// === UTILITY FUNCTIONS ===

export const getPluginPerformanceStats = () => {
  return {
    activeQueries: activeQueries.size,
    connectionPools: connectionPools.size,
    cachedConnections: cachedConnections.size,
    activeQueryDetails: Array.from(activeQueries.values()).map(ctx => ({
      queryId: ctx.queryId,
      datasourceKind: ctx.datasourceKind,
      queryName: ctx.queryName,
      duration: (performance.now() - ctx.startTime) / 1000,
      phases: ctx.executionPhases.length,
      organizationId: ctx.organizationId,
    })),
    connectionPoolStats: Array.from(connectionPools.values()),
    cachedConnectionStats: Array.from(cachedConnections.entries()).map(([key, stats]) => {
      const [organizationId, datasourceKind] = key.split(':');
      return {
        datasourceKind,
        organizationId,
        count: stats.count,
        lastUsed: new Date(stats.lastUsed).toISOString(),
      };
    }),
  };
};

export const getDatasourcePerformanceSummary = (
  datasourceKind?: string,
  organizationId?: string
) => {
  const summary = {
    totalQueries: 0,
    avgDuration: 0,
    successRate: 0,
    activeConnections: 0,
    cachedConnections: 0,
  };

  // Calculate from active queries (simplified example)
  let totalDuration = 0;
  let successCount = 0;
  let totalCount = 0;

  for (const query of Array.from(activeQueries.values())) {
    if (datasourceKind && query.datasourceKind !== datasourceKind) continue;
    if (organizationId && query.organizationId !== organizationId) continue;

    totalCount++;
    totalDuration += (performance.now() - query.startTime) / 1000;
  }

  if (totalCount > 0) {
    summary.totalQueries = totalCount;
    summary.avgDuration = totalDuration / totalCount;
  }

  return summary;
};

// Export query ID generator for consistent tracking
export const generateQueryId = (): string => {
  return `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};