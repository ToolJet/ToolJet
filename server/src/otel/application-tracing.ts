import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { SEMATTRS_ENDUSER_ID, SEMATTRS_DB_SYSTEM } from '@opentelemetry/semantic-conventions';

// Get the tracer for application-level spans
const tracer = trace.getTracer('tooljet-application', '1.0.0');

// Types for application context
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

// === BUSINESS LOGIC SPANS ===

/**
 * Create a span for app lifecycle operations (create, update, delete, deploy)
 */
export const traceAppLifecycleOperation = async <T>(
  operation: 'create' | 'update' | 'delete' | 'deploy' | 'clone',
  appContext: ApplicationContext,
  operationFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const span = tracer.startSpan(`app_${operation}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'app.operation': operation,
      'app.id': appContext.appId,
      'app.name': appContext.appName,
      'user.id': appContext.userId,
      'organization.id': appContext.organizationId,
      [SEMATTRS_ENDUSER_ID]: appContext.userId,
      ...metadata
    }
  });

  try {
    const result = await context.with(trace.setSpan(context.active(), span), operationFn);

    span.setStatus({ code: SpanStatusCode.OK });
    const operationTime = Date.now() - Date.now(); // We'll calculate this properly
    span.setAttributes({
      'app.operation.success': true,
      'app.operation.completed': true
    });

    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });
    span.setAttributes({
      'app.operation.success': false,
      'app.operation.error': (error as Error).message,
      'app.operation.error_type': (error as Error).constructor.name
    });
    throw error;
  } finally {
    span.end();
  }
};

/**
 * Create a span for query execution operations
 */
export const traceQueryExecution = async <T>(
  queryContext: {
    queryId: string;
    queryName: string;
    dataSourceType: string;
    dataSourceId: string;
    appId: string;
    appName: string;
    userId: string;
    organizationId: string;
  },
  executionFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const span = tracer.startSpan('query_execution', {
    kind: SpanKind.CLIENT,
    attributes: {
      'query.id': queryContext.queryId,
      'query.name': queryContext.queryName,
      'query.datasource.type': queryContext.dataSourceType,
      'query.datasource.id': queryContext.dataSourceId,
      'app.id': queryContext.appId,
      'app.name': queryContext.appName,
      'user.id': queryContext.userId,
      'organization.id': queryContext.organizationId,
      [SEMATTRS_ENDUSER_ID]: queryContext.userId,
      [SEMATTRS_DB_SYSTEM]: queryContext.dataSourceType,
      ...metadata
    }
  });

  const startTime = Date.now();

  try {
    // Add event for query start
    span.addEvent('query.execution.start', {
      'query.start_time': startTime
    });

    const result = await context.with(trace.setSpan(context.active(), span), executionFn);

    const executionTime = Date.now() - startTime;

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttributes({
      'query.execution.success': true,
      'query.execution.duration_ms': executionTime,
      'query.execution.result_size': JSON.stringify(result).length
    });

    span.addEvent('query.execution.complete', {
      'query.execution_time_ms': executionTime,
      'query.result_size_bytes': JSON.stringify(result).length
    });

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });

    span.setAttributes({
      'query.execution.success': false,
      'query.execution.duration_ms': executionTime,
      'query.execution.error': (error as Error).message,
      'query.execution.error_type': (error as Error).constructor.name
    });

    span.addEvent('query.execution.error', {
      'query.execution_time_ms': executionTime,
      'error.message': (error as Error).message,
      'error.type': (error as Error).constructor.name
    });

    throw error;
  } finally {
    span.end();
  }
};

/**
 * Create a span for data source connection operations
 */
export const traceDataSourceConnection = async <T>(
  connectionContext: {
    dataSourceType: string;
    dataSourceId: string;
    organizationId: string;
    operation: 'connect' | 'test' | 'disconnect' | 'query';
  },
  connectionFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const span = tracer.startSpan(`datasource_${connectionContext.operation}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'datasource.operation': connectionContext.operation,
      'datasource.type': connectionContext.dataSourceType,
      'datasource.id': connectionContext.dataSourceId,
      'organization.id': connectionContext.organizationId,
      [SEMATTRS_DB_SYSTEM]: connectionContext.dataSourceType,
      ...metadata
    }
  });

  const startTime = Date.now();

  try {
    span.addEvent(`datasource.${connectionContext.operation}.start`);

    const result = await context.with(trace.setSpan(context.active(), span), connectionFn);

    const operationTime = Date.now() - startTime;

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttributes({
      [`datasource.${connectionContext.operation}.success`]: true,
      [`datasource.${connectionContext.operation}.duration_ms`]: operationTime
    });

    span.addEvent(`datasource.${connectionContext.operation}.complete`, {
      'operation_time_ms': operationTime
    });

    return result;
  } catch (error) {
    const operationTime = Date.now() - startTime;

    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });

    span.setAttributes({
      [`datasource.${connectionContext.operation}.success`]: false,
      [`datasource.${connectionContext.operation}.duration_ms`]: operationTime,
      [`datasource.${connectionContext.operation}.error`]: (error as Error).message,
      'datasource.error_type': (error as Error).constructor.name
    });

    span.addEvent(`datasource.${connectionContext.operation}.error`, {
      'operation_time_ms': operationTime,
      'error.message': (error as Error).message
    });

    throw error;
  } finally {
    span.end();
  }
};

// === USER JOURNEY TRACING ===

/**
 * Create a span for complete user journey operations
 */
export const traceUserJourney = async <T>(
  journey: 'login' | 'app_access' | 'query_run' | 'app_deploy',
  userContext: ApplicationContext,
  journeyFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const span = tracer.startSpan(`user_journey_${journey}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'user.journey': journey,
      'user.id': userContext.userId,
      'user.email': userContext.userEmail,
      'user.session_id': userContext.sessionId,
      'organization.id': userContext.organizationId,
      'app.id': userContext.appId,
      'app.name': userContext.appName,
      [SEMATTRS_ENDUSER_ID]: userContext.userId,
      ...metadata
    }
  });

  const journeyStartTime = Date.now();

  try {
    span.addEvent(`user.journey.${journey}.start`, {
      'journey.start_time': journeyStartTime,
      'user.context': JSON.stringify(userContext)
    });

    const result = await context.with(trace.setSpan(context.active(), span), journeyFn);

    const journeyTime = Date.now() - journeyStartTime;

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttributes({
      [`user.journey.${journey}.success`]: true,
      [`user.journey.${journey}.duration_ms`]: journeyTime,
      'user.journey.completion_rate': 100
    });

    span.addEvent(`user.journey.${journey}.complete`, {
      'journey.duration_ms': journeyTime,
      'journey.status': 'completed'
    });

    return result;
  } catch (error) {
    const journeyTime = Date.now() - journeyStartTime;

    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });

    span.setAttributes({
      [`user.journey.${journey}.success`]: false,
      [`user.journey.${journey}.duration_ms`]: journeyTime,
      [`user.journey.${journey}.error`]: (error as Error).message,
      'user.journey.abandonment_point': journey,
      'user.journey.completion_rate': 0
    });

    span.addEvent(`user.journey.${journey}.abandoned`, {
      'journey.duration_ms': journeyTime,
      'abandonment.reason': (error as Error).message,
      'abandonment.point': journey
    });

    throw error;
  } finally {
    span.end();
  }
};

/**
 * Add user activity event to current span
 */
export const addUserActivityEvent = (
  activity: string,
  userContext: ApplicationContext,
  eventData?: Record<string, any>
) => {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.addEvent(`user.activity.${activity}`, {
      'user.id': userContext.userId,
      'organization.id': userContext.organizationId,
      'activity.timestamp': Date.now(),
      'activity.context': JSON.stringify(userContext),
      ...eventData
    });

    // Update span attributes with latest user activity
    activeSpan.setAttributes({
      'user.last_activity': activity,
      'user.last_activity_time': Date.now(),
      ...eventData
    });
  }
};

// === CROSS-SERVICE CORRELATION ===

/**
 * Create correlation context for linking frontend to backend operations
 */
export const createCorrelationContext = (
  correlationId: string,
  operationName: string,
  userContext: ApplicationContext
) => {
  const span = tracer.startSpan(`correlation_${operationName}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'correlation.id': correlationId,
      'correlation.operation': operationName,
      'correlation.source': 'backend',
      'user.id': userContext.userId,
      'organization.id': userContext.organizationId,
      [SEMATTRS_ENDUSER_ID]: userContext.userId
    }
  });

  return {
    span,
    context: trace.setSpan(context.active(), span),
    correlationId
  };
};

/**
 * Link related operations across services
 */
export const linkOperation = (
  parentCorrelationId: string,
  operation: string,
  operationData?: Record<string, any>
) => {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttributes({
      'correlation.parent_id': parentCorrelationId,
      'correlation.linked_operation': operation,
      ...operationData
    });

    activeSpan.addEvent('operation.linked', {
      'parent.correlation_id': parentCorrelationId,
      'linked.operation': operation,
      'link.timestamp': Date.now()
    });
  }
};

// === ENHANCED ERROR CONTEXT ===

/**
 * Enhanced error recording with business context
 */
export const recordBusinessError = (
  error: Error,
  businessContext: BusinessOperationContext,
  additionalContext?: Record<string, any>
) => {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    // Record the exception
    activeSpan.recordException(error);

    // Set error status
    activeSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });

    // Add comprehensive business context
    activeSpan.setAttributes({
      'error.business.operation': businessContext.operation,
      'error.business.resource': businessContext.resource,
      'error.business.resource_id': businessContext.resourceId,
      'error.business.user_id': businessContext.userId,
      'error.business.organization_id': businessContext.organizationId,
      'error.business.app_id': businessContext.appId,
      'error.business.impact': 'user_facing',
      'error.recovery.possible': true,
      ...additionalContext
    });

    // Add detailed error event
    activeSpan.addEvent('business.error.occurred', {
      'error.message': error.message,
      'error.type': error.constructor.name,
      'error.stack': error.stack,
      'business.context': JSON.stringify(businessContext),
      'error.timestamp': Date.now(),
      'error.severity': 'high'
    });
  }
};

/**
 * Record error recovery attempt
 */
export const recordErrorRecovery = (
  originalError: Error,
  recoveryAction: string,
  recoverySuccess: boolean,
  recoveryData?: Record<string, any>
) => {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.addEvent('error.recovery.attempt', {
      'original.error': originalError.message,
      'recovery.action': recoveryAction,
      'recovery.success': recoverySuccess,
      'recovery.timestamp': Date.now(),
      ...recoveryData
    });

    if (recoverySuccess) {
      activeSpan.setAttributes({
        'error.recovered': true,
        'error.recovery.action': recoveryAction
      });
    }
  }
};

// === UTILITY FUNCTIONS ===

/**
 * Get current trace context for correlation
 */
export const getCurrentTraceContext = () => {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      traceFlags: spanContext.traceFlags
    };
  }
  return null;
};

/**
 * Create child span with parent context
 */
export const createChildSpan = (
  operationName: string,
  attributes?: Record<string, any>
) => {
  return tracer.startSpan(operationName, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'span.type': 'child',
      'span.parent.trace_id': getCurrentTraceContext()?.traceId,
      ...attributes
    }
  });
};

// Export tracer for advanced usage
export { tracer };