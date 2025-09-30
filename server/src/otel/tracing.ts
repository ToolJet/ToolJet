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

    // Track DB query count per request
    let dbQueryCount = 0;
    const originalDbQueryCounter = dbQueryCounter;

    // Store initial context for tracking
    req._otel_start_time = requestStartTime;

    const originalJson = res.json;
    res.json = function (body: any) {
      const statusCode = res.statusCode;
      const duration = Date.now() - requestStartTime;

      span.setAttribute('http.status_code', statusCode);
      span.setAttribute('http.response.duration_ms', duration);

      // Collect DB query metrics from child spans
      const childSpans = span['_spanContext']?.['_traceState'];
      if (childSpans) {
        // This is a simplified approach - in practice, child spans are tracked differently
        span.setAttribute('db.queries.count', dbQueryCount);
      }

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

    // API metrics
    apiRequestDuration = meter.createHistogram('http.server.request.duration', {
      description: 'Duration of HTTP requests in milliseconds',
      unit: 'ms',
    });

    apiRequestCounter = meter.createCounter('http.server.request.count', {
      description: 'Total number of HTTP requests',
      unit: 'requests',
    });

    console.log('Custom metrics initialized');
  } catch (error) {
    console.error('Error initializing OpenTelemetry instrumentation', error);
    throw error;
  }
};

export default sdk;
