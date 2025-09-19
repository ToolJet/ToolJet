import { Request, Response, NextFunction } from 'express';
import { trace, context, Span } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

// Type augmentations for Express Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    [key: string]: any;
  };
  session?: {
    current_organization_id?: string;
    [key: string]: any;
  };
  performanceRequestId?: string;
}

// Import all our performance monitoring modules
import {
  initializeApiPerformanceMetrics,
  startApiRequest,
  endApiRequest,
  recordDbOperation,
  recordExternalOperation,
  generateRequestId,
} from './api-performance-metrics';

import {
  initializePluginPerformanceMetrics,
  startPluginQuery,
  endPluginQuery,
  updateConnectionPool,
  recordConnectionCreation,
  normalizeDatasourceKind,
  generateQueryId,
} from './plugin-performance-metrics';

import {
  initializeEnhancedDatabaseMonitoring,
  startDetailedQuery,
  recordQueryPhaseDetails,
  endDetailedQuery,
  updateEnhancedConnectionPool,
  generateQueryId as generateDbQueryId,
} from './enhanced-database-monitoring';

import {
  initializeBenchmarkingFramework,
  recordBenchmarkMeasurement,
  compareReleasePerformance,
  analyzeAppBuilderViewerPerformance,
} from './benchmarking-framework';

/**
 * Comprehensive API Performance Middleware
 *
 * This middleware automatically instruments ALL API requests with:
 * 1. Total API execution time
 * 2. Database query time with individual query insights
 * 3. External operation timing
 * 4. App builder/viewer specific performance tracking
 * 5. Benchmarking data collection for release comparisons
 *
 * Addresses all team lead requirements in a unified system.
 */

// === MIDDLEWARE STATE ===
interface RequestContext {
  requestId: string;
  startTime: number;
  organizationId?: string;
  userId?: string;
  appId?: string;
  endpoint: string;
  method: string;
  isAppBuilderViewer: boolean;
  operationType: string;
  dbQueries: Array<{
    queryId: string;
    startTime: number;
    query: string;
    operation: string;
    table: string;
  }>;
  externalOperations: Array<{
    startTime: number;
    operation: string;
    provider: string;
  }>;
  memoryUsageStart: number;
}

const requestContexts = new Map<string, RequestContext>();

// === INITIALIZATION ===
let isInitialized = false;

export const initializeComprehensiveApiMonitoring = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    console.log('[ToolJet API Monitoring] Initializing comprehensive performance monitoring...');

    // Initialize all monitoring components
    await initializeApiPerformanceMetrics();
    await initializePluginPerformanceMetrics();
    await initializeEnhancedDatabaseMonitoring();
    await initializeBenchmarkingFramework();

    isInitialized = true;
    console.log('[ToolJet API Monitoring] Comprehensive performance monitoring initialized successfully');
  } catch (error) {
    console.error('[ToolJet API Monitoring] Failed to initialize:', error);
    throw error;
  }
};

// === MAIN MIDDLEWARE ===

export const comprehensiveApiMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!isInitialized) {
    console.warn('[ToolJet API Monitoring] Middleware called before initialization');
    return next();
  }

  const requestId = generateRequestId();
  const startTime = performance.now();
  const endpoint = req.route?.path || req.path || 'unknown';
  const method = req.method;

  // Skip health checks and non-API routes
  if (endpoint === '/api/health' || !endpoint.startsWith('/api/')) {
    return next();
  }

  // Extract context information
  const organizationId = req.user?.organizationId ||
                        req.headers?.['tj-workspace-id'] as string ||
                        req.session?.current_organization_id;

  const userId = req.user?.id;
  const appId = extractAppId(req);
  const isAppBuilderViewer = isAppBuilderViewerEndpoint(endpoint, method);
  const operationType = determineOperationType(endpoint, method);

  // Create request context
  const requestContext: RequestContext = {
    requestId,
    startTime,
    organizationId,
    userId,
    appId,
    endpoint,
    method,
    isAppBuilderViewer,
    operationType,
    dbQueries: [],
    externalOperations: [],
    memoryUsageStart: process.memoryUsage().heapUsed,
  };

  requestContexts.set(requestId, requestContext);

  // Start API request tracking
  startApiRequest(
    requestId,
    endpoint,
    method,
    getRequestBodySize(req),
    organizationId,
    userId,
    appId
  );

  // Add request ID to request object for other modules to use
  (req as any).performanceRequestId = requestId;

  // Intercept response to collect final metrics
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function(body: any) {
    collectFinalMetrics(requestId, res.statusCode, JSON.stringify(body).length);
    return originalJson.call(this, body);
  };

  res.send = function(body: any) {
    const responseSize = typeof body === 'string' ? body.length : JSON.stringify(body).length;
    collectFinalMetrics(requestId, res.statusCode, responseSize);
    return originalSend.call(this, body);
  };

  next();
};

// === DATABASE QUERY INSTRUMENTATION ===

export const instrumentDatabaseQuery = (
  query: string,
  operation: string,
  table: string,
  requestId?: string
) => {
  if (!isInitialized) return { queryId: null, start: () => {}, end: () => {} };

  const queryId = generateDbQueryId();
  const context = requestId ? requestContexts.get(requestId) : null;

  // Start detailed query tracking
  startDetailedQuery(
    queryId,
    query,
    context?.organizationId || 'unknown',
    requestId,
    context?.appId,
    context?.userId
  );

  // Add to request context if available
  if (context) {
    context.dbQueries.push({
      queryId,
      startTime: performance.now(),
      query,
      operation,
      table,
    });
  }

  const startTime = performance.now();
  let connectionWaitTime = 0;

  return {
    queryId,
    recordConnectionWait: (waitTime: number) => {
      connectionWaitTime = waitTime;
      recordQueryPhaseDetails(queryId, 'connection_acquire', { waitTime });
    },
    recordPreparation: (details?: any) => {
      recordQueryPhaseDetails(queryId, 'query_preparation', details);
    },
    recordExecution: (details?: any) => {
      recordQueryPhaseDetails(queryId, 'execution', details);
    },
    recordResultProcessing: (details?: any) => {
      recordQueryPhaseDetails(queryId, 'result_processing', details);
    },
    end: (result: {
      rowsReturned: number;
      rowsAffected?: number;
      status: 'success' | 'error';
      errorType?: string;
    }) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // End detailed query tracking
      endDetailedQuery(queryId, result);

      // Record in API request tracking if context available
      if (context && requestId) {
        recordDbOperation(
          requestId,
          query,
          operation,
          table,
          duration,
          result.rowsReturned,
          result.status,
          connectionWaitTime
        );
      }
    },
  };
};

// === PLUGIN QUERY INSTRUMENTATION ===

export const instrumentPluginQuery = (
  datasourceKind: string,
  queryName: string,
  queryOptions: any,
  requestId?: string
) => {
  if (!isInitialized) return { queryId: null, end: () => {} };

  const queryId = generateQueryId();
  const context = requestId ? requestContexts.get(requestId) : null;

  startPluginQuery(
    queryId,
    normalizeDatasourceKind(datasourceKind),
    context?.organizationId || 'unknown',
    context?.appId || 'unknown',
    queryName,
    queryOptions
  );

  return {
    queryId,
    recordPhase: (phase: 'connection' | 'preparation' | 'execution' | 'result_processing', duration: number, details?: any) => {
      // This would be called by the plugin execution code
    },
    end: (result: {
      status: 'success' | 'failure';
      rowsReturned?: number;
      dataSize?: number;
      errorType?: string;
      errorMessage?: string;
    }) => {
      endPluginQuery(queryId, result.status, result);
    },
  };
};

// === EXTERNAL OPERATION INSTRUMENTATION ===

export const instrumentExternalOperation = (
  operation: string,
  provider: string,
  requestId?: string
) => {
  if (!isInitialized) return { end: () => {} };

  const startTime = performance.now();
  const context = requestId ? requestContexts.get(requestId) : null;

  if (context) {
    context.externalOperations.push({
      startTime,
      operation,
      provider,
    });
  }

  return {
    end: (result: {
      status: 'success' | 'error';
      httpMethod?: string;
      statusCode?: number;
    }) => {
      const duration = performance.now() - startTime;

      if (requestId) {
        recordExternalOperation(
          requestId,
          operation,
          provider,
          duration,
          result.status,
          result.httpMethod,
          result.statusCode
        );
      }
    },
  };
};

// === FINAL METRICS COLLECTION ===

const collectFinalMetrics = (requestId: string, statusCode: number, responseSize: number) => {
  const context = requestContexts.get(requestId);
  if (!context) return;

  const endTime = performance.now();
  const totalDuration = (endTime - context.startTime) / 1000; // Convert to seconds
  const memoryUsageEnd = process.memoryUsage().heapUsed;
  const memoryUsage = memoryUsageEnd - context.memoryUsageStart;

  // Calculate timing breakdown
  const dbDuration = context.dbQueries.reduce((sum, q) => {
    return sum + ((performance.now() - q.startTime) / 1000);
  }, 0);

  const externalDuration = context.externalOperations.reduce((sum, op) => {
    return sum + ((performance.now() - op.startTime) / 1000);
  }, 0);

  const businessLogicDuration = Math.max(0, totalDuration - dbDuration - externalDuration);

  // End API request tracking
  endApiRequest(requestId, statusCode, responseSize);

  // Record benchmark measurement
  const releaseVersion = process.env.TOOLJET_VERSION || globalThis.TOOLJET_VERSION || '1.0.0';

  recordBenchmarkMeasurement(
    releaseVersion,
    context.endpoint,
    context.method,
    context.organizationId || 'unknown',
    {
      totalDuration,
      dbDuration,
      externalDuration,
      businessLogicDuration,
      memoryUsage,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      dbQueryCount: context.dbQueries.length,
      statusCode,
      responseSize,
    },
    {
      isAppBuilderViewer: context.isAppBuilderViewer,
      operationType: context.operationType,
      dataComplexity: calculateDataComplexity(context),
      userLoad: getCurrentUserLoad(),
      concurrentRequests: requestContexts.size,
    },
    context.appId,
    context.userId
  );

  // Clean up
  requestContexts.delete(requestId);

  console.log(`[ToolJet API Monitoring] Request completed:`, {
    requestId,
    endpoint: context.endpoint,
    method: context.method,
    duration: `${totalDuration.toFixed(3)}s`,
    breakdown: {
      db: `${dbDuration.toFixed(3)}s`,
      external: `${externalDuration.toFixed(3)}s`,
      businessLogic: `${businessLogicDuration.toFixed(3)}s`,
    },
    dbQueries: context.dbQueries.length,
    statusCode,
    isAppBuilderViewer: context.isAppBuilderViewer,
    operationType: context.operationType,
    organizationId: context.organizationId,
  });
};

// === UTILITY FUNCTIONS ===

const extractAppId = (req: AuthenticatedRequest): string | undefined => {
  // Try to extract app ID from various sources
  if (req.params?.id && req.path.includes('/apps/')) return req.params.id;
  if (req.params?.appId) return req.params.appId;
  if (req.body?.appId) return req.body.appId;
  if (req.query?.appId) return req.query.appId as string;
  return undefined;
};

const isAppBuilderViewerEndpoint = (endpoint: string, method: string): boolean => {
  const appBuilderViewerPatterns = [
    '/api/apps',
    '/api/data-queries',
    '/api/versions',
    '/api/app-versions',
    '/api/data-sources',
    '/api/plugins',
  ];

  return appBuilderViewerPatterns.some(pattern => endpoint.includes(pattern));
};

const determineOperationType = (endpoint: string, method: string): string => {
  if (endpoint.includes('/apps/') && method === 'GET') return 'app_view';
  if (endpoint.includes('/apps/') && method === 'POST') return 'app_create';
  if (endpoint.includes('/apps/') && method === 'PUT') return 'app_update';
  if (endpoint.includes('/data-queries/') && method === 'POST' && endpoint.includes('/run')) return 'query_execute';
  if (endpoint.includes('/data-queries/') && method === 'POST') return 'query_create';
  if (endpoint.includes('/data-queries/') && method === 'PATCH') return 'query_update';
  if (endpoint.includes('/data-sources/')) return 'datasource_management';
  if (endpoint.includes('/versions/')) return 'version_management';
  if (endpoint.includes('/plugins/')) return 'plugin_management';
  return 'general_api';
};

const getRequestBodySize = (req: AuthenticatedRequest): number => {
  if (!req.body) return 0;
  return JSON.stringify(req.body).length;
};

const calculateDataComplexity = (context: RequestContext): number => {
  // Simple heuristic for data complexity
  let complexity = 0;
  complexity += context.dbQueries.length * 2;
  complexity += context.externalOperations.length * 1.5;

  // Add complexity based on query types
  context.dbQueries.forEach(q => {
    if (q.query.toLowerCase().includes('join')) complexity += 3;
    if (q.query.toLowerCase().includes('group by')) complexity += 2;
    if (q.query.toLowerCase().includes('order by')) complexity += 1;
    if (q.query.toLowerCase().includes('limit')) complexity -= 0.5;
  });

  return complexity;
};

const getCurrentUserLoad = (): number => {
  // Simplified user load calculation
  return requestContexts.size;
};

// === PERFORMANCE REPORTS ===

export const generatePerformanceReport = (releaseVersion?: string) => {
  const currentRelease = releaseVersion || process.env.TOOLJET_VERSION || globalThis.TOOLJET_VERSION || '1.0.0';

  return {
    currentRelease,
    generatedAt: new Date().toISOString(),
    activeRequests: requestContexts.size,
    appBuilderViewerAnalysis: analyzeAppBuilderViewerPerformance(currentRelease),
    summary: {
      totalRequestsTracked: requestContexts.size,
      avgResponseTime: calculateAvgResponseTime(),
      slowestEndpoints: getSlowestEndpoints(),
      mostActiveOrganizations: getMostActiveOrganizations(),
    },
  };
};

const calculateAvgResponseTime = (): number => {
  const contexts = Array.from(requestContexts.values());
  if (contexts.length === 0) return 0;

  const currentTime = performance.now();
  const totalDuration = contexts.reduce((sum, ctx) => sum + (currentTime - ctx.startTime), 0);

  return (totalDuration / contexts.length) / 1000; // Convert to seconds
};

const getSlowestEndpoints = () => {
  const endpointTimes = new Map<string, number[]>();

  for (const ctx of Array.from(requestContexts.values())) {
    const key = `${ctx.method} ${ctx.endpoint}`;
    const duration = (performance.now() - ctx.startTime) / 1000;

    if (!endpointTimes.has(key)) {
      endpointTimes.set(key, []);
    }
    endpointTimes.get(key)!.push(duration);
  }

  const averages = Array.from(endpointTimes.entries()).map(([endpoint, times]) => ({
    endpoint,
    avgDuration: times.reduce((sum, t) => sum + t, 0) / times.length,
    requestCount: times.length,
  }));

  return averages.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 10);
};

const getMostActiveOrganizations = () => {
  const orgCounts = new Map<string, number>();

  for (const ctx of Array.from(requestContexts.values())) {
    if (ctx.organizationId) {
      orgCounts.set(ctx.organizationId, (orgCounts.get(ctx.organizationId) || 0) + 1);
    }
  }

  return Array.from(orgCounts.entries())
    .map(([orgId, count]) => ({ organizationId: orgId, requestCount: count }))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, 10);
};

// === HEALTH CHECK ===

export const getMonitoringHealth = () => {
  return {
    initialized: isInitialized,
    activeRequests: requestContexts.size,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    status: isInitialized ? 'healthy' : 'not_initialized',
  };
};