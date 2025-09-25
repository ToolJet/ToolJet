/**
 * ToolJet OpenTelemetry Integration
 *
 * Main entry point for all OpenTelemetry instrumentation and monitoring.
 * Provides a clean, organized structure for observability in ToolJet.
 */

// === CORE INFRASTRUCTURE ===
export * from './core';

// === PERFORMANCE MONITORING ===
export * from './monitoring';

// === BUSINESS LOGIC & APPLICATION TRACKING ===
export * from './business';

// === PERFORMANCE ANALYSIS & BENCHMARKING ===
export * from './analysis';

// === SHARED TYPES ===
export * from './types';

// === CONVENIENCE RE-EXPORTS ===
// Main initialization and tracing
export { startOpenTelemetry, otelMiddleware } from './core/tracing';

// Key monitoring functions
export {
  initializeApiPerformanceMetrics,
  startApiRequest,
  endApiRequest
} from './monitoring/api-performance-metrics';

export {
  databaseMonitoring
} from './monitoring/database-monitoring';

export {
  initializeComprehensiveApiMonitoring,
  comprehensiveApiMiddleware
} from './monitoring/comprehensive-api-middleware';

// Business metrics
export {
  initializeBusinessMetrics,
  trackUserLogin,
  trackAppLoadTime
} from './business/business-metrics';

// Application tracing
export {
  traceAppLifecycleOperation,
  traceQueryExecution
} from './business/application-tracing';

// Health check
export { OTELHealthCheckService } from './core/health-check';

// Benchmarking
export {
  recordBenchmarkMeasurement,
  compareReleasePerformance
} from './analysis/benchmarking-framework';