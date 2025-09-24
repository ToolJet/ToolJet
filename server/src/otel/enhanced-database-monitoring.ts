import { metrics, trace, context, Span } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

/**
 * Enhanced Database Monitoring for ToolJet
 *
 * Advanced database query instrumentation with individual query insights:
 * - Query-by-query performance analysis
 * - Connection pool monitoring with detailed statistics
 * - Slow query detection and analysis
 * - Query pattern recognition and optimization suggestions
 * - Database operation breakdown with timing insights
 *
 * Addresses team lead requirements:
 * 1. Database query time with query-by-query insights
 * 2. Connection pool monitoring
 * 3. Performance benchmarking for database operations
 */

// === DATABASE QUERY METRICS (OpenTelemetry Standard) ===
let dbClientOperationDuration: any;
let dbClientOperationCount: any;
let dbClientResponseReturnedRows: any;
let dbClientConnectionCount: any;
let dbClientConnectionIdleMax: any;
let dbClientConnectionIdleMin: any;
let dbClientConnectionMax: any;
let dbClientConnectionPendingRequests: any;
let dbClientConnectionTimeouts: any;
let dbClientConnectionCreateTime: any;
let dbClientConnectionWaitTime: any;
let dbClientConnectionUseTime: any;

// === ENHANCED QUERY ANALYSIS METRICS ===
let dbQueryComplexityHistogram: any;
let dbSlowQueryCounter: any;
let dbQueryPatternCounter: any;
let dbQueryOptimizationSuggestions: any;
let dbQueryExecutionPlanAnalysis: any;

// === QUERY TRACKING STATE ===
interface DetailedQueryContext {
  queryId: string;
  requestId?: string;
  organizationId: string;
  appId?: string;
  userId?: string;
  queryText: string;
  queryOperation: string;
  tablesInvolved: string[];
  startTime: number;
  connectionWaitStartTime?: number;
  queryPreparationTime?: number;
  executionPhases: Array<{
    phase: 'connection_acquire' | 'query_preparation' | 'execution' | 'result_processing';
    startTime: number;
    duration?: number;
    details?: any;
  }>;
  queryComplexity: {
    joinCount: number;
    whereClauseComplexity: number;
    subQueryCount: number;
    aggregationCount: number;
    estimatedRows: number;
  };
  connectionDetails: {
    poolId: string;
    connectionId: string;
    wasReused: boolean;
    waitTime: number;
  };
}

const activeDetailedQueries = new Map<string, DetailedQueryContext>();
const queryPatternCache = new Map<string, { count: number; avgDuration: number; lastSeen: number }>();
const slowQueryAnalysis = new Map<string, { frequency: number; patterns: string[]; suggestions: string[] }>();

// === CONNECTION POOL ENHANCED TRACKING ===
interface EnhancedConnectionPoolStats {
  poolId: string;
  databaseName: string;
  maxConnections: number;
  currentConnections: number;
  idleConnections: number;
  activeConnections: number;
  pendingRequests: number;
  connectionTimeouts: number;
  totalCreated: number;
  totalDestroyed: number;
  avgConnectionTime: number;
  avgQueryTime: number;
  lastUpdated: number;
}

const connectionPoolStats = new Map<string, EnhancedConnectionPoolStats>();

export const initializeEnhancedDatabaseMonitoring = () => {
  const meter = metrics.getMeter('tooljet-enhanced-database', '1.0.0');

  // === STANDARD OPENTELEMETRY DATABASE METRICS ===
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

  dbClientConnectionIdleMax = meter.createObservableGauge('db.client.connection.idle.max', {
    description: 'Maximum number of idle connections.',
  });

  dbClientConnectionIdleMin = meter.createObservableGauge('db.client.connection.idle.min', {
    description: 'Minimum number of idle connections.',
  });

  dbClientConnectionMax = meter.createObservableGauge('db.client.connection.max', {
    description: 'Maximum number of connections.',
  });

  dbClientConnectionPendingRequests = meter.createObservableGauge('db.client.connection.pending_requests', {
    description: 'Number of pending connection requests.',
  });

  dbClientConnectionTimeouts = meter.createCounter('db.client.connection.timeouts', {
    description: 'Number of connection timeouts.',
  });

  dbClientConnectionCreateTime = meter.createHistogram('db.client.connection.create_time', {
    description: 'Time to create a new database connection.',
    unit: 's',
  });

  dbClientConnectionWaitTime = meter.createHistogram('db.client.connection.wait_time', {
    description: 'Time spent waiting for a connection.',
    unit: 's',
  });

  dbClientConnectionUseTime = meter.createHistogram('db.client.connection.use_time', {
    description: 'Time connection was in use.',
    unit: 's',
  });

  // === ENHANCED QUERY ANALYSIS METRICS ===
  dbQueryComplexityHistogram = meter.createHistogram('tooljet.db.query.complexity', {
    description: 'Query complexity score based on joins, subqueries, and conditions.',
  });

  dbSlowQueryCounter = meter.createCounter('tooljet.db.query.slow.total', {
    description: 'Number of slow database queries detected.',
  });

  dbQueryPatternCounter = meter.createCounter('tooljet.db.query.pattern.total', {
    description: 'Database query patterns by type and frequency.',
  });

  dbQueryOptimizationSuggestions = meter.createCounter('tooljet.db.query.optimization.suggestions', {
    description: 'Number of query optimization suggestions generated.',
  });

  dbQueryExecutionPlanAnalysis = meter.createHistogram('tooljet.db.query.execution_plan.cost', {
    description: 'Database query execution plan cost analysis.',
  });

  // Setup observable gauge callbacks
  setupEnhancedConnectionPoolCallbacks();

  console.log('[ToolJet Backend] Enhanced Database Monitoring initialized');
};

// === DETAILED QUERY TRACKING ===

export const startDetailedQuery = (
  queryId: string,
  queryText: string,
  organizationId: string,
  requestId?: string,
  appId?: string,
  userId?: string
): void => {
  const startTime = performance.now();
  const queryOperation = extractQueryOperation(queryText);
  const tablesInvolved = extractTableNames(queryText);
  const complexity = analyzeQueryComplexity(queryText);

  activeDetailedQueries.set(queryId, {
    queryId,
    requestId,
    organizationId,
    appId,
    userId,
    queryText,
    queryOperation,
    tablesInvolved,
    startTime,
    executionPhases: [],
    queryComplexity: complexity,
    connectionDetails: {
      poolId: 'default',
      connectionId: '',
      wasReused: false,
      waitTime: 0,
    },
  });

  // Track query complexity
  if (dbQueryComplexityHistogram) {
    const complexityScore = calculateComplexityScore(complexity);
    dbQueryComplexityHistogram.record(complexityScore, {
      'db.operation.name': queryOperation.toLowerCase(),
      'db.system': 'postgresql',
      'tooljet.organization.id': organizationId,
    });
  }
};

export const recordQueryPhaseDetails = (
  queryId: string,
  phase: 'connection_acquire' | 'query_preparation' | 'execution' | 'result_processing',
  details?: any
): void => {
  const context = activeDetailedQueries.get(queryId);
  if (!context) return;

  const phaseStartTime = performance.now();

  // End previous phase if exists
  const currentPhase = context.executionPhases[context.executionPhases.length - 1];
  if (currentPhase && !currentPhase.duration) {
    currentPhase.duration = phaseStartTime - currentPhase.startTime;
  }

  // Start new phase
  context.executionPhases.push({
    phase,
    startTime: phaseStartTime,
    details,
  });

  // Record connection-specific metrics
  if (phase === 'connection_acquire' && details?.waitTime) {
    context.connectionDetails.waitTime = details.waitTime;
    if (dbClientConnectionWaitTime) {
      dbClientConnectionWaitTime.record(details.waitTime / 1000, {
        'db.system': 'postgresql',
        'tooljet.organization.id': context.organizationId,
      });
    }
  }
};

export const endDetailedQuery = (
  queryId: string,
  result: {
    rowsReturned: number;
    rowsAffected?: number;
    status: 'success' | 'error';
    errorType?: string;
    executionPlan?: any;
  }
): void => {
  const context = activeDetailedQueries.get(queryId);
  if (!context) return;

  const endTime = performance.now();
  const totalDuration = (endTime - context.startTime) / 1000; // Convert to seconds

  // End final phase
  const finalPhase = context.executionPhases[context.executionPhases.length - 1];
  if (finalPhase && !finalPhase.duration) {
    finalPhase.duration = endTime - finalPhase.startTime;
  }

  const baseAttributes = {
    'db.system': 'postgresql',
    'db.operation.name': context.queryOperation.toLowerCase(),
    'db.collection.name': context.tablesInvolved.length > 0 ? context.tablesInvolved[0] : 'unknown',
    'tooljet.organization.id': context.organizationId,
    ...(context.appId && { 'tooljet.app.id': context.appId }),
    ...(context.userId && { 'tooljet.user.id': context.userId }),
    ...(context.requestId && { 'tooljet.request.id': context.requestId }),
    ...(result.status === 'error' && result.errorType && { 'error.type': result.errorType }),
  };

  // Record standard OpenTelemetry metrics
  if (dbClientOperationDuration) {
    dbClientOperationDuration.record(totalDuration, baseAttributes);
  }

  if (dbClientOperationCount) {
    dbClientOperationCount.add(1, baseAttributes);
  }

  if (dbClientResponseReturnedRows && result.rowsReturned > 0) {
    dbClientResponseReturnedRows.record(result.rowsReturned, baseAttributes);
  }

  // Enhanced analysis
  analyzeQueryPerformance(context, totalDuration, result);
  updateQueryPatterns(context, totalDuration);
  checkForOptimizationOpportunities(context, totalDuration, result);

  // Clean up
  activeDetailedQueries.delete(queryId);

  console.log(`[ToolJet Enhanced DB] Query completed:`, {
    queryId,
    operation: context.queryOperation,
    tables: context.tablesInvolved.join(','),
    duration: `${totalDuration.toFixed(3)}s`,
    phases: context.executionPhases.length,
    rowsReturned: result.rowsReturned,
    status: result.status,
    organizationId: context.organizationId,
    complexityScore: calculateComplexityScore(context.queryComplexity)
  });
};

// === CONNECTION POOL ENHANCED TRACKING ===

export const updateEnhancedConnectionPool = (
  poolId: string,
  databaseName: string,
  stats: {
    maxConnections: number;
    currentConnections: number;
    idleConnections: number;
    activeConnections: number;
    pendingRequests: number;
    connectionTimeouts?: number;
    totalCreated?: number;
    totalDestroyed?: number;
    avgConnectionTime?: number;
    avgQueryTime?: number;
  }
): void => {
  connectionPoolStats.set(poolId, {
    poolId,
    databaseName,
    maxConnections: stats.maxConnections,
    currentConnections: stats.currentConnections,
    idleConnections: stats.idleConnections,
    activeConnections: stats.activeConnections,
    pendingRequests: stats.pendingRequests,
    connectionTimeouts: stats.connectionTimeouts || 0,
    totalCreated: stats.totalCreated || 0,
    totalDestroyed: stats.totalDestroyed || 0,
    avgConnectionTime: stats.avgConnectionTime || 0,
    avgQueryTime: stats.avgQueryTime || 0,
    lastUpdated: Date.now(),
  });
};

// === OBSERVABLE GAUGE CALLBACKS ===

const setupEnhancedConnectionPoolCallbacks = (): void => {
  if (dbClientConnectionCount) {
    dbClientConnectionCount.addCallback((observableResult: any) => {
      for (const stats of Array.from(connectionPoolStats.values())) {
        observableResult.observe(stats.currentConnections, {
          'db.client.connection.pool.name': stats.poolId,
          'db.system': 'postgresql',
          'tooljet.db.name': stats.databaseName,
        });
      }
    });
  }

  if (dbClientConnectionIdleMax) {
    dbClientConnectionIdleMax.addCallback((observableResult: any) => {
      for (const stats of Array.from(connectionPoolStats.values())) {
        observableResult.observe(stats.idleConnections, {
          'db.client.connection.pool.name': stats.poolId,
          'db.system': 'postgresql',
        });
      }
    });
  }

  if (dbClientConnectionMax) {
    dbClientConnectionMax.addCallback((observableResult: any) => {
      for (const stats of Array.from(connectionPoolStats.values())) {
        observableResult.observe(stats.maxConnections, {
          'db.client.connection.pool.name': stats.poolId,
          'db.system': 'postgresql',
        });
      }
    });
  }

  if (dbClientConnectionPendingRequests) {
    dbClientConnectionPendingRequests.addCallback((observableResult: any) => {
      for (const stats of Array.from(connectionPoolStats.values())) {
        observableResult.observe(stats.pendingRequests, {
          'db.client.connection.pool.name': stats.poolId,
          'db.system': 'postgresql',
        });
      }
    });
  }
};

// === QUERY ANALYSIS UTILITIES ===

const extractQueryOperation = (query: string): string => {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.startsWith('select')) return 'SELECT';
  if (normalizedQuery.startsWith('insert')) return 'INSERT';
  if (normalizedQuery.startsWith('update')) return 'UPDATE';
  if (normalizedQuery.startsWith('delete')) return 'DELETE';
  if (normalizedQuery.startsWith('create')) return 'CREATE';
  if (normalizedQuery.startsWith('drop')) return 'DROP';
  if (normalizedQuery.startsWith('alter')) return 'ALTER';
  if (normalizedQuery.startsWith('with')) return 'CTE';
  return 'OTHER';
};

const extractTableNames = (query: string): string[] => {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
  const tables: Set<string> = new Set();

  const patterns = [
    /from\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /join\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /update\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /insert\s+into\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /delete\s+from\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(normalizedQuery)) !== null) {
      if (match[1] && !match[1].includes('(')) {
        tables.add(match[1]);
      }
    }
  });

  return Array.from(tables);
};

const analyzeQueryComplexity = (query: string) => {
  const normalizedQuery = query.toLowerCase();

  return {
    joinCount: (normalizedQuery.match(/join/g) || []).length,
    whereClauseComplexity: (normalizedQuery.match(/where|and|or/g) || []).length,
    subQueryCount: (normalizedQuery.match(/\(/g) || []).length,
    aggregationCount: (normalizedQuery.match(/count|sum|avg|max|min|group by|having/g) || []).length,
    estimatedRows: estimateRowCount(query),
  };
};

const calculateComplexityScore = (complexity: any): number => {
  return complexity.joinCount * 2 +
         complexity.whereClauseComplexity * 0.5 +
         complexity.subQueryCount * 1.5 +
         complexity.aggregationCount * 1.2 +
         Math.log10(complexity.estimatedRows || 1);
};

const estimateRowCount = (query: string): number => {
  // Simple heuristic - would be enhanced with actual statistics
  const normalizedQuery = query.toLowerCase();
  if (normalizedQuery.includes('limit')) {
    const match = normalizedQuery.match(/limit\s+(\d+)/);
    return match ? parseInt(match[1]) : 1000;
  }
  return 1000; // Default estimate
};

const analyzeQueryPerformance = (
  context: DetailedQueryContext,
  totalDuration: number,
  result: any
): void => {
  const complexityScore = calculateComplexityScore(context.queryComplexity);
  const isSlowQuery = totalDuration > 1.0; // 1 second threshold

  if (isSlowQuery && dbSlowQueryCounter) {
    dbSlowQueryCounter.add(1, {
      'db.operation.name': context.queryOperation.toLowerCase(),
      'db.system': 'postgresql',
      'tooljet.organization.id': context.organizationId,
      'tooljet.query.complexity': complexityScore > 10 ? 'high' : complexityScore > 5 ? 'medium' : 'low',
    });

    // Store slow query for analysis
    const querySignature = generateQuerySignature(context.queryText);
    if (!slowQueryAnalysis.has(querySignature)) {
      slowQueryAnalysis.set(querySignature, {
        frequency: 0,
        patterns: [],
        suggestions: [],
      });
    }

    const analysis = slowQueryAnalysis.get(querySignature)!;
    analysis.frequency++;
    analysis.patterns.push(context.queryOperation);
  }
};

const updateQueryPatterns = (context: DetailedQueryContext, duration: number): void => {
  const pattern = generateQueryPattern(context.queryText);
  const existing = queryPatternCache.get(pattern);

  if (existing) {
    existing.count++;
    existing.avgDuration = (existing.avgDuration + duration) / 2;
    existing.lastSeen = Date.now();
  } else {
    queryPatternCache.set(pattern, {
      count: 1,
      avgDuration: duration,
      lastSeen: Date.now(),
    });
  }

  if (dbQueryPatternCounter) {
    dbQueryPatternCounter.add(1, {
      'db.operation.name': context.queryOperation.toLowerCase(),
      'tooljet.organization.id': context.organizationId,
      'tooljet.query.pattern': pattern,
    });
  }
};

const checkForOptimizationOpportunities = (
  context: DetailedQueryContext,
  duration: number,
  result: any
): void => {
  const suggestions = [];
  const complexityScore = calculateComplexityScore(context.queryComplexity);

  // Check for common optimization opportunities
  if (duration > 1.0 && context.queryComplexity.joinCount > 3) {
    suggestions.push('consider_join_optimization');
  }

  if (result.rowsReturned > 10000 && !context.queryText.toLowerCase().includes('limit')) {
    suggestions.push('add_limit_clause');
  }

  if (context.queryComplexity.subQueryCount > 2) {
    suggestions.push('consider_cte_refactor');
  }

  if (complexityScore > 15) {
    suggestions.push('high_complexity_review');
  }

  if (suggestions.length > 0 && dbQueryOptimizationSuggestions) {
    suggestions.forEach(suggestion => {
      dbQueryOptimizationSuggestions.add(1, {
        'tooljet.organization.id': context.organizationId,
        'tooljet.optimization.suggestion': suggestion,
        'db.operation.name': context.queryOperation.toLowerCase(),
      });
    });
  }
};

// === UTILITY FUNCTIONS ===

const generateQuerySignature = (query: string): string => {
  // Create a normalized signature by removing literals and parameters
  return query
    .replace(/\d+/g, '?')
    .replace(/'[^']*'/g, '?')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
};

const generateQueryPattern = (query: string): string => {
  const operation = extractQueryOperation(query);
  const tables = extractTableNames(query);
  return `${operation}_${tables.join('_')}`.toLowerCase();
};

export const getEnhancedDatabaseStats = () => {
  return {
    activeQueries: activeDetailedQueries.size,
    connectionPools: connectionPoolStats.size,
    queryPatterns: queryPatternCache.size,
    slowQueryPatterns: slowQueryAnalysis.size,
    activeQueryDetails: Array.from(activeDetailedQueries.values()).map(ctx => ({
      queryId: ctx.queryId,
      operation: ctx.queryOperation,
      tables: ctx.tablesInvolved,
      duration: (performance.now() - ctx.startTime) / 1000,
      phases: ctx.executionPhases.length,
      complexityScore: calculateComplexityScore(ctx.queryComplexity),
      organizationId: ctx.organizationId,
    })),
    connectionPoolDetails: Array.from(connectionPoolStats.values()),
  };
};

export const generateQueryId = (): string => {
  return `dbq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};