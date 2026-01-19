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

// SDK instance - created lazily in startOpenTelemetry()
let sdk: NodeSDK | null = null;

// Function to create the SDK (called only when startOpenTelemetry is invoked)
function createSDK(): NodeSDK {
  return new NodeSDK({
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
        ignoreIncomingRequestHook: (request: any) => {
          const url = request.url || '';
          return url.includes('/api/health') || url === '/api/health';
        },
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
}

// Custom metrics
let meter: any;
let apiHitCounter: any;
let apiDurationHistogram: any;
let concurrentUsersCounter: any;
let activeSessionsCounter: any;
let concurrentUsersGauge: any;
let sessionsActiveGauge: any;

// Track active users per workspace with last activity timestamp
// Key format: "workspaceId:userId", Value: { lastSeen: timestamp, role: string }
const activeUsersByWorkspace = new Map<string, { lastSeen: number; role?: string; sessionId?: string }>();

// Track active sessions per workspace with last activity timestamp
// Key format: "workspaceId:sessionId", Value: { lastSeen: timestamp, userId: string, role?: string }
const activeSessionsByWorkspace = new Map<string, { lastSeen: number; userId: string; role?: string }>();

// Configurable activity window - default 5 minutes
const ACTIVITY_WINDOW_MINUTES = parseInt(process.env.OTEL_ACTIVE_USER_WINDOW_MINUTES || '5', 10);
// Validate and constrain between 1 and 60 minutes
const ACTIVE_USER_WINDOW_MS = Math.max(1, Math.min(60, ACTIVITY_WINDOW_MINUTES)) * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000; // Run cleanup every 1 minute
const MAX_TRACKED_USERS = parseInt(process.env.OTEL_MAX_TRACKED_USERS || '10000', 10);

let cleanupInterval: NodeJS.Timeout | null = null;

// Proactive cleanup of inactive users and sessions
const cleanupInactiveUsers = () => {
  try {
    const now = Date.now();
    const cutoffTime = now - ACTIVE_USER_WINDOW_MS * 2; // Inactive for 2x the window
    let cleanedUsers = 0;
    let cleanedSessions = 0;

    // Cleanup users: Collect entries to delete (don't modify during iteration)
    const usersToDelete: string[] = [];
    for (const [key, data] of activeUsersByWorkspace.entries()) {
      if (data.lastSeen < cutoffTime) {
        usersToDelete.push(key);
      }
    }

    // Delete collected user entries
    for (const key of usersToDelete) {
      activeUsersByWorkspace.delete(key);
      cleanedUsers++;
    }

    // Cleanup sessions: Collect entries to delete
    const sessionsToDelete: string[] = [];
    for (const [key, data] of activeSessionsByWorkspace.entries()) {
      if (data.lastSeen < cutoffTime) {
        sessionsToDelete.push(key);
      }
    }

    // Delete collected session entries
    for (const key of sessionsToDelete) {
      activeSessionsByWorkspace.delete(key);
      cleanedSessions++;
    }

    if ((cleanedUsers > 0 || cleanedSessions > 0) && process.env.OTEL_LOG_LEVEL === 'debug') {
      console.log(
        `[OTEL] Cleaned up ${cleanedUsers} inactive user entries and ${cleanedSessions} inactive session entries from memory`
      );
    }

    // Log memory stats if debug enabled
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      const totalUsers = activeUsersByWorkspace.size;
      const totalSessions = activeSessionsByWorkspace.size;
      const memoryEstimateMB = (((totalUsers + totalSessions) * 100) / (1024 * 1024)).toFixed(2);
      console.log(
        `[OTEL] Active tracking: ${totalUsers} users, ${totalSessions} sessions (~${memoryEstimateMB} MB), window: ${ACTIVITY_WINDOW_MINUTES}min`
      );
    }
  } catch (error) {
    console.error('[OTEL] Error during cleanup:', error);
  }
};

// Initialize custom metrics
const initializeCustomMetrics = () => {
  meter = metrics.getMeter('tooljet-custom-metrics');

  // Counter for API hits
  apiHitCounter = meter.createCounter('api.hits', {
    description: 'Number of times an API endpoint is hit',
    unit: '1',
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
    try {
      const now = Date.now();
      const cutoffTime = now - ACTIVE_USER_WINDOW_MS;

      // Group active users by workspace
      const usersByWorkspace = new Map<string, Set<string>>();
      const entriesToDelete: string[] = [];

      // First pass: collect inactive entries and group active ones (don't modify during iteration)
      for (const [key, data] of activeUsersByWorkspace.entries()) {
        if (data.lastSeen < cutoffTime) {
          entriesToDelete.push(key);
        } else {
          const [workspaceId, userId] = key.split(':');
          if (!usersByWorkspace.has(workspaceId)) {
            usersByWorkspace.set(workspaceId, new Set());
          }
          usersByWorkspace.get(workspaceId)!.add(userId);
        }
      }

      // Second pass: delete inactive entries
      for (const key of entriesToDelete) {
        activeUsersByWorkspace.delete(key);
      }

      // Report metrics for each workspace
      for (const [workspaceId, users] of usersByWorkspace.entries()) {
        // Report workspace-level aggregate
        observableResult.observe(users.size, {
          'workspace.id': workspaceId,
          'metric_type': 'workspace_total',
        });

        // Report individual user metrics
        for (const userId of users) {
          observableResult.observe(1, {
            'workspace.id': workspaceId,
            'user.id': userId,
            'metric_type': 'per_user',
          });
        }
      }

      // Also report total active users across all workspaces
      const totalUniqueUsers = new Set<string>();
      for (const key of activeUsersByWorkspace.keys()) {
        const userId = key.split(':')[1];
        if (userId) totalUniqueUsers.add(userId);
      }
      observableResult.observe(totalUniqueUsers.size, {
        'workspace.id': 'all',
        'metric_type': 'workspace_total',
      });
    } catch (error) {
      console.error('[OTEL] Error in concurrentUsersGauge callback:', error);
    }
  });

  // ObservableGauge for request-based concurrent sessions
  sessionsActiveGauge = meter.createObservableGauge('sessions.concurrent.active', {
    description: 'Number of concurrent sessions by workspace based on request activity',
    unit: '{sessions}',
  });

  sessionsActiveGauge.addCallback((observableResult: any) => {
    try {
      const now = Date.now();
      const cutoffTime = now - ACTIVE_USER_WINDOW_MS;

      // Group active sessions by workspace
      const sessionsByWorkspace = new Map<string, Set<string>>();
      const entriesToDelete: string[] = [];

      // First pass: collect inactive entries and group active ones (don't modify during iteration)
      for (const [key, data] of activeSessionsByWorkspace.entries()) {
        if (data.lastSeen < cutoffTime) {
          entriesToDelete.push(key);
        } else {
          const [workspaceId, sessionId] = key.split(':');
          if (!sessionsByWorkspace.has(workspaceId)) {
            sessionsByWorkspace.set(workspaceId, new Set());
          }
          sessionsByWorkspace.get(workspaceId)!.add(sessionId);
        }
      }

      // Second pass: delete inactive entries
      for (const key of entriesToDelete) {
        activeSessionsByWorkspace.delete(key);
      }

      // Report metrics for each workspace
      for (const [workspaceId, sessions] of sessionsByWorkspace.entries()) {
        observableResult.observe(sessions.size, {
          'workspace.id': workspaceId,
        });
      }

      // Also report total active sessions across all workspaces
      observableResult.observe(activeSessionsByWorkspace.size, {
        'workspace.id': 'all',
      });
    } catch (error) {
      console.error('[OTEL] Error in sessionsActiveGauge callback:', error);
    }
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
  // Clear cleanup interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  if (sdk) {
    sdk
      .shutdown()
      .then(() => {
        if (process.env.OTEL_LOG_LEVEL === 'debug') {
          console.log('OpenTelemetry instrumentation shutdown successfully');
        }
      })
      .catch((err) => console.error('Error shutting down OpenTelemetry instrumentation', err))
      .finally(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

export const startOpenTelemetry = async (): Promise<void> => {
  try {
    // Create SDK lazily (only when this function is called)
    if (!sdk) {
      sdk = createSDK();
    }

    await sdk.start();
    initializeCustomMetrics();

    // Initialize audit log metrics
    const { initializeAuditLogMetrics } = await import('./audit-metrics');
    initializeAuditLogMetrics();
    // Start proactive cleanup interval
    cleanupInterval = setInterval(cleanupInactiveUsers, CLEANUP_INTERVAL_MS);

    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.log('OpenTelemetry instrumentation initialized');
      console.log(
        'Custom metrics initialized: api.hits, api.duration, users.concurrent, sessions.active, users.concurrent.active, sessions.concurrent.active'
      );
      console.log(`Active user tracking window: ${ACTIVITY_WINDOW_MINUTES} minutes`);
    }
  } catch (error) {
    console.error('Error initializing OpenTelemetry instrumentation', error);
    throw error;
  }
};

// Export audit metrics function for use in services
export { recordAuditLogMetric } from './audit-metrics';
// Helper function to track user activity on each authenticated request
export const trackUserActivity = (attributes: {
  workspaceId: string;
  userId: string;
  sessionId?: string;
  userRole?: string;
}) => {
  try {
    // Validate required fields
    if (!attributes?.workspaceId || !attributes?.userId) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.warn('[OTEL] Invalid user activity attributes:', attributes);
      }
      return;
    }

    // Sanitize and limit lengths to prevent memory issues
    const workspaceId = String(attributes.workspaceId).slice(0, 100);
    const userId = String(attributes.userId).slice(0, 100);
    const sessionId = attributes.sessionId ? String(attributes.sessionId).slice(0, 100) : undefined;

    const now = Date.now();

    // Track unique users (workspaceId:userId)
    const userKey = `${workspaceId}:${userId}`;

    // Safety cap to prevent unbounded memory growth for users
    if (activeUsersByWorkspace.size >= MAX_TRACKED_USERS && !activeUsersByWorkspace.has(userKey)) {
      const oldestKey = activeUsersByWorkspace.keys().next().value;
      if (oldestKey) {
        activeUsersByWorkspace.delete(oldestKey);
        if (process.env.OTEL_LOG_LEVEL === 'debug') {
          console.warn('[OTEL] Max tracked users reached, removed oldest entry');
        }
      }
    }

    activeUsersByWorkspace.set(userKey, {
      lastSeen: now,
      role: attributes.userRole,
      sessionId: sessionId,
    });

    // Track unique sessions (workspaceId:sessionId) if sessionId is provided
    if (sessionId) {
      const sessionKey = `${workspaceId}:${sessionId}`;

      // Safety cap to prevent unbounded memory growth for sessions
      if (activeSessionsByWorkspace.size >= MAX_TRACKED_USERS && !activeSessionsByWorkspace.has(sessionKey)) {
        const oldestKey = activeSessionsByWorkspace.keys().next().value;
        if (oldestKey) {
          activeSessionsByWorkspace.delete(oldestKey);
          if (process.env.OTEL_LOG_LEVEL === 'debug') {
            console.warn('[OTEL] Max tracked sessions reached, removed oldest entry');
          }
        }
      }

      activeSessionsByWorkspace.set(sessionKey, {
        lastSeen: now,
        userId: userId,
        role: attributes.userRole,
      });
    }
  } catch (error) {
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.error('[OTEL] Error tracking user activity:', error);
    }
    // Don't throw - metric collection should never break the app
  }
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

// ============================================================================
// AUTO-START: Initialize OTEL SDK immediately when this module is imported
// This MUST run before any other modules (http, pg, express, etc.) are loaded
// ============================================================================

// Load .env file before checking ENABLE_OTEL
// ConfigModule hasn't loaded yet, so we need to manually load .env
// Use the same pattern as the rest of the codebase (from database-config-utils.ts)
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function loadEnvVars() {
  const envFilePath = process.env.NODE_ENV === 'test'
    ? path.resolve(process.cwd(), '../.env.test')
    : path.resolve(process.cwd(), '../.env');

  if (fs.existsSync(envFilePath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
    // Merge with existing process.env (existing env vars take precedence)
    Object.assign(process.env, envConfig, process.env);
  }
}

// Load environment variables
loadEnvVars();

if (process.env.OTEL_LOG_LEVEL === 'debug') {
  console.log('[OTEL] Auto-start code reached');
  console.log('[OTEL] ENABLE_OTEL:', process.env.ENABLE_OTEL);
}

let isInitialized = false;

if (process.env.ENABLE_OTEL === 'true' && !isInitialized) {
  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log('[OTEL] Condition met, checking edition...');
  }

  try {
    // Check edition - EE and Cloud support OTEL
    // Use relative paths instead of TypeScript aliases for runtime compatibility
    const { getTooljetEdition } = require('../helpers/utils.helper');
    const { TOOLJET_EDITIONS } = require('../modules/app/constants');

    const tooljetEdition = getTooljetEdition();

    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.log('[OTEL] Edition:', tooljetEdition);
    }

    if (tooljetEdition === TOOLJET_EDITIONS.EE || tooljetEdition === TOOLJET_EDITIONS.Cloud) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.log('[OTEL] Starting SDK at import time (before any modules load)...');
      }

      // Start OTEL SDK - this registers instrumentations immediately
      // The patches are applied synchronously when instrumentations are registered
      startOpenTelemetry()
        .then(() => {
          isInitialized = true;
          if (process.env.OTEL_LOG_LEVEL === 'debug') {
            console.log('[OTEL] ✅ SDK started successfully');
          }
        })
        .catch((err) => {
          console.error('[OTEL] ❌ Failed to start SDK:', err);
          // Log the error but don't throw - observability should never break the app
        });

      // Mark as initializing to prevent double initialization
      isInitialized = true;
    } else {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.log('[OTEL] ⏭️  Skipping OTEL - not Enterprise or Cloud edition');
      }
    }
  } catch (error) {
    console.error('[OTEL] Error during auto-start:', error);
  }
} else {
  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log('[OTEL] Condition NOT met. ENABLE_OTEL:', process.env.ENABLE_OTEL, 'isInitialized:', isInitialized);
  }
}
