import { metrics } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

/**
 * Custom Business Metrics for ToolJet
 * 
 * This utility provides comprehensive business-specific KPI tracking including:
 * - User Activity: Login patterns, feature usage, session metrics
 * - App Performance: Load times, query execution, rendering performance
 * - Resource Usage: Data source connections, API calls, system resources
 */

// User Activity Metrics
let userLoginCounter: any;
let userSessionDuration: any;
let userFeatureUsage: any;
let activeUsersGauge: any;
let userActivityGauge: any;

// App Performance Metrics
let appLoadTimeHistogram: any;
let appQueryExecutionTime: any;
let appRenderingTime: any;
let appErrorRate: any;
let appUsageCounter: any;

// Resource Usage Metrics
let dataSourceConnectionsGauge: any;
let apiCallCounter: any;
let apiCallDuration: any;
let resourceUtilization: any;
let storageUsage: any;

// Initialize all business metrics
export const initializeBusinessMetrics = () => {
  const meter = metrics.getMeter('tooljet-business-metrics', '1.0.0');
  
  // === USER ACTIVITY METRICS ===
  userLoginCounter = meter.createCounter('user_logins_total', {
    description: 'Total number of user login attempts by status and method',
  });
  
  userSessionDuration = meter.createHistogram('user_session_duration_seconds', {
    description: 'Duration of user sessions in seconds',
    unit: 's',
  });
  
  userFeatureUsage = meter.createCounter('user_feature_usage_total', {
    description: 'Total usage count of different application features',
  });
  
  activeUsersGauge = meter.createObservableGauge('active_users_current', {
    description: 'Current number of active users by time window',
  });
  
  userActivityGauge = meter.createCounter('user_activity_events_total', {
    description: 'Total user activity events by type and feature',
  });
  
  // === APP PERFORMANCE METRICS ===
  appLoadTimeHistogram = meter.createHistogram('app_load_time_seconds', {
    description: 'Time taken for applications to load completely',
    unit: 's',
  });
  
  appQueryExecutionTime = meter.createHistogram('app_query_execution_seconds', {
    description: 'Time taken for app queries to execute',
    unit: 's',
  });
  
  appRenderingTime = meter.createHistogram('app_rendering_time_seconds', {
    description: 'Time taken for app components to render',
    unit: 's',
  });
  
  appErrorRate = meter.createCounter('app_errors_total', {
    description: 'Total application errors by type and component',
  });
  
  appUsageCounter = meter.createCounter('app_usage_events_total', {
    description: 'Total app usage events by action and component',
  });
  
  // === RESOURCE USAGE METRICS ===
  dataSourceConnectionsGauge = meter.createObservableGauge('datasource_connections_active', {
    description: 'Current active data source connections by type',
  });
  
  apiCallCounter = meter.createCounter('api_calls_total', {
    description: 'Total API calls by endpoint, method, and status',
  });
  
  apiCallDuration = meter.createHistogram('api_call_duration_seconds', {
    description: 'Duration of API calls in seconds',
    unit: 's',
  });
  
  resourceUtilization = meter.createObservableGauge('resource_utilization_percent', {
    description: 'Resource utilization percentage by type',
    unit: '%',
  });
  
  storageUsage = meter.createObservableGauge('storage_usage_bytes', {
    description: 'Storage usage in bytes by type',
    unit: 'By',
  });
  
  console.log('[ToolJet Backend] Business metrics initialized successfully');
};

// === USER ACTIVITY TRACKING ===

export interface UserContext {
  userId: string;
  organizationId: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const trackUserLogin = (
  context: UserContext, 
  status: 'success' | 'failure', 
  method: 'password' | 'sso' | 'oauth' | 'magic_link' = 'password'
) => {
  if (userLoginCounter) {
    userLoginCounter.add(1, {
      status,
      method,
      organization_id: context.organizationId,
    });
    
    console.log(`[ToolJet Backend] User login tracked:`, {
      userId: context.userId,
      status,
      method,
      organizationId: context.organizationId
    });
  }
};

export const trackUserSession = (context: UserContext, durationSeconds: number) => {
  if (userSessionDuration) {
    userSessionDuration.record(durationSeconds, {
      organization_id: context.organizationId,
      user_id: context.userId
    });
    
    console.log(`[ToolJet Backend] User session tracked:`, {
      userId: context.userId,
      duration: durationSeconds,
      organizationId: context.organizationId
    });
  }
};

export const trackFeatureUsage = (
  context: UserContext, 
  feature: string, 
  action: string,
  componentType?: string
) => {
  if (userFeatureUsage) {
    userFeatureUsage.add(1, {
      feature,
      action,
      component_type: componentType || 'unknown',
      organization_id: context.organizationId,
      user_id: context.userId
    });
    
    console.log(`[ToolJet Backend] Feature usage tracked:`, {
      userId: context.userId,
      feature,
      action,
      componentType
    });
  }
};

export const trackUserActivity = (
  context: UserContext, 
  activityType: 'page_view' | 'button_click' | 'form_submit' | 'data_query' | 'app_create' | 'app_edit',
  details?: Record<string, string>
) => {
  if (userActivityGauge) {
    userActivityGauge.add(1, {
      activity_type: activityType,
      organization_id: context.organizationId,
      user_id: context.userId,
      ...details
    });
  }
};

// === APP PERFORMANCE TRACKING ===

export interface AppPerformanceContext {
  appId: string;
  appName?: string;
  organizationId: string;
  userId: string;
  version?: string;
  environment?: string;
}

export const trackAppLoadTime = (context: AppPerformanceContext, loadTimeMs: number) => {
  if (appLoadTimeHistogram) {
    appLoadTimeHistogram.record(loadTimeMs / 1000, {
      app_id: context.appId,
      app_name: context.appName || 'unknown',
      organization_id: context.organizationId,
      environment: context.environment || 'production'
    });
    
    console.log(`[ToolJet Backend] App load time tracked:`, {
      appId: context.appId,
      loadTime: loadTimeMs,
      organizationId: context.organizationId
    });
  }
};

export const trackQueryExecution = (
  context: AppPerformanceContext, 
  queryName: string, 
  executionTimeMs: number,
  status: 'success' | 'error',
  dataSourceType?: string
) => {
  if (appQueryExecutionTime) {
    appQueryExecutionTime.record(executionTimeMs / 1000, {
      app_id: context.appId,
      app_name: context.appName || 'Unknown App',
      query_name: queryName,
      status,
      datasource_type: dataSourceType || 'unknown',
      organization_id: context.organizationId
    });
    
    console.log(`[ToolJet Backend] Query execution tracked:`, {
      appId: context.appId,
      queryName,
      executionTime: executionTimeMs,
      status
    });
  }
};

export const trackComponentRendering = (
  context: AppPerformanceContext, 
  componentType: string, 
  renderTimeMs: number
) => {
  if (appRenderingTime) {
    appRenderingTime.record(renderTimeMs / 1000, {
      app_id: context.appId,
      component_type: componentType,
      organization_id: context.organizationId
    });
  }
};

export const trackAppError = (
  context: AppPerformanceContext, 
  errorType: string, 
  component?: string, 
  errorMessage?: string
) => {
  if (appErrorRate) {
    appErrorRate.add(1, {
      app_id: context.appId,
      error_type: errorType,
      component: component || 'unknown',
      organization_id: context.organizationId
    });
    
    console.log(`[ToolJet Backend] App error tracked:`, {
      appId: context.appId,
      errorType,
      component,
      message: errorMessage
    });
  }
};

export const trackAppUsage = (
  context: AppPerformanceContext, 
  action: 'view' | 'edit' | 'publish' | 'clone' | 'delete' | 'export'
) => {
  if (appUsageCounter) {
    appUsageCounter.add(1, {
      app_id: context.appId,
      action,
      organization_id: context.organizationId,
      user_id: context.userId
    });
  }
};

// === RESOURCE USAGE TRACKING ===

export const trackApiCall = (
  endpoint: string, 
  method: string, 
  statusCode: number, 
  durationMs: number,
  organizationId?: string
) => {
  if (apiCallCounter) {
    apiCallCounter.add(1, {
      endpoint,
      method: method.toUpperCase(),
      status_code: statusCode.toString(),
      status_class: `${Math.floor(statusCode / 100)}xx`,
      organization_id: organizationId || 'unknown'
    });
  }
  
  if (apiCallDuration) {
    apiCallDuration.record(durationMs / 1000, {
      endpoint,
      method: method.toUpperCase(),
      organization_id: organizationId || 'unknown'
    });
  }
};

// Data source connection tracking
const activeDataSourceConnections = new Map<string, number>();

export const trackDataSourceConnection = (
  dataSourceType: string, 
  organizationId: string, 
  action: 'connect' | 'disconnect'
) => {
  const key = `${organizationId}:${dataSourceType}`;
  const current = activeDataSourceConnections.get(key) || 0;
  
  if (action === 'connect') {
    activeDataSourceConnections.set(key, current + 1);
  } else {
    activeDataSourceConnections.set(key, Math.max(0, current - 1));
  }
};

// Set up observable gauge callbacks for resource metrics
export const setupResourceMetricCallbacks = () => {
  // Data source connections callback
  if (dataSourceConnectionsGauge) {
    dataSourceConnectionsGauge.addCallback((observableResult: any) => {
      for (const [key, count] of activeDataSourceConnections.entries()) {
        const [organizationId, dataSourceType] = key.split(':');
        observableResult.observe(count, {
          datasource_type: dataSourceType,
          organization_id: organizationId
        });
      }
    });
  }
  
  // Active users callback
  if (activeUsersGauge) {
    activeUsersGauge.addCallback((observableResult: any) => {
      const totalActiveUsers = activeUserSessions.size;
      
      // Group active users by organization
      const orgCounts = new Map<string, number>();
      for (const sessionKey of activeUserSessions.values()) {
        const [organizationId] = sessionKey.split(':');
        orgCounts.set(organizationId, (orgCounts.get(organizationId) || 0) + 1);
      }
      
      // Observe total active users
      observableResult.observe(totalActiveUsers, {
        scope: 'total'
      });
      
      // Observe active users per organization
      for (const [organizationId, count] of orgCounts.entries()) {
        observableResult.observe(count, {
          organization_id: organizationId,
          scope: 'organization'
        });
      }
    });
  }
  
  // Resource utilization callback (example - would need actual system metrics)
  if (resourceUtilization) {
    resourceUtilization.addCallback((observableResult: any) => {
      // Example: track memory usage, CPU usage, etc.
      const memoryUsage = process.memoryUsage();
      const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      observableResult.observe(memoryPercent, {
        resource_type: 'memory',
        component: 'nodejs_heap'
      });
    });
  }
  
  console.log('[ToolJet Backend] Resource metric callbacks initialized');
};

// === UTILITY FUNCTIONS ===

export const getCurrentBusinessMetrics = () => {
  return {
    activeDataSourceConnections: Object.fromEntries(activeDataSourceConnections),
    metricsInitialized: {
      userMetrics: !!userLoginCounter,
      appMetrics: !!appLoadTimeHistogram,
      resourceMetrics: !!dataSourceConnectionsGauge
    }
  };
};

// Helper to create time-based user activity tracking
const activeUserSessions = new Set<string>();

export const startUserSession = (userId: string, organizationId: string) => {
  activeUserSessions.add(`${organizationId}:${userId}`);
};

export const endUserSession = (userId: string, organizationId: string) => {
  activeUserSessions.delete(`${organizationId}:${userId}`);
};

export const getActiveUserCount = (): number => {
  return activeUserSessions.size;
};