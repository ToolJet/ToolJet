import { metrics } from '@opentelemetry/api';
import { AuditLogFields } from '@modules/audit-logs/types';

/**
 * OTEL Metrics for app-level activity (sourced from audit log events).
 * Platform-level audit log counters (audit.logs.*) are intentionally excluded —
 * those duplicate what the audit log storage already tracks.
 */

let platformMeter: any;
let appMeter: any;

// Platform-level metrics
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

const ACTIVITY_WINDOW_MS = 15 * 60 * 1000;
const appActiveUsers = new Map<string, Map<string, number>>(); // appId -> Map<userId, lastSeen>

// Store app success/failure counts for success rate calculation
// Key format: "appId:app_mode:environment" -> { success: number, failure: number, lastUpdate: number }
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

  // User Sessions Counter
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
        const [appId, appMode, environment] = key.split(':');
        const total = stats.success + stats.failure;
        const successRate = total > 0 ? (stats.success / total) * 100 : 100;

        observableResult.observe(successRate, {
          app_id: appId,
          app_mode: appMode,
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

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log('[OTEL] Audit log metrics initialized (tooljet-platform + tooljet-app meters)');
    console.log(`[OTEL] OTEL_INCLUDE_QUERY_TEXT: ${process.env.OTEL_INCLUDE_QUERY_TEXT === 'true' ? 'enabled (high cardinality)' : 'disabled'}`);
  }
};

/**
 * Record an audit log event to OTEL metrics
 *
 * @param auditLogData - The audit log data to record
 */
export const recordAuditLogMetric = (auditLogData: AuditLogFields,isOtelEnabled?: boolean) => {
   if (!isOtelEnabled) {
   return;
 }
  if (!userSessionsCounter) {
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

  const appMode = metadata['mode'] || resourceData['mode'] || 'unknown'; // 'edit', 'view', or 'released'
  const environment = metadata['environment'] || resourceData['environment'] || 'unknown';
  const isPublished = (appMode === 'view' || appMode === 'released') ? 'true' : 'false';

  // Only include query text if explicitly enabled (to avoid high cardinality in Prometheus)
  const includeQueryText = process.env.OTEL_INCLUDE_QUERY_TEXT === 'true';
  const parsedQueryOptions = metadata['parsedQueryOptions'] || {};
  const queryText = includeQueryText ? (parsedQueryOptions['query'] || '') : '';
  const queryType = parsedQueryOptions['mode'] || 'unknown'; // sql, gui, raw, etc.

  const labels = {
    app_id: appId,
    app_name: appName,
    query_id: resourceId,
    query_name: resourceName || 'unknown',
    data_source_type: dataSourceType,
    organization_id: organizationId,
    status: status,
    app_mode: appMode,
    environment: environment,
    is_published: isPublished,
    query_text: queryText,
    query_type: queryType,
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
      app_mode: appMode,
      environment: environment,
      is_published: isPublished,
      query_text: queryText,
      query_type: queryType,
    });

    // Record app-level error
    if (appErrorsCounter) {
      appErrorsCounter.add(1, {
        app_id: appId,
        app_name: appName,
        error_type: errorType,
        app_mode: appMode,
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
  if (appId !== 'unknown' && appMode !== 'unknown' && environment !== 'unknown') {
    trackAppSuccess(appId, appMode, environment, status === 'success');
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
function trackAppSuccess(appId: string, appMode: string, environment: string, isSuccess: boolean) {
  const key = `${appId}:${appMode}:${environment}`;
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

// ============================================================================
// DIRECT STREAMING — bypasses audit-log pipeline for lower latency
// Call these from service layer (EE util.service.ts, etc.) instead of waiting
// for the audit log event to be emitted and processed.
// ============================================================================

/**
 * DirectQueryMetricPayload — the minimal data needed to emit query metrics
 * directly without going through the audit-log pipeline.
 */
export interface DirectQueryMetricPayload {
  userId: string;
  organizationId: string;
  appId: string;
  appName?: string;
  queryId: string;
  queryName?: string;
  dataSourceType: string;
  app_mode: string; // 'edit' | 'view' | 'released'
  environment: string; // environment name
  status: 'success' | 'failure' | string;
  duration?: number; // ms
  error?: string;
  errorType?: string;
  queryText?: string; // only if OTEL_INCLUDE_QUERY_TEXT=true
  query_type?: string; // 'sql' | 'gui' | 'raw' | etc.
}

/**
 * Record query execution metrics directly to OTEL, bypassing audit logs.
 *
 * Use this in the EE DataQueriesUtilService.runQuery() finally block
 * when ENABLE_OTEL=true, instead of waiting for the audit log pipeline.
 */
export const recordDirectQueryMetric = (payload: DirectQueryMetricPayload) => {
  if (!queryExecutionsCounter) {
    // OTEL not yet initialised — silently skip; never throw from observability code
    return;
  }

  try {
    const {
      userId,
      organizationId,
      appId,
      appName = 'unknown',
      queryId,
      queryName = 'unknown',
      dataSourceType,
      app_mode,
      environment,
      status,
      duration,
      error,
      queryText = '',
      query_type = 'unknown',
    } = payload;

    const isPublished = (app_mode === 'view' || app_mode === 'released') ? 'true' : 'false';
    const errorType = payload.errorType || categorizeError(error);
    const qtLabel = process.env.OTEL_INCLUDE_QUERY_TEXT === 'true' ? queryText : '';

    const labels = {
      app_id: appId || 'unknown',
      app_name: appName,
      query_id: queryId,
      query_name: queryName,
      data_source_type: dataSourceType,
      organization_id: organizationId,
      status,
      app_mode,
      environment,
      is_published: isPublished,
      query_text: qtLabel,
      query_type,
    };

    queryExecutionsCounter.add(1, labels);

    if (duration !== undefined && typeof duration === 'number') {
      queryDurationHistogram.record(duration, labels);
    }

    if (status === 'failure' || error) {
      if (queryFailuresCounter) {
        queryFailuresCounter.add(1, {
          app_id: appId || 'unknown',
          app_name: appName,
          query_name: queryName,
          error_type: errorType,
          data_source_type: dataSourceType,
          organization_id: organizationId,
          app_mode,
          environment,
          is_published: isPublished,
          query_text: qtLabel,
          query_type,
        });
      }
      if (appErrorsCounter && appId) {
        appErrorsCounter.add(1, {
          app_id: appId,
          app_name: appName,
          error_type: errorType,
          app_mode,
          environment,
          organization_id: organizationId,
        });
      }
    }

    if (appId && appId !== 'unknown') {
      trackAppActiveUser(appId, userId);
      if (app_mode !== 'unknown' && environment !== 'unknown') {
        trackAppSuccess(appId, app_mode, environment, status === 'success');
      }
    }

    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.log(
        `[OTEL Direct] query metric: app=${appId} query=${queryId} app_mode=${app_mode} env=${environment} status=${status} duration=${duration}ms`
      );
    }
  } catch (err) {
    // Observability must never break the application
    if (process.env.OTEL_LOG_LEVEL === 'debug') {
      console.error('[OTEL] Error in recordDirectQueryMetric:', err);
    }
  }
};

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
  appActiveUsers.clear();
  appSuccessTracking.clear();
};
