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
  SEMATTRS_DB_STATEMENT,
  SEMATTRS_DB_OPERATION,
  SEMATTRS_DB_NAME,
  SEMATTRS_DB_SQL_TABLE,
} from '@opentelemetry/semantic-conventions';

const OTEL_EXPORTER_OTLP_TRACES = process.env.OTEL_EXPORTER_OTLP_TRACES || 'http://localhost:4318/v1/traces';
const OTEL_EXPORTER_OTLP_METRICS = process.env.OTEL_EXPORTER_OTLP_METRICS || 'http://localhost:4318/v1/metrics';

// Database monitoring configuration
const DB_SLOW_QUERY_THRESHOLD = parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'); // ms
const DB_ENABLE_QUERY_ANALYSIS = process.env.DB_ENABLE_QUERY_ANALYSIS !== 'false';

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

// Database query analysis utilities
const extractTableNames = (query: string): string[] => {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ').trim();
  const tables: Set<string> = new Set();
  
  // Match common SQL patterns
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

const getQueryOperation = (query: string): string => {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.startsWith('select')) return 'SELECT';
  if (normalizedQuery.startsWith('insert')) return 'INSERT';
  if (normalizedQuery.startsWith('update')) return 'UPDATE';
  if (normalizedQuery.startsWith('delete')) return 'DELETE';
  if (normalizedQuery.startsWith('create')) return 'CREATE';
  if (normalizedQuery.startsWith('drop')) return 'DROP';
  if (normalizedQuery.startsWith('alter')) return 'ALTER';
  return 'OTHER';
};

const isSlowQuery = (duration: number): boolean => {
  return duration >= DB_SLOW_QUERY_THRESHOLD;
};

// Initialize custom metrics
let dbQueryDurationHistogram: any;
let dbSlowQueryCounter: any;
let dbConnectionPoolGauge: any;
let dbQueryCounter: any;

// Store request information for response processing
const spanRequestMap = new Map<string, any>();

export const sdk = new NodeSDK({
  resource: resource,
  traceExporter: traceExporter,
  spanProcessor: new BatchSpanProcessor(traceExporter),
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000, // Export every 10 seconds for debugging
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
        if (DB_ENABLE_QUERY_ANALYSIS && requestInfo.query) {
          const query = requestInfo.query;
          const startTime = Date.now();
          
          // Store request info for response hook using span context
          const spanContext = span.spanContext();
          spanRequestMap.set(spanContext.spanId, {
            startTime,
            query,
            connectionParameters: requestInfo.connectionParameters
          });
          
          // Extract query operation and table names
          const operation = getQueryOperation(query);
          const tables = extractTableNames(query);
          
          // Add custom attributes
          span.setAttribute(SEMATTRS_DB_OPERATION, operation);
          span.setAttribute('db.query.tables', tables.join(','));
          span.setAttribute('db.query.length', query.length);
          span.setAttribute('db.query.start_time', startTime);
          
          // Sanitize and add query statement (limit length for performance)
          const sanitizedQuery = query.length > 1000 
            ? query.substring(0, 1000) + '...[truncated]'
            : query;
          span.setAttribute(SEMATTRS_DB_STATEMENT, sanitizedQuery);
          
          // Add connection info
          if (requestInfo.connectionParameters) {
            span.setAttribute('db.connection.host', requestInfo.connectionParameters.host || 'unknown');
            span.setAttribute('db.connection.port', requestInfo.connectionParameters.port || 5432);
            span.setAttribute('db.connection.database', requestInfo.connectionParameters.database || 'unknown');
          }
        }
      },
      responseHook: (span: Span, responseInfo: any) => {
        if (DB_ENABLE_QUERY_ANALYSIS) {
          const spanContext = span.spanContext();
          const storedInfo = spanRequestMap.get(spanContext.spanId);
          
          if (storedInfo) {
            const endTime = Date.now();
            const startTime = storedInfo.startTime;
            const duration = endTime - startTime;
            
            // Add response metadata
            span.setAttribute('db.query.duration_ms', duration);
            span.setAttribute('db.query.end_time', endTime);
            
            if (responseInfo.data && responseInfo.data.rowCount !== undefined) {
              span.setAttribute('db.query.rows_affected', responseInfo.data.rowCount);
            }
            
            // Mark slow queries
            if (isSlowQuery(duration)) {
              span.setAttribute('db.query.is_slow', true);
              span.setAttribute('db.query.slow_threshold_ms', DB_SLOW_QUERY_THRESHOLD);
              
              // Record slow query metric
              if (dbSlowQueryCounter) {
                const operation = getQueryOperation(storedInfo.query);
                dbSlowQueryCounter.add(1, {
                  'db.operation.name': operation.toLowerCase(),
                  'db.namespace': storedInfo.connectionParameters?.database || 'unknown',
                  'db.system': 'postgresql'
                });
                console.log('[ToolJet Backend] Slow query detected:', {
                  duration: duration,
                  operation: operation.toLowerCase(),
                  database: storedInfo.connectionParameters?.database
                });
              }
            }
            
            // Record query duration histogram (convert ms to seconds)
            if (dbQueryDurationHistogram) {
              const operation = getQueryOperation(storedInfo.query);
              const tables = extractTableNames(storedInfo.query);
              dbQueryDurationHistogram.record(duration / 1000, { // Convert to seconds
                'db.operation.name': operation.toLowerCase(),
                'db.namespace': storedInfo.connectionParameters?.database || 'unknown',
                'db.system': 'postgresql',
                'db.sql.table': tables.length > 0 ? tables[0] : 'unknown' // Primary table
              });
            }
            
            // Record query counter
            if (dbQueryCounter) {
              const operation = getQueryOperation(storedInfo.query);
              dbQueryCounter.add(1, {
                'db.operation.name': operation.toLowerCase(),
                'db.namespace': storedInfo.connectionParameters?.database || 'unknown',
                'db.system': 'postgresql'
              });
            }
            
            // Clean up stored info to prevent memory leaks
            spanRequestMap.delete(spanContext.spanId);
          }
        }
      }
    }),
    new PinoInstrumentation(),
  ],
});

// Custom Express middleware for tracing and metrics
export const otelMiddleware = (req: any, res: any, next: () => void, ...args: any[]) => {
  const span = trace.getSpan(context.active());
  const route = req.route?.path || req.path || 'unknown_route';
  const method = req.method || 'UNKNOWN_METHOD';

  if (span && route.startsWith('/api/') && route !== '/api/health') {
    span.updateName(`${method} ${route}`);
    span.setAttribute('http.route', route);
    span.setAttribute('http.method', method);

    const originalJson = res.json;
    res.json = function (body: any) {
      const statusCode = res.statusCode;

      span.setAttribute('http.status_code', statusCode);
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
    
    // Initialize custom database metrics
    const meter = metrics.getMeter('tooljet-database', '1.0.0');
    
    // Use standard OpenTelemetry database metric names
    dbQueryDurationHistogram = meter.createHistogram('db.client.operation.duration', {
      description: 'Duration of database client operations',
      unit: 's', // OpenTelemetry standard uses seconds
    });
    
    dbSlowQueryCounter = meter.createCounter('db.client.operation.slow_total', {
      description: 'Total number of slow database operations',
    });
    
    dbQueryCounter = meter.createCounter('db.client.operation.count', {
      description: 'Total number of database operations',
    });
    
    dbConnectionPoolGauge = meter.createObservableGauge('db_connection_pool_usage', {
      description: 'Database connection pool usage statistics',
    });
    
    // Initialize database monitoring metrics
    const { databaseMonitoring } = await import('./database-monitoring');
    databaseMonitoring.initializeMetrics(meter);
    
    // Initialize service layer metrics
    const { initializeServiceMetrics } = await import('./service-instrumentation');
    initializeServiceMetrics();
    
    console.log('[ToolJet Backend] OpenTelemetry instrumentation initialized with enhanced database and service monitoring');
  } catch (error) {
    console.error('Error initializing OpenTelemetry instrumentation', error);
    throw error;
  }
};

export default sdk;
