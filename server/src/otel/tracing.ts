import { CompositePropagator, W3CTraceContextPropagator, W3CBaggagePropagator } from '@opentelemetry/core';
import { trace, context, Span, DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import * as process from 'process';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  ATTR_DB_QUERY_TEXT,
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_COLLECTION_NAME,
} from '@opentelemetry/semantic-conventions';

const OTEL_EXPORTER_OTLP_TRACES = process.env.OTEL_EXPORTER_OTLP_TRACES || 'http://localhost:4318/v1/traces';
const OTEL_EXPORTER_OTLP_METRICS = process.env.OTEL_EXPORTER_OTLP_METRICS || 'http://localhost:4318/v1/metrics';
const DB_SLOW_QUERY_THRESHOLD = parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'); // milliseconds

// Set this up to see debug logs
if (process.env.OTEL_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// Custom metrics
let meter: any;
let dbQueryCounter: any;
let dbQueryDuration: any;
let slowQueryCounter: any;
let apiRequestDuration: any;
let apiRequestCounter: any;
let activeRequestsGauge: any;
let requestBodySizeHistogram: any;
let responseBodySizeHistogram: any;
let errorRateCounter: any;
let dbQueriesPerRequestHistogram: any;
let authAttemptCounter: any;
let activeUsersGauge: any;
let userSessionDuration: any;
let userApiCallCounter: any;
let uniqueUsersCounter: any;

// Define the trace exporter
const traceExporter = new OTLPTraceExporter({
  url: OTEL_EXPORTER_OTLP_TRACES,
  ...(!!process.env.OTEL_HEADER ? { headers: { Authorization: process.env.OTEL_HEADER } } : {} ),
});

// Define the metric exporter
const metricExporter = new OTLPMetricExporter({
  url: OTEL_EXPORTER_OTLP_METRICS,
  ...(!!process.env.OTEL_HEADER ? { headers: { Authorization: process.env.OTEL_HEADER } } : {} ),
});

// Define the log exporter
// TODO:
// Add logs exporter when stable support for JS is available. Track here:
// https://github.com/open-telemetry/opentelemetry-js

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME || 'tooljet',
  [ATTR_SERVICE_VERSION]: globalThis.TOOLJET_VERSION || process.env.SERVICE_VERSION || 'unknown',
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

const sanitizeObject = (obj: any) => {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value !== 'function') {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Extract database operation from SQL query
const extractOperationFromQuery = (query: string): string => {
  if (!query) return 'unknown';
  const trimmed = query.trim().toUpperCase();
  const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'BEGIN', 'COMMIT', 'ROLLBACK'];
  for (const op of operations) {
    if (trimmed.startsWith(op)) {
      return op;
    }
  }
  return 'unknown';
};

export const sdk = new NodeSDK({
  resource: resource,
  traceExporter: traceExporter,
  spanProcessor: new BatchSpanProcessor(traceExporter),
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
  }),
  textMapPropagator: new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  }),
  instrumentations: [
    new RuntimeNodeInstrumentation({ monitoringPrecision: 5000 }),
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (request: any) => request.url === '/api/health',
    }),
    new ExpressInstrumentation({
      requestHook: (span: Span, { request }) => {
        const path = request.route?.path || request.path || '';
        if (path.startsWith('/api/') && path !== '/api/health') {
          span.updateName(`${request.method} ${path}`);
          span.setAttribute('http.route', path);
          span.setAttribute('http.method', request.method);

          if (request.params && Object.keys(request.params).length > 0) {
            span.setAttribute('http.params', JSON.stringify(sanitizeObject(request.params)));
          }

          if (request.query && Object.keys(request.query).length > 0) {
            span.setAttribute('http.query', JSON.stringify(sanitizeObject(request.query)));
          }

          if (request.body && Object.keys(request.body).length > 0) {
            span.setAttribute('http.body', JSON.stringify(sanitizeObject(request.body)));
          }
        }
      },
    }),
    new NestInstrumentation(),
    new PgInstrumentation({
      enhancedDatabaseReporting: true,
      requestHook: (span: Span, requestInfo: any) => {
        // Add query text and parameters to the span
        if (requestInfo.query) {
          span.setAttribute(ATTR_DB_QUERY_TEXT, requestInfo.query);
          const operation = extractOperationFromQuery(requestInfo.query);
          span.setAttribute(ATTR_DB_OPERATION_NAME, operation);

          // Store metadata in a way we can retrieve it
          (span as any)._otel_query_metadata = {
            operation,
            startTime: Date.now(),
          };
        }

        // Sanitize and add query parameters
        if (requestInfo.values && Array.isArray(requestInfo.values)) {
          try {
            const sanitizedValues = requestInfo.values.map((val: any) =>
              typeof val === 'object' ? '[Object]' : String(val)
            );
            span.setAttribute('db.query.parameters', JSON.stringify(sanitizedValues.slice(0, 10))); // Limit to first 10 params
          } catch (e) {
            // Ignore serialization errors
          }
        }
      },
      responseHook: (span: Span, responseInfo: any) => {
        // Calculate query duration and track slow queries
        const metadata = (span as any)._otel_query_metadata;
        if (metadata && metadata.startTime) {
          const duration = Date.now() - metadata.startTime;
          span.setAttribute('db.query.duration_ms', duration);

          // Track queries per request by incrementing on the active HTTP request context
          const activeContext = context.active();
          const httpSpan = trace.getSpan(activeContext);
          if (httpSpan) {
            try {
              const req = (httpSpan as any)._request;
              if (req && req._otel_db_query_count !== undefined) {
                req._otel_db_query_count++;
              }
            } catch (e) {
              // Ignore if we can't access the request
            }
          }

          // Mark slow queries
          if (duration > DB_SLOW_QUERY_THRESHOLD) {
            span.setAttribute('db.query.slow', true);
            span.setAttribute('db.query.slow_threshold_ms', DB_SLOW_QUERY_THRESHOLD);

            // Increment slow query counter metric
            if (slowQueryCounter) {
              slowQueryCounter.add(1, {
                operation: metadata.operation || 'unknown',
                duration_bucket: duration < 5000 ? 'slow' : 'very_slow'
              });
            }
          }

          // Record query duration metric
          if (dbQueryDuration) {
            dbQueryDuration.record(duration, { operation: metadata.operation || 'unknown' });
          }

          // Increment query counter metric
          if (dbQueryCounter) {
            dbQueryCounter.add(1, { operation: metadata.operation || 'unknown' });
          }
        }

        // Add row count if available
        if (responseInfo && responseInfo.rowCount !== undefined) {
          span.setAttribute('db.query.row_count', responseInfo.rowCount);
        }
      },
    }),
    new PinoInstrumentation(),
  ],
});

// Track active requests per route
const activeRequestsByRoute = new Map<string, number>();

// Track active users by organization and last activity timestamp
const activeUsersByOrg = new Map<string, Set<string>>(); // orgId -> Set of userIds
const userLastActivity = new Map<string, number>(); // userId -> timestamp
const USER_ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Helper to clean up inactive users
const cleanupInactiveUsers = () => {
  const now = Date.now();
  const inactiveUsers: string[] = [];

  for (const [userId, lastActivity] of userLastActivity.entries()) {
    if (now - lastActivity > USER_ACTIVITY_TIMEOUT) {
      inactiveUsers.push(userId);
    }
  }

  // Remove inactive users
  for (const userId of inactiveUsers) {
    userLastActivity.delete(userId);
    // Remove from all organizations
    for (const [orgId, users] of activeUsersByOrg.entries()) {
      users.delete(userId);
      if (users.size === 0) {
        activeUsersByOrg.delete(orgId);
      }
    }
  }
};

// Periodic cleanup every minute
setInterval(cleanupInactiveUsers, 60 * 1000);

// Custom Express middleware for tracing and metrics
export const otelMiddleware = (req: any, res: any, next: () => void, ...args: any[]) => {
  const span = trace.getSpan(context.active());
  const route = req.route?.path || req.path || 'unknown_route';
  const method = req.method || 'UNKNOWN_METHOD';

  // Track request start time for API metrics
  const requestStartTime = Date.now();

  if (span && route.startsWith('/api/') && route !== '/api/health') {
    span.updateName(`${method} ${route}`);
    span.setAttribute('http.route', route);
    span.setAttribute('http.method', method);

    // Store request reference on span for DB query tracking
    (span as any)._request = req;

    // Track user activity (extract from JWT token, session, or user object)
    const userId = req.user?.id || req.session?.userId || req.headers['x-user-id'];
    const orgId = req.user?.organizationId || req.session?.organizationId || req.headers['x-organization-id'];

    if (userId) {
      span.setAttribute('user.id', userId);
      userLastActivity.set(userId, Date.now());

      if (orgId) {
        span.setAttribute('user.organization_id', orgId);
        if (!activeUsersByOrg.has(orgId)) {
          activeUsersByOrg.set(orgId, new Set());
        }
        activeUsersByOrg.get(orgId)!.add(userId);
      }

      // Track API calls per user
      if (userApiCallCounter) {
        userApiCallCounter.add(1, {
          user_id: userId,
          ...(orgId && { organization_id: orgId }),
          route,
          method
        });
      }
    }

    // Track active requests
    const routeKey = `${method}:${route}`;
    const currentActive = activeRequestsByRoute.get(routeKey) || 0;
    activeRequestsByRoute.set(routeKey, currentActive + 1);

    // Track request body size
    const requestBodySize = req.get('content-length') ? parseInt(req.get('content-length')) :
                           (req.body ? JSON.stringify(req.body).length : 0);
    if (requestBodySize > 0) {
      span.setAttribute('http.request.body.size', requestBodySize);
      if (requestBodySizeHistogram) {
        requestBodySizeHistogram.record(requestBodySize, { route, method });
      }
    }

    // Track DB query count per request
    let dbQueryCount = 0;
    const originalDbQueryCounter = dbQueryCounter;

    // Store metadata for tracking
    req._otel_start_time = requestStartTime;
    req._otel_db_query_count = 0;

    const originalJson = res.json;
    res.json = function (body: any) {
      const statusCode = res.statusCode;
      const duration = Date.now() - requestStartTime;

      span.setAttribute('http.status_code', statusCode);
      span.setAttribute('http.response.duration_ms', duration);

      // Track response body size
      const responseBodySize = body ? JSON.stringify(body).length : 0;
      if (responseBodySize > 0) {
        span.setAttribute('http.response.body.size', responseBodySize);
        if (responseBodySizeHistogram) {
          responseBodySizeHistogram.record(responseBodySize, { route, method, status: statusCode });
        }
      }

      // Collect DB query metrics from child spans
      const dbQueries = req._otel_db_query_count || 0;
      if (dbQueries > 0) {
        span.setAttribute('db.queries.count', dbQueries);
        if (dbQueriesPerRequestHistogram) {
          dbQueriesPerRequestHistogram.record(dbQueries, { route, method });
        }
      }

      // Decrement active requests
      const currentActive = activeRequestsByRoute.get(routeKey) || 1;
      activeRequestsByRoute.set(routeKey, Math.max(0, currentActive - 1));

      // Record API metrics
      if (apiRequestDuration && route !== '/api/health') {
        apiRequestDuration.record(duration, {
          route,
          method,
          status: statusCode,
        });
      }

      if (apiRequestCounter && route !== '/api/health') {
        apiRequestCounter.add(1, {
          route,
          method,
          status: statusCode,
          success: statusCode < 400 ? 'true' : 'false',
        });
      }

      // Track error rates by category
      if (errorRateCounter && statusCode >= 400) {
        const errorType = statusCode >= 500 ? '5xx' : '4xx';
        const errorCategory = statusCode === 401 || statusCode === 403 ? 'auth' :
                             statusCode === 404 ? 'not_found' :
                             statusCode === 429 ? 'rate_limit' :
                             statusCode >= 500 ? 'server_error' : 'client_error';

        errorRateCounter.add(1, {
          route,
          method,
          status: statusCode,
          error_type: errorType,
          error_category: errorCategory,
        });
      }

      // eslint-disable-next-line prefer-rest-params
      return originalJson.apply(this, arguments);
    };
  }

  next();
};

process.on('SIGTERM', () => {
  if (sdk) {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry instrumentation shutdown successfully'))
      .catch((err) => console.log('Error shutting down OpenTelemetry instrumentation', err))
      .finally(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

export const startOpenTelemetry = async (): Promise<void> => {
  try {
    await sdk.start();
    console.log('OpenTelemetry instrumentation initialized');

    // Initialize custom metrics
    meter = metrics.getMeter('tooljet-backend', globalThis.TOOLJET_VERSION || '1.0.0');

    // Database metrics
    dbQueryCounter = meter.createCounter('db.query.count', {
      description: 'Total number of database queries executed',
      unit: 'queries',
    });

    dbQueryDuration = meter.createHistogram('db.query.duration', {
      description: 'Duration of database queries in milliseconds',
      unit: 'ms',
    });

    slowQueryCounter = meter.createCounter('db.query.slow.count', {
      description: 'Total number of slow database queries',
      unit: 'queries',
    });

    dbQueriesPerRequestHistogram = meter.createHistogram('db.queries.per.request', {
      description: 'Number of database queries per API request',
      unit: 'queries',
    });

    // API metrics
    apiRequestDuration = meter.createHistogram('http.server.request.duration', {
      description: 'Duration of HTTP requests in milliseconds',
      unit: 'ms',
    });

    apiRequestCounter = meter.createCounter('http.server.request.count', {
      description: 'Total number of HTTP requests',
      unit: 'requests',
    });

    activeRequestsGauge = meter.createObservableGauge('http.server.active.requests', {
      description: 'Number of active HTTP requests',
      unit: 'requests',
    });

    // Register callback to report active requests per route
    activeRequestsGauge.addCallback((observableResult: any) => {
      for (const [routeKey, count] of activeRequestsByRoute.entries()) {
        const [method, route] = routeKey.split(':', 2);
        observableResult.observe(count, { route, method });
      }
    });

    requestBodySizeHistogram = meter.createHistogram('http.server.request.body.size', {
      description: 'Size of HTTP request bodies in bytes',
      unit: 'bytes',
    });

    responseBodySizeHistogram = meter.createHistogram('http.server.response.body.size', {
      description: 'Size of HTTP response bodies in bytes',
      unit: 'bytes',
    });

    errorRateCounter = meter.createCounter('http.server.errors', {
      description: 'HTTP error responses by type and category',
      unit: 'errors',
    });

    authAttemptCounter = meter.createCounter('auth.attempts', {
      description: 'Authentication attempts by outcome',
      unit: 'attempts',
    });

    // User metrics
    activeUsersGauge = meter.createObservableGauge('users.active', {
      description: 'Number of active users in the last 5 minutes',
      unit: 'users',
    });

    // Register callback to report active users per organization
    activeUsersGauge.addCallback((observableResult: any) => {
      // Total active users across all organizations
      const totalActiveUsers = userLastActivity.size;
      observableResult.observe(totalActiveUsers, { scope: 'total' });

      // Active users per organization
      for (const [orgId, users] of activeUsersByOrg.entries()) {
        observableResult.observe(users.size, {
          scope: 'organization',
          organization_id: orgId
        });
      }
    });

    userApiCallCounter = meter.createCounter('users.api.calls', {
      description: 'API calls per user',
      unit: 'calls',
    });

    userSessionDuration = meter.createHistogram('users.session.duration', {
      description: 'User session duration in seconds',
      unit: 'seconds',
    });

    uniqueUsersCounter = meter.createCounter('users.unique', {
      description: 'Unique users seen',
      unit: 'users',
    });

    console.log('Custom metrics initialized:', {
      database: ['db.query.count', 'db.query.duration', 'db.query.slow.count', 'db.queries.per.request'],
      api: ['http.server.request.duration', 'http.server.request.count', 'http.server.active.requests',
            'http.server.request.body.size', 'http.server.response.body.size', 'http.server.errors'],
      auth: ['auth.attempts'],
      users: ['users.active', 'users.api.calls', 'users.session.duration', 'users.unique']
    });
  } catch (error) {
    console.error('Error initializing OpenTelemetry instrumentation', error);
    throw error;
  }
};

// Track unique users seen in this session
const seenUsers = new Set<string>();

// Helper function to track authentication attempts
export const trackAuthAttempt = (outcome: 'success' | 'failure', method: string, reason?: string) => {
  if (authAttemptCounter) {
    authAttemptCounter.add(1, {
      outcome,
      method, // e.g., 'password', 'sso', 'oauth', 'api_key'
      ...(reason && { reason }), // e.g., 'invalid_credentials', 'user_not_found', 'account_locked'
    });
  }
};

// Helper function to track user login (call this after successful authentication)
export const trackUserLogin = (userId: string, organizationId?: string) => {
  if (userId && !seenUsers.has(userId)) {
    seenUsers.add(userId);
    if (uniqueUsersCounter) {
      uniqueUsersCounter.add(1, {
        ...(organizationId && { organization_id: organizationId })
      });
    }
  }

  // Update user activity
  userLastActivity.set(userId, Date.now());
  if (organizationId) {
    if (!activeUsersByOrg.has(organizationId)) {
      activeUsersByOrg.set(organizationId, new Set());
    }
    activeUsersByOrg.get(organizationId)!.add(userId);
  }
};

// Helper function to track user logout (call this when user logs out)
export const trackUserLogout = (userId: string, sessionStartTime: number) => {
  if (userSessionDuration && sessionStartTime) {
    const sessionDurationSeconds = (Date.now() - sessionStartTime) / 1000;
    userSessionDuration.record(sessionDurationSeconds, { user_id: userId });
  }

  // Remove user from active tracking
  userLastActivity.delete(userId);
  for (const [orgId, users] of activeUsersByOrg.entries()) {
    users.delete(userId);
    if (users.size === 0) {
      activeUsersByOrg.delete(orgId);
    }
  }
};

// Get current active users count (for monitoring/debugging)
export const getActiveUsersCount = (organizationId?: string): number => {
  if (organizationId) {
    return activeUsersByOrg.get(organizationId)?.size || 0;
  }
  return userLastActivity.size;
};

export default sdk;
