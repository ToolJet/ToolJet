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
} from '@opentelemetry/semantic-conventions';

const OTEL_EXPORTER_OTLP_TRACES = process.env.OTEL_EXPORTER_OTLP_TRACES || 'http://localhost:4318/v1/traces';
const OTEL_EXPORTER_OTLP_METRICS = process.env.OTEL_EXPORTER_OTLP_METRICS || 'http://localhost:4318/v1/metrics';

// Set this up to see debug logs
if (process.env.OTEL_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

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
      responseHook: (span: Span, responseInfo: any) => {
        // Add more detailed DB query information
        if (responseInfo?.data) {
          span.setAttribute('db.rows_affected', responseInfo.data.rowCount || 0);
        }
      },
      requestHook: (span: Span, requestInfo: any) => {
        // Add query execution context
        if (requestInfo?.query) {
          // Truncate very long queries for better readability
          const query = requestInfo.query.text || requestInfo.query;
          const truncatedQuery = query.length > 500 ? query.substring(0, 500) + '...' : query;
          span.setAttribute('db.statement', truncatedQuery);

          // Add query parameter count if available
          if (requestInfo.query.values) {
            span.setAttribute('db.query_parameters_count', requestInfo.query.values.length);
          }
        }
      },
    }),
    new PinoInstrumentation(),
  ],
});

// Custom metrics
let meter: any;
let apiHitCounter: any;
let activeUsersGauge: any;
let apiDurationHistogram: any;
let concurrentUsersCounter: any;
let activeSessionsCounter: any;
let concurrentUsersGauge: any;
const activeUsers = new Map<string, number>(); // userId -> lastSeenTimestamp

// Track active users per workspace with last activity timestamp
// Key format: "workspaceId:userId", Value: { lastSeen: timestamp, role: string }
const activeUsersByWorkspace = new Map<string, { lastSeen: number; role?: string; sessionId?: string }>();

// Time window for considering a user as "active" (5 minutes)
const ACTIVE_USER_WINDOW_MS = 5 * 60 * 1000;

// Initialize custom metrics
const initializeCustomMetrics = () => {
  meter = metrics.getMeter('tooljet-custom-metrics');

  // Counter for API hits
  apiHitCounter = meter.createCounter('api.hits', {
    description: 'Number of times an API endpoint is hit',
    unit: '1',
  });

  // Gauge for active users (backward compatibility with existing implementation)
  activeUsersGauge = meter.createObservableGauge('active.users', {
    description: 'Number of currently active users (active in last 5 minutes)',
    unit: '{users}',
  });

  activeUsersGauge.addCallback((observableResult: any) => {
    // Clean up inactive users (not seen in last 5 minutes)
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    for (const [userId, lastSeen] of activeUsers.entries()) {
      if (lastSeen < fiveMinutesAgo) {
        activeUsers.delete(userId);
      }
    }

    // Report current count of active users
    observableResult.observe(activeUsers.size);
  });

  // UpDownCounter for concurrent users (login/logout based)
  concurrentUsersCounter = meter.createUpDownCounter('users.concurrent', {
    description: 'Number of concurrent users by workspace (login/logout based)',
    unit: '{users}',
  });

  // UpDownCounter for active sessions
  activeSessionsCounter = meter.createUpDownCounter('sessions.active', {
    description: 'Number of active user sessions',
    unit: '{sessions}',
  });

  // ObservableGauge for request-based concurrent users
  concurrentUsersGauge = meter.createObservableGauge('users.concurrent.active', {
    description: 'Number of concurrent users by workspace based on request activity in last 5 minutes',
    unit: '{users}',
  });

  concurrentUsersGauge.addCallback((observableResult: any) => {
    const now = Date.now();
    const cutoffTime = now - ACTIVE_USER_WINDOW_MS;

    // Group active users by workspace
    const usersByWorkspace = new Map<string, Set<string>>();

    // Clean up inactive users and group by workspace
    for (const [key, data] of activeUsersByWorkspace.entries()) {
      if (data.lastSeen < cutoffTime) {
        activeUsersByWorkspace.delete(key);
      } else {
        const [workspaceId, userId] = key.split(':');
        if (!usersByWorkspace.has(workspaceId)) {
          usersByWorkspace.set(workspaceId, new Set());
        }
        usersByWorkspace.get(workspaceId)!.add(userId);
      }
    }

    // Report metrics for each workspace
    for (const [workspaceId, users] of usersByWorkspace.entries()) {
      observableResult.observe(users.size, {
        'workspace.id': workspaceId,
      });
    }

    // Also report total active users across all workspaces
    const totalUniqueUsers = new Set<string>();
    for (const key of activeUsersByWorkspace.keys()) {
      const userId = key.split(':')[1];
      totalUniqueUsers.add(userId);
    }
    observableResult.observe(totalUniqueUsers.size, {
      'workspace.id': 'all',
    });
  });

  // Histogram for API duration
  apiDurationHistogram = meter.createHistogram('api.duration', {
    description: 'API request duration in milliseconds',
    unit: 'ms',
  });
};

// Custom Express middleware for tracing and metrics
export const otelMiddleware = (req: any, res: any, next: () => void, ...args: any[]) => {
  const span = trace.getSpan(context.active());
  const route = req.route?.path || req.path || 'unknown_route';
  const method = req.method || 'UNKNOWN_METHOD';
  const startTime = Date.now();

  if (span && route.startsWith('/api/') && route !== '/api/health') {
    span.updateName(`${method} ${route}`);
    span.setAttribute('http.route', route);
    span.setAttribute('http.method', method);

    // Track API hits
    if (apiHitCounter) {
      apiHitCounter.add(1, {
        route: route,
        method: method,
      });
    }

    // Track active users (using session or user ID if available)
    const userId = req.user?.id || req.session?.userId || req.headers['x-user-id'];
    if (userId) {
      // Update last seen timestamp for this user
      activeUsers.set(userId, Date.now());
    }

    const originalJson = res.json;
    res.json = function (body: any) {
      const statusCode = res.statusCode;
      const duration = Date.now() - startTime;

      span.setAttribute('http.status_code', statusCode);

      // Record API duration
      if (apiDurationHistogram) {
        apiDurationHistogram.record(duration, {
          route: route,
          method: method,
          status_code: statusCode,
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
    initializeCustomMetrics();
    console.log('OpenTelemetry instrumentation initialized');
    console.log(
      'Custom metrics initialized: api.hits, active.users, api.duration, users.concurrent, sessions.active, users.concurrent.active'
    );
  } catch (error) {
    console.error('Error initializing OpenTelemetry instrumentation', error);
    throw error;
  }
};

// Helper function to track user activity on each authenticated request
export const trackUserActivity = (attributes: {
  workspaceId: string;
  userId: string;
  sessionId?: string;
  userRole?: string;
}) => {
  if (!attributes.workspaceId || !attributes.userId) {
    return;
  }

  const key = `${attributes.workspaceId}:${attributes.userId}`;
  const now = Date.now();

  activeUsersByWorkspace.set(key, {
    lastSeen: now,
    role: attributes.userRole,
    sessionId: attributes.sessionId,
  });

  // Also update the legacy activeUsers map for backward compatibility
  activeUsers.set(attributes.userId, now);
};

// Helper functions for user metrics tracking
export const incrementConcurrentUsers = (attributes: {
  workspaceId?: string;
  userId?: string;
  userRole?: string;
}) => {
  if (concurrentUsersCounter) {
    const metricAttributes: any = {};
    if (attributes.workspaceId) metricAttributes['workspace.id'] = attributes.workspaceId;
    if (attributes.userRole) metricAttributes['user.role'] = attributes.userRole;

    concurrentUsersCounter.add(1, metricAttributes);
  }
};

export const decrementConcurrentUsers = (attributes: {
  workspaceId?: string;
  userId?: string;
  userRole?: string;
}) => {
  if (concurrentUsersCounter) {
    const metricAttributes: any = {};
    if (attributes.workspaceId) metricAttributes['workspace.id'] = attributes.workspaceId;
    if (attributes.userRole) metricAttributes['user.role'] = attributes.userRole;

    concurrentUsersCounter.add(-1, metricAttributes);
  }
};

export const incrementActiveSessions = (attributes: {
  workspaceId?: string;
  userId?: string;
  sessionType?: string;
}) => {
  if (activeSessionsCounter) {
    const metricAttributes: any = {};
    if (attributes.workspaceId) metricAttributes['workspace.id'] = attributes.workspaceId;
    if (attributes.sessionType) metricAttributes['session.type'] = attributes.sessionType;

    activeSessionsCounter.add(1, metricAttributes);
  }
};

export const decrementActiveSessions = (attributes: {
  workspaceId?: string;
  userId?: string;
  sessionType?: string;
}) => {
  if (activeSessionsCounter) {
    const metricAttributes: any = {};
    if (attributes.workspaceId) metricAttributes['workspace.id'] = attributes.workspaceId;
    if (attributes.sessionType) metricAttributes['session.type'] = attributes.sessionType;

    activeSessionsCounter.add(-1, metricAttributes);
  }
};

export default sdk;
