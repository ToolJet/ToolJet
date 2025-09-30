/**
 * Core OpenTelemetry Infrastructure
 *
 * Main exports for OTEL initialization, tracing setup, and health monitoring.
 */

// Main tracing and SDK setup
export * from './tracing';

// Health monitoring
export * from './health-check';

// Note: Common types are exported from the main otel/index.ts