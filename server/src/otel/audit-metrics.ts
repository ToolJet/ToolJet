import { metrics } from '@opentelemetry/api';
import { AuditLogFields } from '@modules/audit-logs/types';

/**
 * OTEL Metrics for Audit Logs
 *
 * This module provides OpenTelemetry metrics instrumentation for audit logs.
 * It tracks various app-based metrics by streaming audit log events to the OTEL collector.
 */

let auditLogMeter: any;
let auditLogCounter: any;
let auditLogActionCounter: any;
let auditLogResourceCounter: any;
let auditLogUserActivityGauge: any;
let auditLogOrganizationActivityGauge: any;

// Query-level metrics
let queryExecutionsCounter: any;
let queryFailuresCounter: any;
let queryDurationHistogram: any;

// App-level metrics
let appUsageCounter: any;
let appActiveUsersGauge: any;

// User session metrics
let userSessionsCounter: any;

// Store recent activity for gauges (last 15 minutes)
const ACTIVITY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const userActivity = new Map<string, { count: number; lastUpdate: number }>();
const organizationActivity = new Map<string, { count: number; lastUpdate: number }>();
const appActiveUsers = new Map<string, Map<string, number>>(); // appId -> Map<userId, lastSeen>

/**
 * Initialize audit log metrics
 * Should be called after OTEL SDK is started
 */
export const initializeAuditLogMetrics = () => {
  auditLogMeter = metrics.getMeter('tooljet-audit-logs');

  // Counter: Total audit log events
  auditLogCounter = auditLogMeter.createCounter('audit.logs.total', {
    description: 'Total number of audit log events',
    unit: '1',
  });

  // Counter: Audit log events by action type
  auditLogActionCounter = auditLogMeter.createCounter('audit.logs.actions', {
    description: 'Number of audit log events by action type',
    unit: '1',
  });

  // Counter: Audit log events by resource type
  auditLogResourceCounter = auditLogMeter.createCounter('audit.logs.resources', {
    description: 'Number of audit log events by resource type',
    unit: '1',
  });

  // Gauge: Active users by organization (based on recent audit logs)
  auditLogUserActivityGauge = auditLogMeter.createObservableGauge('audit.logs.active_users', {
    description: 'Number of active users by organization (based on audit log activity in last 15 minutes)',
    unit: '1',
  });

  auditLogUserActivityGauge.addCallback((observableResult: any) => {
    const now = Date.now();
    const cutoffTime = now - ACTIVITY_WINDOW_MS;

    // Clean up old entries and aggregate by organization
    const orgUserCounts = new Map<string, Set<string>>();

    for (const [key, value] of userActivity.entries()) {
      if (value.lastUpdate < cutoffTime) {
        userActivity.delete(key);
      } else {
        // key format: "orgId:userId"
        const [orgId, userId] = key.split(':');
        if (!orgUserCounts.has(orgId)) {
          orgUserCounts.set(orgId, new Set());
        }
        orgUserCounts.get(orgId)!.add(userId);
      }
    }

    // Report metrics for each organization
    for (const [orgId, users] of orgUserCounts.entries()) {
      observableResult.observe(users.size, {
        organization_id: orgId,
      });
    }
  });

  // Gauge: Activity count by organization
  auditLogOrganizationActivityGauge = auditLogMeter.createObservableGauge('audit.logs.organization_activity', {
    description: 'Number of audit log events by organization in last 15 minutes',
    unit: '1',
  });

  auditLogOrganizationActivityGauge.addCallback((observableResult: any) => {
    const now = Date.now();
    const cutoffTime = now - ACTIVITY_WINDOW_MS;

    // Clean up old entries
    for (const [orgId, activity] of organizationActivity.entries()) {
      if (activity.lastUpdate < cutoffTime) {
        organizationActivity.delete(orgId);
      } else {
        observableResult.observe(activity.count, {
          organization_id: orgId,
        });
      }
    }
  });

  // Query Execution Counter
  queryExecutionsCounter = auditLogMeter.createCounter('query.executions.total', {
    description: 'Total number of query executions',
    unit: '1',
  });

  // Query Failures Counter
  queryFailuresCounter = auditLogMeter.createCounter('query.failures.total', {
    description: 'Total number of failed queries',
    unit: '1',
  });

  // Query Duration Histogram
  queryDurationHistogram = auditLogMeter.createHistogram('query.duration', {
    description: 'Query execution duration in milliseconds',
    unit: 'ms',
  });

  // App Usage Counter
  appUsageCounter = auditLogMeter.createCounter('app.usage.total', {
    description: 'Total app interactions',
    unit: '1',
  });

  // App Active Users Gauge
  appActiveUsersGauge = auditLogMeter.createObservableGauge('app.active_users', {
    description: 'Number of active users per app (last 15 minutes)',
    unit: '1',
  });

  appActiveUsersGauge.addCallback((observableResult: any) => {
    const now = Date.now();
    const cutoffTime = now - ACTIVITY_WINDOW_MS;

    for (const [appId, users] of appActiveUsers.entries()) {
      // Clean up inactive users
      for (const [userId, lastSeen] of users.entries()) {
        if (lastSeen < cutoffTime) {
          users.delete(userId);
        }
      }

      // Report active user count for this app
      if (users.size > 0) {
        observableResult.observe(users.size, {
          app_id: appId,
        });
      } else {
        // Remove empty app entries
        appActiveUsers.delete(appId);
      }
    }
  });

  // User Sessions Counter
  userSessionsCounter = auditLogMeter.createCounter('user.sessions.total', {
    description: 'Total user login/logout events',
    unit: '1',
  });

  console.log('✅ Audit log metrics initialized:');
  console.log('   - audit.logs.total, audit.logs.actions, audit.logs.resources');
  console.log('   - audit.logs.active_users, audit.logs.organization_activity');
  console.log('   - query.executions.total, query.failures.total, query.duration');
  console.log('   - app.usage.total, app.active_users');
  console.log('   - user.sessions.total');
};

/**
 * Record an audit log event to OTEL metrics
 *
 * @param auditLogData - The audit log data to record
 */
export const recordAuditLogMetric = (auditLogData: AuditLogFields) => {
  if (!auditLogCounter) {
    console.warn('Audit log metrics not initialized. Skipping metric recording.');
    return;
  }

  try {
    const {
      userId,
      organizationId,
      resourceType,
      actionType,
      resourceName,
      resourceId,
      ipAddress,
      metadata = {},
    } = auditLogData;

    // Prepare common attributes
    const commonAttributes = {
      organization_id: organizationId,
      user_id: userId,
      resource_type: resourceType,
      action_type: actionType,
    };

    // Record total audit log counter
    auditLogCounter.add(1, commonAttributes);

    // Record action-specific counter
    auditLogActionCounter.add(1, {
      action_type: actionType,
      resource_type: resourceType,
      organization_id: organizationId,
    });

    // Record resource-specific counter
    auditLogResourceCounter.add(1, {
      resource_type: resourceType,
      organization_id: organizationId,
    });

    // Update user activity gauge data
    const userActivityKey = `${organizationId}:${userId}`;
    userActivity.set(userActivityKey, {
      count: (userActivity.get(userActivityKey)?.count || 0) + 1,
      lastUpdate: Date.now(),
    });

    // Update organization activity gauge data
    if (organizationActivity.has(organizationId)) {
      const current = organizationActivity.get(organizationId)!;
      organizationActivity.set(organizationId, {
        count: current.count + 1,
        lastUpdate: Date.now(),
      });
    } else {
      organizationActivity.set(organizationId, {
        count: 1,
        lastUpdate: Date.now(),
      });
    }

    // Record query-specific metrics
    if (actionType === 'DATA_QUERY_RUN') {
      recordQueryMetrics(auditLogData);
    }

    // Record app-specific metrics
    if (resourceType === 'APP' || actionType.startsWith('APP_')) {
      recordAppMetrics(auditLogData);
    }

    // Record user session metrics
    if (actionType === 'USER_LOGIN' || actionType === 'USER_LOGOUT') {
      recordUserSessionMetrics(auditLogData);
    }

    // Log for debugging (optional, can be removed in production)
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.log(`[OTEL Audit Metric] Recorded: ${actionType} on ${resourceType} by user ${userId}`);
    }
  } catch (error) {
    console.error('Error recording audit log metric:', error);
  }
};

/**
 * Record query execution metrics
 */
function recordQueryMetrics(auditLogData: AuditLogFields) {
  if (!queryExecutionsCounter) return;

  const { metadata = {}, resourceData = {}, resourceId, resourceName, organizationId, userId } = auditLogData;

  const appId = metadata['appId'] || resourceData['appId'] || 'unknown';
  const appName = metadata['appName'] || resourceData['appName'] || 'unknown';
  const dataSourceType = resourceData['dataSourceType'] || metadata['dataSourceType'] || 'unknown';
  const status = metadata['status'] || 'success';
  const duration = metadata['duration'];
  const error = metadata['error'];
  const errorType = metadata['errorType'] || categorizeError(error);

  const labels = {
    app_id: appId,
    app_name: appName,
    query_id: resourceId,
    query_name: resourceName || 'unknown',
    data_source_type: dataSourceType,
    organization_id: organizationId,
    status: status,
  };

  // Count query execution
  queryExecutionsCounter.add(1, labels);

  // Record query duration if available
  if (duration && typeof duration === 'number') {
    queryDurationHistogram.record(duration, labels);
  }

  // Record failure if present
  if (status === 'failure' || error) {
    queryFailuresCounter.add(1, {
      app_id: appId,
      app_name: appName,
      query_name: resourceName || 'unknown',
      error_type: errorType,
      data_source_type: dataSourceType,
      organization_id: organizationId,
    });
  }

  // Track active users per app
  if (appId !== 'unknown') {
    trackAppActiveUser(appId, userId);
  }
}

/**
 * Record app usage metrics
 */
function recordAppMetrics(auditLogData: AuditLogFields) {
  if (!appUsageCounter) return;

  const { resourceId, resourceName, actionType, organizationId, userId, metadata = {} } = auditLogData;

  const appId = resourceId || metadata['appId'] || 'unknown';
  const appName = resourceName || metadata['appName'] || 'unknown';

  const labels = {
    app_id: appId,
    app_name: appName,
    action_type: actionType,
    organization_id: organizationId,
  };

  appUsageCounter.add(1, labels);

  // Track active users for this app
  if (appId !== 'unknown') {
    trackAppActiveUser(appId, userId);
  }
}

/**
 * Record user session metrics (login/logout)
 */
function recordUserSessionMetrics(auditLogData: AuditLogFields) {
  if (!userSessionsCounter) return;

  const { actionType, resourceData = {}, organizationId } = auditLogData;

  const eventType = actionType === 'USER_LOGIN' ? 'login' : 'logout';
  const authMethod = resourceData['auth_method'] || 'unknown';

  const labels = {
    event_type: eventType,
    auth_method: authMethod,
    organization_id: organizationId,
  };

  userSessionsCounter.add(1, labels);
}

/**
 * Track active user for an app
 */
function trackAppActiveUser(appId: string, userId: string) {
  if (!appActiveUsers.has(appId)) {
    appActiveUsers.set(appId, new Map());
  }
  appActiveUsers.get(appId)!.set(userId, Date.now());
}

/**
 * Categorize error type from error message
 */
function categorizeError(error: any): string {
  if (!error) return 'unknown';

  const errorStr = typeof error === 'string' ? error : error.message || String(error);
  const lowerError = errorStr.toLowerCase();

  if (lowerError.includes('timeout')) return 'timeout';
  if (lowerError.includes('connection')) return 'connection_error';
  if (lowerError.includes('syntax')) return 'syntax_error';
  if (lowerError.includes('permission') || lowerError.includes('denied')) return 'permission_error';
  if (lowerError.includes('not found')) return 'not_found';

  return 'unknown_error';
}

/**
 * Clear activity data (useful for testing)
 */
export const clearActivityData = () => {
  userActivity.clear();
  organizationActivity.clear();
  appActiveUsers.clear();
};
