import { CompositePropagator, W3CTraceContextPropagator, W3CBaggagePropagator } from '@opentelemetry/core';
import { Span, DiagConsoleLogger, DiagLogLevel, diag, metrics } from '@opentelemetry/api';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import * as process from 'process';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { getTooljetEdition } from '../helpers/utils.helper';
import { TOOLJET_EDITIONS } from '../modules/app/constants';

// Set this up to see debug logs
if (process.env.OTEL_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

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

// NOTE: createSDK is called lazily — AFTER loadEnvVars() — so .env values are correctly picked up.
function createSDK(): NodeSDK {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME || 'tooljet',
    [ATTR_SERVICE_VERSION]: globalThis.TOOLJET_VERSION || process.env.SERVICE_VERSION || 'unknown',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  });
  const traceUrl = process.env.OTEL_EXPORTER_OTLP_TRACES || 'http://localhost:4318/v1/traces';
  const metricsUrl = process.env.OTEL_EXPORTER_OTLP_METRICS || 'http://localhost:4318/v1/metrics';
  const authHeader: Record<string, string> | undefined = process.env.OTEL_HEADER
    ? { Authorization: process.env.OTEL_HEADER }
    : undefined;

  const traceExporter = new OTLPTraceExporter({ url: traceUrl, headers: authHeader });

  const metricExporter = new OTLPMetricExporter({
    url: metricsUrl,
    headers: authHeader,
  });

  return new NodeSDK({
    resource,
    traceExporter,
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
      // PinoInstrumentation omitted: only supports pino <10, ToolJet uses pino 10.x.
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
    ],
  });
}

// Custom metrics
let meter: any;
let apiHitCounter: any;
let apiDurationHistogram: any;
let concurrentUsersCounter: any;
let concurrentUsersGauge: any;

// Track active users per workspace with last activity timestamp
// Key format: "workspaceId:userId", Value: { lastSeen: timestamp, role: string }
const activeUsersByWorkspace = new Map<string, { lastSeen: number; role?: string }>();

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

    // Collect entries to delete (don't modify during iteration)
    const usersToDelete: string[] = [];
    for (const [key, data] of activeUsersByWorkspace.entries()) {
      if (data.lastSeen < cutoffTime) {
        usersToDelete.push(key);
      }
    }

    for (const key of usersToDelete) {
      activeUsersByWorkspace.delete(key);
      cleanedUsers++;
    }

    if (cleanedUsers > 0 && process.env.OTEL_LOG_LEVEL === 'debug') {
      console.log(`[OTEL] Cleaned up ${cleanedUsers} inactive user entries from memory`);
    }

    // Log memory stats if debug enabled
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      const totalUsers = activeUsersByWorkspace.size;
      const memoryEstimateMB = ((totalUsers * 100) / (1024 * 1024)).toFixed(2);
      console.log(
        `[OTEL] Active tracking: ${totalUsers} users (~${memoryEstimateMB} MB), window: ${ACTIVITY_WINDOW_MINUTES}min`
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
      // Note: per-user series intentionally not emitted — user.id as a label is
      // unbounded cardinality and would grow Prometheus TSDB with every active user.
      const totalUniqueUsers = new Set<string>();
      for (const [workspaceId, users] of usersByWorkspace.entries()) {
        observableResult.observe(users.size, {
          'workspace.id': workspaceId,
          metric_type: 'workspace_total',
        });
        for (const userId of users) totalUniqueUsers.add(userId);
      }

      // Also report total active users across all workspaces (deduped across workspaces)
      observableResult.observe(totalUniqueUsers.size, {
        'workspace.id': 'all',
        metric_type: 'workspace_total',
      });
    } catch (error) {
      console.error('[OTEL] Error in concurrentUsersGauge callback:', error);
    }
  });

  // Histogram for API duration
  apiDurationHistogram = meter.createHistogram('api.duration', {
    description: 'API request duration in milliseconds',
    unit: 'ms',
  });

};

export function recordApiHit(attrs: { route: string; method: string }) {
  apiHitCounter.add(1, attrs);
}
export function recordApiDuration(
  duration: number,
  attrs: {
    route: string;
    method: string;
    status_code: number | string;
  }
) {
  apiDurationHistogram.record(duration, attrs);
}

process.on('SIGTERM', () => {
  // Clear cleanup interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  if (sdk) {
    sdk.shutdown()
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
    if (!sdk) {
      sdk = createSDK();
    }

    await sdk.start();
    initializeCustomMetrics();

    const { initializeAuditLogMetrics } = await import('./audit-metrics');
    initializeAuditLogMetrics();

    const { initializeFrontendMetrics } = await import('./frontend-metrics');
    initializeFrontendMetrics();

    // Start proactive cleanup interval
    cleanupInterval = setInterval(cleanupInactiveUsers, CLEANUP_INTERVAL_MS);

    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.log('OpenTelemetry instrumentation initialized');
      console.log(
        'Custom metrics initialized: api.hits, api.duration, users.concurrent, users.concurrent.active'
      );
      console.log(`Active user tracking window: ${ACTIVITY_WINDOW_MINUTES} minutes`);
    }
  } catch (error) {
    console.error('Error initializing OpenTelemetry instrumentation', error);
    throw error;
  }
};

export { recordDirectQueryMetric, recordSessionEventDirect } from './audit-metrics';
export { recordFrontendMetricsBatch } from './frontend-metrics';
// Helper function to track user activity on each authenticated request
export const trackUserActivity = (attributes: {
  workspaceId: string;
  userId: string;
  // sessionId accepted for call-site compatibility (jwt.strategy.ts passes it) but no
  // longer tracked — session-level dedup was removed, see activeUsersByWorkspace comment above.
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

    const now = Date.now();

    // Track unique users (workspaceId:userId)
    const userKey = `${workspaceId}:${userId}`;

    // Safety cap to prevent unbounded memory growth
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
    });
  } catch (error) {
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.error('[OTEL] Error tracking user activity:', error);
    }
    // Don't throw - metric collection should never break the app
  }
};

// Helper functions for user metrics tracking
export const incrementConcurrentUsers = (attributes: { workspaceId?: string; userId?: string; userRole?: string }) => {
  if (concurrentUsersCounter) {
    const metricAttributes: any = {};
    if (attributes.workspaceId) metricAttributes['workspace.id'] = attributes.workspaceId;
    if (attributes.userRole) metricAttributes['user.role'] = attributes.userRole;

    concurrentUsersCounter.add(1, metricAttributes);
  }
};

export const decrementConcurrentUsers = (attributes: { workspaceId?: string; userId?: string; userRole?: string }) => {
  if (concurrentUsersCounter) {
    const metricAttributes: any = {};
    if (attributes.workspaceId) metricAttributes['workspace.id'] = attributes.workspaceId;
    if (attributes.userRole) metricAttributes['user.role'] = attributes.userRole;

    concurrentUsersCounter.add(-1, metricAttributes);
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
  const envFilePath =
    process.env.NODE_ENV === 'test'
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

// Guard: OTEL export transport errors (EPIPE, ECONNRESET) must never crash the server.
// These are emitted as unhandled 'error' events on TLS sockets when the remote OTLP
// endpoint closes the connection after sending an error response (e.g. 415, 401).
// The OTEL SDK does not attach error listeners to the socket, so without this the
// Node.js default behaviour is to throw and kill the process.
// Only register when OTEL is actually enabled — no point installing a global handler otherwise.
if (process.env.ENABLE_OTEL === 'true') {
  process.on('uncaughtException', (err: any) => {
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
      // OTEL SDK emits these when the remote OTLP endpoint closes the connection.
      // Suppress them so the observability transport never crashes the server.
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.error('[OTEL] Suppressed transport error (server still running):', err.code, err.message);
      }
      return;
    }
    // For all other uncaught exceptions: log but do NOT exit.
    // Plugin async/sync mismatches (e.g. missing await before connect()) can surface here
    // and killing the server for those would be far worse than continuing.
    // Node.js default behaviour (exit) is intentionally NOT restored here.
    console.error('[OTEL] Uncaught exception (server continuing):', err);
  });
}

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
