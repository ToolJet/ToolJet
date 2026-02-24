import { metrics } from '@opentelemetry/api';
import { AuditLogFields } from '@modules/audit-logs/types';

/**
 * OTEL Metrics for Audit Logs
 *
 * This module provides OpenTelemetry metrics instrumentation for audit logs.
 * It tracks various app-based metrics by streaming audit log events to the OTEL collector.
 *
 * Metrics are separated into two categories:
 * - Platform metrics: Platform-level operations (user management, org settings, etc.)
 * - App metrics: App-specific operations (query execution, app usage, etc.)
 */

// Meters for different metric categories
let platformMeter: any;
let appMeter: any;

// Platform-level metrics
let auditLogCounter: any;
let auditLogActionCounter: any;
let auditLogResourceCounter: any;
let auditLogUserActivityGauge: any;
let auditLogOrganizationActivityGauge: any;
let userSessionsCounter: any;

// App-level query metrics (with mode and environment tracking)
let queryExecutionsCounter: any;
let queryFailuresCounter: any;
let queryDurationHistogram: any;

// App-level metrics
let appUsageCounter: any;
let appActiveUsersGauge: any;
let appSuccessRateGauge: any;
let appErrorsCounter: any;

// App lifecycle metrics
let appCreationsCounter: any;
let appUpdatesCounter: any;
let appDeletionsCounter: any;
let appReleasesCounter: any;

// Data source lifecycle metrics
let datasourceCreationsCounter: any;
let datasourceUpdatesCounter: any;
let datasourceDeletionsCounter: any;

// Store recent activity for gauges (last 15 minutes)
const ACTIVITY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const userActivity = new Map<string, { count: number; lastUpdate: number }>();
const organizationActivity = new Map<string, { count: number; lastUpdate: number }>();
const appActiveUsers = new Map<string, Map<string, number>>(); // appId -> Map<userId, lastSeen>

// Store app success/failure counts for success rate calculation
// Key format: "appId:mode:environment" -> { success: number, failure: number, lastUpdate: number }
const appSuccessTracking = new Map<string, { success: number; failure: number; lastUpdate: number }>();

/**
 * Initialize audit log metrics
 * Should be called after OTEL SDK is started
 */
export const initializeAuditLogMetrics = () => {
  // Create separate meters for platform and app metrics
  platformMeter = metrics.getMeter('tooljet-platform');
  appMeter = metrics.getMeter('tooljet-app');

  // ============ Platform-level metrics ============

  // Counter: Total audit log events
  auditLogCounter = platformMeter.createCounter('audit.logs.total', {
    description: 'Total number of audit log events',
    unit: '1',
  });

  // Counter: Audit log events by action type
  auditLogActionCounter = platformMeter.createCounter('audit.logs.actions', {
    description: 'Number of audit log events by action type',
    unit: '1',
  });

  // Counter: Audit log events by resource type
  auditLogResourceCounter = platformMeter.createCounter('audit.logs.resources', {
    description: 'Number of audit log events by resource type',
    unit: '1',
  });

  // Gauge: Active users by organization (based on recent audit logs)
  auditLogUserActivityGauge = platformMeter.createObservableGauge('audit.logs.active_users', {
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
  auditLogOrganizationActivityGauge = platformMeter.createObservableGauge('audit.logs.organization_activity', {
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

  // User Sessions Counter (platform-level)
  userSessionsCounter = platformMeter.createCounter('user.sessions.total', {
    description: 'Total user login/logout events',
    unit: '1',
  });

  // ============ App-level metrics ============

  // Query Execution Counter (with mode and environment labels)
  queryExecutionsCounter = appMeter.createCounter('query.executions.total', {
    description: 'Total number of query executions (labeled by mode and environment)',
    unit: '1',
  });

  // Query Failures Counter (with mode and environment labels)
  queryFailuresCounter = appMeter.createCounter('query.failures.total', {
    description: 'Total number of failed queries (labeled by mode and environment)',
    unit: '1',
  });

  // Query Duration Histogram (with mode and environment labels)
  queryDurationHistogram = appMeter.createHistogram('query.duration', {
    description: 'Query execution duration in milliseconds (labeled by mode and environment)',
    unit: 'ms',
  });

  // App Usage Counter
  appUsageCounter = appMeter.createCounter('app.usage.total', {
    description: 'Total app interactions',
    unit: '1',
  });

  // App Active Users Gauge
  appActiveUsersGauge = appMeter.createObservableGauge('app.active_users', {
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

  // App Success Rate Gauge (by mode and environment)
  appSuccessRateGauge = appMeter.createObservableGauge('app.success_rate', {
    description: 'Success rate of app queries (0-100%) by mode and environment in last 15 minutes',
    unit: '%',
  });

  appSuccessRateGauge.addCallback((observableResult: any) => {
    const now = Date.now();
    const cutoffTime = now - ACTIVITY_WINDOW_MS;

    for (const [key, stats] of appSuccessTracking.entries()) {
      if (stats.lastUpdate < cutoffTime) {
        appSuccessTracking.delete(key);
      } else {
        const [appId, mode, environment] = key.split(':');
        const total = stats.success + stats.failure;
        const successRate = total > 0 ? (stats.success / total) * 100 : 100;

        observableResult.observe(successRate, {
          app_id: appId,
          mode: mode,
          environment: environment,
        });
      }
    }
  });

  // App Errors Counter (for released apps)
  appErrorsCounter = appMeter.createCounter('app.errors.total', {
    description: 'Total errors in apps by mode and environment',
    unit: '1',
  });

  // App Lifecycle Counters
  appCreationsCounter = appMeter.createCounter('app.creations.total', {
    description: 'Total number of app creations',
    unit: '1',
  });

  appUpdatesCounter = appMeter.createCounter('app.updates.total', {
    description: 'Total number of app updates',
    unit: '1',
  });

  appDeletionsCounter = appMeter.createCounter('app.deletions.total', {
    description: 'Total number of app deletions',
    unit: '1',
  });

  appReleasesCounter = appMeter.createCounter('app.releases.total', {
    description: 'Total number of app releases',
    unit: '1',
  });

  // Data Source Lifecycle Counters
  datasourceCreationsCounter = appMeter.createCounter('datasource.creations.total', {
    description: 'Total number of datasource creations',
    unit: '1',
  });

  datasourceUpdatesCounter = appMeter.createCounter('datasource.updates.total', {
    description: 'Total number of datasource updates',
    unit: '1',
  });

  datasourceDeletionsCounter = appMeter.createCounter('datasource.deletions.total', {
    description: 'Total number of datasource deletions',
    unit: '1',
  });

  console.log('✅ Audit log metrics initialized with separate meters:');
  console.log('   Platform metrics (tooljet-platform):');
  console.log('     - audit.logs.total, audit.logs.actions, audit.logs.resources');
  console.log('     - audit.logs.active_users, audit.logs.organization_activity');
  console.log('     - user.sessions.total');
  console.log('   App metrics (tooljet-app):');
  console.log('     - query.executions.total (with mode/environment), query.failures.total, query.duration');
  console.log('     - app.usage.total, app.active_users, app.success_rate, app.errors.total');
  console.log('     - app.creations.total, app.updates.total, app.deletions.total, app.releases.total');
  console.log('     - datasource.creations.total, datasource.updates.total, datasource.deletions.total');
  console.log('');
  console.log('⚙️  Configuration:');
  console.log(`   OTEL_INCLUDE_QUERY_TEXT: ${process.env.OTEL_INCLUDE_QUERY_TEXT === 'true' ? 'enabled' : 'disabled (default)'}`);
  if (process.env.OTEL_INCLUDE_QUERY_TEXT === 'true') {
    console.log('   ⚠️  WARNING: query_text creates high cardinality metrics - use OTEL Collector to drop in production');
  }
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

    // Record app lifecycle metrics
    if (actionType === 'APP_CREATE' || actionType === 'APP_UPDATE' || actionType === 'APP_DELETE' || actionType === 'APP_RELEASE') {
      recordAppLifecycleMetrics(auditLogData);
    }

    // Record datasource lifecycle metrics
    if (actionType === 'DATA_SOURCE_CREATE' || actionType === 'DATA_SOURCE_UPDATE' || actionType === 'DATA_SOURCE_DELETE') {
      recordDataSourceLifecycleMetrics(auditLogData);
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

  // New labels for mode and environment tracking
  const mode = metadata['mode'] || resourceData['mode'] || 'unknown'; // 'edit' or 'view'
  const environment = metadata['environment'] || resourceData['environment'] || 'unknown'; // environment name
  const isReleased = mode === 'view' ? 'true' : 'false';

  // Extract query from parsedQueryOptions (camelCase from queryStatus.getMetaData())
  // Only include query text if explicitly enabled (to avoid high cardinality)
  const includeQueryText = process.env.OTEL_INCLUDE_QUERY_TEXT === 'true';
  const parsedQueryOptions = metadata['parsedQueryOptions'] || {};
  const queryText = includeQueryText ? (parsedQueryOptions['query'] || '') : '';
  const queryMode = parsedQueryOptions['mode'] || 'unknown'; // sql, gui, etc.

  const labels = {
    app_id: appId,
    app_name: appName,
    query_id: resourceId,
    query_name: resourceName || 'unknown',
    data_source_type: dataSourceType,
    organization_id: organizationId,
    status: status,
    mode: mode, // NEW: edit or view
    environment: environment, // NEW: environment name
    is_released: isReleased, // NEW: boolean string
    query_text: queryText, // NEW: actual SQL/query text
    query_mode: queryMode, // NEW: sql or gui
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
      mode: mode,
      environment: environment,
      is_released: isReleased,
      query_text: queryText,
      query_mode: queryMode,
    });

    // Record app-level error
    if (appErrorsCounter) {
      appErrorsCounter.add(1, {
        app_id: appId,
        app_name: appName,
        error_type: errorType,
        mode: mode,
        environment: environment,
        organization_id: organizationId,
      });
    }
  }

  // Track active users per app
  if (appId !== 'unknown') {
    trackAppActiveUser(appId, userId);
  }

  // Track app success rate
  if (appId !== 'unknown' && mode !== 'unknown' && environment !== 'unknown') {
    trackAppSuccess(appId, mode, environment, status === 'success');
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
 * Track app success/failure for success rate calculation
 */
function trackAppSuccess(appId: string, mode: string, environment: string, isSuccess: boolean) {
  const key = `${appId}:${mode}:${environment}`;
  const now = Date.now();

  if (!appSuccessTracking.has(key)) {
    appSuccessTracking.set(key, { success: 0, failure: 0, lastUpdate: now });
  }

  const stats = appSuccessTracking.get(key)!;
  if (isSuccess) {
    stats.success += 1;
  } else {
    stats.failure += 1;
  }
  stats.lastUpdate = now;
}

/**
 * Record app lifecycle metrics (create, update, delete, release)
 */
function recordAppLifecycleMetrics(auditLogData: AuditLogFields) {
  const { actionType, resourceId, resourceName, resourceData = {}, organizationId } = auditLogData;

  const appSlug = resourceData['appSlug'] || resourceId || 'unknown';
  const isPublic = resourceData['isPublic'] || false;

  const labels = {
    app_id: resourceId,
    app_name: resourceName || 'unknown',
    app_slug: appSlug,
    is_public: String(isPublic),
    organization_id: organizationId,
  };

  switch (actionType) {
    case 'APP_CREATE':
      if (appCreationsCounter) {
        appCreationsCounter.add(1, labels);
      }
      break;
    case 'APP_UPDATE':
      if (appUpdatesCounter) {
        const updatedFields = resourceData['updatedFields'] || [];
        appUpdatesCounter.add(1, {
          ...labels,
          updated_fields: Array.isArray(updatedFields) ? updatedFields.join(',') : String(updatedFields),
        });
      }
      break;
    case 'APP_DELETE':
      if (appDeletionsCounter) {
        appDeletionsCounter.add(1, labels);
      }
      break;
    case 'APP_RELEASE':
      if (appReleasesCounter) {
        const environmentName = resourceData['environmentName'] || 'unknown';
        const releasedVersionName = resourceData['releasedVersionName'] || 'unknown';
        appReleasesCounter.add(1, {
          ...labels,
          environment: environmentName,
          version: releasedVersionName,
        });
      }
      break;
  }
}

/**
 * Record datasource lifecycle metrics (create, update, delete)
 */
function recordDataSourceLifecycleMetrics(auditLogData: AuditLogFields) {
  const { actionType, resourceId, resourceName, resourceData = {}, organizationId } = auditLogData;

  const dataSourceKind = resourceData['dataSourceKind'] || 'unknown';
  const dataSourceScope = resourceData['dataSourceScope'] || 'unknown';
  const appId = resourceData['appId'] || null;
  const environmentId = resourceData['environmentId'] || 'unknown';

  const labels = {
    datasource_id: resourceId,
    datasource_name: resourceName || 'unknown',
    datasource_kind: dataSourceKind,
    datasource_scope: dataSourceScope,
    organization_id: organizationId,
    environment_id: environmentId,
  };

  // Add appId only if it's not null (for app-scoped datasources)
  if (appId) {
    labels['app_id'] = appId;
  }

  switch (actionType) {
    case 'DATA_SOURCE_CREATE':
      if (datasourceCreationsCounter) {
        datasourceCreationsCounter.add(1, labels);
      }
      break;
    case 'DATA_SOURCE_UPDATE':
      if (datasourceUpdatesCounter) {
        const updatedFields = resourceData['updatedFields'] || [];
        datasourceUpdatesCounter.add(1, {
          ...labels,
          updated_fields: Array.isArray(updatedFields) ? updatedFields.join(',') : String(updatedFields),
        });
      }
      break;
    case 'DATA_SOURCE_DELETE':
      if (datasourceDeletionsCounter) {
        datasourceDeletionsCounter.add(1, labels);
      }
      break;
  }
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
  appSuccessTracking.clear();
};
