import { metrics, trace, context, Span } from '@opentelemetry/api';
import { performance } from 'perf_hooks';
import { ApiPerformanceBenchmark } from '../types';

/**
 * API Performance Metrics for ToolJet
 *
 * Comprehensive API monitoring following OpenTelemetry semantic conventions:
 * - HTTP server request duration with detailed timing breakdown
 * - Database query performance per API request with individual query insights
 * - External operation timing (third-party API calls, file operations, etc.)
 * - App builder/viewer specific performance tracking
 *
 * Requirements addressed:
 * 1. Total API execution time
 * 2. Database query time with query-by-query insights
 * 3. External operation timing breakdown
 * 4. Benchmarking capabilities for release comparison
 */

// OpenTelemetry semantic convention compliant metric names
let httpServerRequestDuration: any;
let httpServerActiveRequests: any;
let httpServerRequestBodySize: any;
let httpServerResponseBodySize: any;

// Database operation metrics following OTEL conventions
let dbClientOperationDuration: any;
let dbClientOperationCount: any;
let dbClientResponseReturnedRows: any;
let dbClientConnectionCount: any;
let dbClientConnectionWaitTime: any;

// Custom ToolJet-specific metrics
let apiExternalOperationDuration: any;
let apiTotalBreakdownDuration: any;
let appBuilderViewerPerformance: any;
let apiBusinessOperationDuration: any;

// Performance tracking state
interface RequestPerformanceContext {
  requestId: string;
  startTime: number;
  endpoint: string;
  method: string;
  organizationId?: string;
  userId?: string;
  appId?: string;
  queryCount: number;
  dbOperations: Array<{
    query: string;
    operation: string;
    table: string;
    duration: number;
    rowsReturned: number;
    status: 'success' | 'error';
  }>;
  externalOperations: Array<{
    operation: string;
    provider: string;
    duration: number;
    status: 'success' | 'error';
  }>;
}

const activeRequests = new Map<string, RequestPerformanceContext>();

export const initializeApiPerformanceMetrics = () => {
  const meter = metrics.getMeter('tooljet-api-performance', '1.0.0');

  // === HTTP SERVER METRICS (OpenTelemetry Standard) ===
  httpServerRequestDuration = meter.createHistogram('http.server.request.duration', {
    description: 'Duration of HTTP server requests.',
    unit: 's',
  });

  httpServerActiveRequests = meter.createUpDownCounter('http.server.active_requests', {
    description: 'Number of active HTTP server requests.',
  });

  httpServerRequestBodySize = meter.createHistogram('http.server.request.body.size', {
    description: 'Size of HTTP server request bodies.',
    unit: 'By',
  });

  httpServerResponseBodySize = meter.createHistogram('http.server.response.body.size', {
    description: 'Size of HTTP server response bodies.',
    unit: 'By',
  });

  // === DATABASE CLIENT METRICS (OpenTelemetry Standard) ===
  // NOTE: These metrics are now created in tracing.ts to avoid conflicts
  // dbClientOperationDuration = meter.createHistogram('db.client.operation.duration', {
  //   description: 'Duration of database client operations.',
  //   unit: 's',
  // });

  // dbClientOperationCount = meter.createCounter('db.client.operation.count', {
  //   description: 'Number of database client operations.',
  // });

  // dbClientResponseReturnedRows = meter.createHistogram('db.client.response.returned_rows', {
  //   description: 'Number of rows returned by database operations.',
  //   unit: '{row}',
  // });

  dbClientConnectionCount = meter.createObservableGauge('db.client.connection.count', {
    description: 'Number of database client connections.',
  });

  // NOTE: Database monitoring now consolidated in database-monitoring.ts
  // dbClientConnectionWaitTime = meter.createHistogram('db.client.connection.wait_time', {
  //   description: 'Time spent waiting for database connections.',
  //   unit: 's',
  // });

  // === CUSTOM TOOLJET METRICS ===
  apiExternalOperationDuration = meter.createHistogram('tooljet.api.external_operation.duration', {
    description: 'Duration of external operations during API requests.',
    unit: 's',
  });

  apiTotalBreakdownDuration = meter.createHistogram('tooljet.api.breakdown.duration', {
    description: 'API request duration breakdown by operation type.',
    unit: 's',
  });

  appBuilderViewerPerformance = meter.createHistogram('tooljet.app.builder_viewer.performance', {
    description: 'Performance metrics for app builder and viewer operations.',
    unit: 's',
  });

  apiBusinessOperationDuration = meter.createHistogram('tooljet.api.business_operation.duration', {
    description: 'Duration of business logic operations during API requests.',
    unit: 's',
  });

  console.log('[ToolJet Backend] API Performance metrics initialized with OpenTelemetry conventions');
};

// === REQUEST LIFECYCLE TRACKING ===

export const startApiRequest = (
  requestId: string,
  endpoint: string,
  method: string,
  bodySize?: number,
  organizationId?: string,
  userId?: string,
  appId?: string
) => {
  const startTime = performance.now();

  activeRequests.set(requestId, {
    requestId,
    startTime,
    endpoint,
    method,
    organizationId,
    userId,
    appId,
    queryCount: 0,
    dbOperations: [],
    externalOperations: [],
  });

  // Track active requests
  if (httpServerActiveRequests) {
    httpServerActiveRequests.add(1, {
      'http.request.method': method,
      'http.route': endpoint,
      'url.scheme': 'https',
    });
  }

  // Track request body size
  if (httpServerRequestBodySize && bodySize) {
    httpServerRequestBodySize.record(bodySize, {
      'http.request.method': method,
      'http.route': endpoint,
    });
  }
};

export const endApiRequest = (
  requestId: string,
  statusCode: number,
  responseSize?: number,
  errorType?: string
) => {
  const context = activeRequests.get(requestId);
  if (!context) return;

  const endTime = performance.now();
  const totalDuration = (endTime - context.startTime) / 1000; // Convert to seconds

  const baseAttributes = {
    'http.request.method': context.method,
    'http.route': context.endpoint,
    'http.response.status_code': statusCode.toString(),
    'url.scheme': 'https',
    ...(context.organizationId && { 'tooljet.organization.id': context.organizationId }),
    ...(context.userId && { 'tooljet.user.id': context.userId }),
    ...(context.appId && { 'tooljet.app.id': context.appId }),
    ...(errorType && statusCode >= 400 && { 'error.type': errorType }),
  };

  // Record HTTP server request duration
  if (httpServerRequestDuration) {
    httpServerRequestDuration.record(totalDuration, baseAttributes);
  }

  // Record response body size
  if (httpServerResponseBodySize && responseSize) {
    httpServerResponseBodySize.record(responseSize, {
      'http.request.method': context.method,
      'http.route': context.endpoint,
      'http.response.status_code': statusCode.toString(),
    });
  }

  // Track app builder/viewer specific performance
  if (appBuilderViewerPerformance) {
    const isBuilderViewer = context.endpoint.includes('/apps/') ||
                           context.endpoint.includes('/data-queries/') ||
                           context.endpoint.includes('/versions/');

    if (isBuilderViewer) {
      const operationType = determineAppOperation(context.endpoint, context.method);
      appBuilderViewerPerformance.record(totalDuration, {
        ...baseAttributes,
        'tooljet.app.operation': operationType,
        'tooljet.app.db_query_count': context.queryCount.toString(),
      });
    }
  }

  // Calculate timing breakdown
  const dbTotalTime = context.dbOperations.reduce((sum, op) => sum + op.duration, 0) / 1000;
  const externalTotalTime = context.externalOperations.reduce((sum, op) => sum + op.duration, 0) / 1000;
  const businessLogicTime = Math.max(0, totalDuration - dbTotalTime - externalTotalTime);

  // Record timing breakdown
  if (apiTotalBreakdownDuration) {
    // Record individual breakdown components
    apiTotalBreakdownDuration.record(dbTotalTime, {
      ...baseAttributes,
      'tooljet.operation.type': 'database',
    });

    apiTotalBreakdownDuration.record(externalTotalTime, {
      ...baseAttributes,
      'tooljet.operation.type': 'external',
    });

    apiTotalBreakdownDuration.record(businessLogicTime, {
      ...baseAttributes,
      'tooljet.operation.type': 'business_logic',
    });
  }

  // Record business operation duration
  if (apiBusinessOperationDuration) {
    apiBusinessOperationDuration.record(businessLogicTime, {
      ...baseAttributes,
      'tooljet.business.db_operations': context.dbOperations.length.toString(),
      'tooljet.business.external_operations': context.externalOperations.length.toString(),
    });
  }

  // Decrement active requests
  if (httpServerActiveRequests) {
    httpServerActiveRequests.add(-1, {
      'http.request.method': context.method,
      'http.route': context.endpoint,
      'url.scheme': 'https',
    });
  }

  // Clean up
  activeRequests.delete(requestId);

  console.log(`[ToolJet API Performance] Request completed:`, {
    requestId,
    endpoint: context.endpoint,
    method: context.method,
    totalDuration: `${totalDuration.toFixed(3)}s`,
    dbTime: `${dbTotalTime.toFixed(3)}s`,
    externalTime: `${externalTotalTime.toFixed(3)}s`,
    businessLogicTime: `${businessLogicTime.toFixed(3)}s`,
    statusCode,
    queryCount: context.queryCount,
    organizationId: context.organizationId
  });
};

// === DATABASE OPERATION TRACKING ===

export const recordDbOperation = (
  requestId: string,
  query: string,
  operation: string,
  table: string,
  duration: number, // in milliseconds
  rowsReturned: number = 0,
  status: 'success' | 'error' = 'success',
  connectionWaitTime?: number
) => {
  const context = activeRequests.get(requestId);
  if (context) {
    context.queryCount++;
    context.dbOperations.push({
      query,
      operation,
      table,
      duration,
      rowsReturned,
      status,
    });
  }

  const baseAttributes = {
    'db.system': 'postgresql', // ToolJet primarily uses PostgreSQL
    'db.operation.name': operation.toLowerCase(),
    'db.collection.name': table,
    'db.query.summary': query.length > 100 ? query.substring(0, 100) + '...' : query,
    ...(context?.organizationId && { 'tooljet.organization.id': context.organizationId }),
    ...(context?.userId && { 'tooljet.user.id': context.userId }),
    ...(context?.appId && { 'tooljet.app.id': context.appId }),
    ...(status === 'error' && { 'error.type': 'database_error' }),
  };

  // Record database operation duration (OpenTelemetry standard)
  if (dbClientOperationDuration) {
    dbClientOperationDuration.record(duration / 1000, baseAttributes);
  }

  // Record database operation count
  if (dbClientOperationCount) {
    dbClientOperationCount.add(1, baseAttributes);
  }

  // Record returned rows
  if (dbClientResponseReturnedRows && rowsReturned > 0) {
    dbClientResponseReturnedRows.record(rowsReturned, baseAttributes);
  }

  // Record connection wait time if provided
  if (dbClientConnectionWaitTime && connectionWaitTime) {
    dbClientConnectionWaitTime.record(connectionWaitTime / 1000, {
      'db.system': 'postgresql',
      ...(context?.organizationId && { 'tooljet.organization.id': context.organizationId }),
    });
  }
};

// === EXTERNAL OPERATION TRACKING ===

export const recordExternalOperation = (
  requestId: string,
  operation: string,
  provider: string,
  duration: number, // in milliseconds
  status: 'success' | 'error' = 'success',
  httpMethod?: string,
  statusCode?: number
) => {
  const context = activeRequests.get(requestId);
  if (context) {
    context.externalOperations.push({
      operation,
      provider,
      duration,
      status,
    });
  }

  const baseAttributes = {
    'tooljet.external.operation': operation,
    'tooljet.external.provider': provider,
    'tooljet.external.status': status,
    ...(httpMethod && { 'http.request.method': httpMethod }),
    ...(statusCode && { 'http.response.status_code': statusCode.toString() }),
    ...(context?.organizationId && { 'tooljet.organization.id': context.organizationId }),
    ...(context?.userId && { 'tooljet.user.id': context.userId }),
    ...(context?.appId && { 'tooljet.app.id': context.appId }),
    ...(status === 'error' && { 'error.type': 'external_operation_error' }),
  };

  if (apiExternalOperationDuration) {
    apiExternalOperationDuration.record(duration / 1000, baseAttributes);
  }
};

// === TRACING INTEGRATION ===

export const createApiSpanWithTiming = (
  spanName: string,
  requestId: string,
  callback: () => Promise<any>
) => {
  const tracer = trace.getTracer('tooljet-api-performance');
  const span = tracer.startSpan(spanName);

  return context.with(trace.setSpan(context.active(), span), async () => {
    const startTime = performance.now();
    try {
      const result = await callback();
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error.message }); // ERROR
      span.recordException(error);
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      span.setAttribute('duration_ms', duration);
      span.end();
    }
  });
};

// === BENCHMARKING UTILITIES ===

// ApiPerformanceBenchmark interface imported from ../types

const benchmarkData = new Map<string, ApiPerformanceBenchmark>();

export const recordBenchmarkMeasurement = (
  endpoint: string,
  method: string,
  releaseVersion: string,
  organizationId: string,
  totalDuration: number,
  dbDuration: number,
  externalDuration: number,
  businessLogicDuration: number,
  queryCount: number
) => {
  const key = `${endpoint}:${method}:${releaseVersion}:${organizationId}`;

  if (!benchmarkData.has(key)) {
    benchmarkData.set(key, {
      endpoint,
      method,
      releaseVersion,
      organizationId,
      measurements: [],
    });
  }

  benchmarkData.get(key)!.measurements.push({
    totalDuration,
    dbDuration,
    externalDuration,
    businessLogicDuration,
    queryCount,
    timestamp: Date.now(),
  });

  // Keep only last 1000 measurements per key to prevent memory leaks
  const benchmark = benchmarkData.get(key)!;
  if (benchmark.measurements.length > 1000) {
    benchmark.measurements = benchmark.measurements.slice(-1000);
  }
};

export const getBenchmarkData = (
  endpoint?: string,
  method?: string,
  releaseVersion?: string,
  organizationId?: string
): ApiPerformanceBenchmark[] => {
  if (!endpoint) {
    return Array.from(benchmarkData.values());
  }

  const results = [];
  for (const [key, benchmark] of Array.from(benchmarkData.entries())) {
    const matches = (!endpoint || benchmark.endpoint === endpoint) &&
                   (!method || benchmark.method === method) &&
                   (!releaseVersion || benchmark.releaseVersion === releaseVersion) &&
                   (!organizationId || benchmark.organizationId === organizationId);

    if (matches) {
      results.push(benchmark);
    }
  }

  return results;
};

// === UTILITY FUNCTIONS ===

const determineAppOperation = (endpoint: string, method: string): string => {
  if (endpoint.includes('/apps/') && method === 'GET') return 'app_view';
  if (endpoint.includes('/apps/') && method === 'POST') return 'app_create';
  if (endpoint.includes('/apps/') && method === 'PUT') return 'app_update';
  if (endpoint.includes('/data-queries/') && method === 'POST' && endpoint.includes('/run')) return 'query_execute';
  if (endpoint.includes('/data-queries/') && method === 'POST') return 'query_create';
  if (endpoint.includes('/data-queries/') && method === 'PATCH') return 'query_update';
  if (endpoint.includes('/versions/')) return 'version_management';
  return 'unknown';
};

export const getCurrentApiMetrics = () => {
  return {
    activeRequests: activeRequests.size,
    benchmarkDataKeys: benchmarkData.size,
    activeRequestDetails: Array.from(activeRequests.values()).map(ctx => ({
      requestId: ctx.requestId,
      endpoint: ctx.endpoint,
      method: ctx.method,
      duration: (performance.now() - ctx.startTime) / 1000,
      queryCount: ctx.queryCount,
      organizationId: ctx.organizationId,
    })),
  };
};

// Export the requestId generator for consistent tracking
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};