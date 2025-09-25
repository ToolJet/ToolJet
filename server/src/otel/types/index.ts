/**
 * Shared TypeScript interfaces and types for ToolJet OpenTelemetry
 *
 * This file contains common interfaces used across different OTEL modules
 * to ensure consistency and reduce code duplication.
 */

export interface UserContext {
  userId: string;
  organizationId: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AppPerformanceContext {
  appId: string;
  appName?: string;
  organizationId: string;
  userId: string;
  version?: string;
  environment?: string;
}

export interface ServiceContext {
  serviceName: string;
  methodName: string;
  userId?: string;
  organizationId?: string;
  appId?: string;
  workflowId?: string;
  dataSourceId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface ApplicationContext {
  userId?: string;
  organizationId?: string;
  appId?: string;
  appName?: string;
  sessionId?: string;
  userEmail?: string;
}

export interface BusinessOperationContext extends ApplicationContext {
  operation: string;
  resource?: string;
  resourceId?: string;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  activeConnections: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      connectionPool?: {
        total: number;
        active: number;
        idle: number;
        waiting: number;
        utilization: number;
      };
      error?: string;
    };
  };
}

export interface ApiPerformanceBenchmark {
  endpoint: string;
  method: string;
  releaseVersion: string;
  organizationId: string;
  measurements: {
    totalDuration: number;
    dbDuration: number;
    externalDuration: number;
    businessLogicDuration: number;
    queryCount: number;
    timestamp: number;
  }[];
}

export interface ServiceSpanOptions {
  attributes?: Record<string, string | number | boolean>;
  tags?: Record<string, string>;
}

// Request types with authentication context
export interface AuthenticatedRequest {
  user?: {
    id: string;
    organizationId: string;
    [key: string]: any;
  };
  session?: {
    current_organization_id?: string;
    [key: string]: any;
  };
  params?: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
  path?: string;
  method?: string;
  route?: {
    path?: string;
  };
  headers?: Record<string, any>;
  performanceRequestId?: string;
}

// Common metric types
export type MetricType = 'counter' | 'histogram' | 'gauge' | 'observable_gauge' | 'up_down_counter';

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  unit?: string;
}

// Performance monitoring types
export interface PerformanceMetrics {
  totalDuration: number;
  dbDuration: number;
  externalDuration: number;
  businessLogicDuration: number;
  memoryUsage: number;
  cpuUsage: number;
  dbQueryCount: number;
  statusCode: number;
  responseSize: number;
}

export interface ContextMetrics {
  isAppBuilderViewer: boolean;
  operationType: string;
  dataComplexity: number;
  userLoad: number;
  concurrentRequests: number;
}

// Database query context
export interface QueryContext {
  queryId: string;
  queryName: string;
  dataSourceType: string;
  dataSourceId: string;
  appId: string;
  appName: string;
  userId: string;
  organizationId: string;
}

export interface DataSourceConnectionContext {
  dataSourceType: string;
  dataSourceId: string;
  organizationId: string;
  operation: 'connect' | 'test' | 'disconnect' | 'query';
}

// Common enums
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum SpanStatus {
  OK = 1,
  ERROR = 2
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}