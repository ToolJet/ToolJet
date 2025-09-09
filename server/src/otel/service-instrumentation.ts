import { trace, metrics, context, Span } from '@opentelemetry/api';
import { performance } from 'perf_hooks';

/**
 * Service Layer Instrumentation Utility for ToolJet
 * 
 * This utility provides comprehensive instrumentation for business logic services
 * including custom spans, metrics, and attributes for observability.
 */

// Service metrics
let serviceRequestCounter: any;
let serviceRequestDuration: any;
let serviceErrorCounter: any;
let serviceActiveRequests: any;

// Initialize metrics
export const initializeServiceMetrics = () => {
  const meter = metrics.getMeter('tooljet-services', '1.0.0');
  
  serviceRequestCounter = meter.createCounter('service_requests_total', {
    description: 'Total number of service requests by service, method, and status',
  });
  
  serviceRequestDuration = meter.createHistogram('service_request_duration_seconds', {
    description: 'Duration of service requests in seconds',
    unit: 's',
  });
  
  serviceErrorCounter = meter.createCounter('service_errors_total', {
    description: 'Total number of service errors by service, method, and error type',
  });
  
  serviceActiveRequests = meter.createUpDownCounter('service_active_requests', {
    description: 'Number of active service requests by service and method',
  });
  
  console.log('[ToolJet Backend] Service layer metrics initialized');
};

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

export interface ServiceSpanOptions {
  attributes?: Record<string, string | number | boolean>;
  tags?: Record<string, string>;
}

/**
 * Decorator to instrument service methods with tracing and metrics
 */
export function InstrumentService(serviceName: string, options?: ServiceSpanOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      const tracer = trace.getTracer('tooljet-services', '1.0.0');
      
      // Extract context from arguments (assumes first arg might contain context)
      const serviceContext: ServiceContext = {
        serviceName,
        methodName: propertyName,
        ...extractContextFromArgs(args)
      };

      const spanName = `${serviceName}.${propertyName}`;
      
      return tracer.startActiveSpan(spanName, async (span: Span) => {
        try {
          // Increment active requests
          if (serviceActiveRequests) {
            serviceActiveRequests.add(1, {
              service: serviceName,
              method: propertyName
            });
          }

          // Add span attributes
          addSpanAttributes(span, serviceContext, options);

          console.log(`[ToolJet Backend] Service operation started: ${spanName}`, {
            userId: serviceContext.userId,
            organizationId: serviceContext.organizationId,
            appId: serviceContext.appId
          });

          // Execute the original method
          const result = await method.apply(this, args);

          // Record success metrics
          const duration = (performance.now() - startTime) / 1000;
          recordServiceMetrics(serviceContext, 'success', duration);

          span.setStatus({ code: 1 }); // OK
          span.setAttribute('operation.result', 'success');
          
          if (result && typeof result === 'object') {
            if (Array.isArray(result)) {
              span.setAttribute('result.count', result.length);
            } else if (result.id) {
              span.setAttribute('result.id', result.id.toString());
            }
          }

          console.log(`[ToolJet Backend] Service operation completed: ${spanName}`, {
            duration: duration,
            status: 'success'
          });

          return result;

        } catch (error) {
          // Record error metrics
          const duration = (performance.now() - startTime) / 1000;
          const errorType = error.constructor.name || 'UnknownError';
          
          recordServiceMetrics(serviceContext, 'error', duration, errorType);

          // Add error information to span
          span.recordException(error);
          span.setStatus({ 
            code: 2, // ERROR
            message: error.message || 'Unknown error' 
          });
          span.setAttribute('error.type', errorType);
          span.setAttribute('error.message', error.message || 'Unknown error');

          console.error(`[ToolJet Backend] Service operation failed: ${spanName}`, {
            error: error.message,
            errorType: errorType,
            duration: duration
          });

          throw error;

        } finally {
          // Decrement active requests
          if (serviceActiveRequests) {
            serviceActiveRequests.add(-1, {
              service: serviceName,
              method: propertyName
            });
          }

          span.end();
        }
      });
    };

    return descriptor;
  };
}

/**
 * Manual instrumentation for cases where decorator isn't suitable
 */
export async function instrumentServiceOperation<T>(
  serviceContext: ServiceContext,
  operation: () => Promise<T>,
  options?: ServiceSpanOptions
): Promise<T> {
  const startTime = performance.now();
  const tracer = trace.getTracer('tooljet-services', '1.0.0');
  const spanName = `${serviceContext.serviceName}.${serviceContext.methodName}`;

  return tracer.startActiveSpan(spanName, async (span: Span) => {
    try {
      // Increment active requests
      if (serviceActiveRequests) {
        serviceActiveRequests.add(1, {
          service: serviceContext.serviceName,
          method: serviceContext.methodName
        });
      }

      // Add span attributes
      addSpanAttributes(span, serviceContext, options);

      console.log(`[ToolJet Backend] Service operation started: ${spanName}`, {
        userId: serviceContext.userId,
        organizationId: serviceContext.organizationId
      });

      const result = await operation();

      // Record success metrics
      const duration = (performance.now() - startTime) / 1000;
      recordServiceMetrics(serviceContext, 'success', duration);

      span.setStatus({ code: 1 });
      span.setAttribute('operation.result', 'success');

      console.log(`[ToolJet Backend] Service operation completed: ${spanName}`, {
        duration: duration,
        status: 'success'
      });

      return result;

    } catch (error) {
      const duration = (performance.now() - startTime) / 1000;
      const errorType = error.constructor.name || 'UnknownError';
      
      recordServiceMetrics(serviceContext, 'error', duration, errorType);

      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      span.setAttribute('error.type', errorType);

      console.error(`[ToolJet Backend] Service operation failed: ${spanName}`, {
        error: error.message,
        errorType: errorType
      });

      throw error;

    } finally {
      if (serviceActiveRequests) {
        serviceActiveRequests.add(-1, {
          service: serviceContext.serviceName,
          method: serviceContext.methodName
        });
      }
      span.end();
    }
  });
}

/**
 * Extract context information from method arguments
 */
function extractContextFromArgs(args: any[]): Partial<ServiceContext> {
  const context: Partial<ServiceContext> = {};

  for (const arg of args) {
    if (!arg || typeof arg !== 'object') continue;

    // Extract common context fields
    if (arg.userId || arg.user?.id) {
      context.userId = arg.userId || arg.user?.id;
    }
    if (arg.organizationId || arg.user?.organizationId) {
      context.organizationId = arg.organizationId || arg.user?.organizationId;
    }
    if (arg.appId || arg.app?.id) {
      context.appId = arg.appId || arg.app?.id;
    }
    if (arg.workflowId) {
      context.workflowId = arg.workflowId;
    }
    if (arg.dataSourceId) {
      context.dataSourceId = arg.dataSourceId;
    }
    if (arg.user?.email) {
      context.userEmail = arg.user.email;
    }
    if (arg.requestId) {
      context.requestId = arg.requestId;
    }
  }

  return context;
}

/**
 * Add attributes to the span for better observability
 */
function addSpanAttributes(span: Span, context: ServiceContext, options?: ServiceSpanOptions) {
  // Core service attributes
  span.setAttribute('service.name', context.serviceName);
  span.setAttribute('service.method', context.methodName);
  span.setAttribute('service.version', '1.0.0');

  // User context
  if (context.userId) {
    span.setAttribute('user.id', context.userId);
  }
  if (context.userEmail) {
    span.setAttribute('user.email', context.userEmail);
  }
  if (context.organizationId) {
    span.setAttribute('organization.id', context.organizationId);
  }

  // Business context
  if (context.appId) {
    span.setAttribute('app.id', context.appId);
  }
  if (context.workflowId) {
    span.setAttribute('workflow.id', context.workflowId);
  }
  if (context.dataSourceId) {
    span.setAttribute('datasource.id', context.dataSourceId);
  }

  // Request context
  if (context.requestId) {
    span.setAttribute('request.id', context.requestId);
  }
  if (context.ipAddress) {
    span.setAttribute('client.address', context.ipAddress);
  }
  if (context.userAgent) {
    span.setAttribute('user_agent.original', context.userAgent);
  }

  // Custom attributes from options
  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  // Custom tags
  if (options?.tags) {
    Object.entries(options.tags).forEach(([key, value]) => {
      span.setAttribute(`tag.${key}`, value);
    });
  }
}

/**
 * Record service metrics
 */
function recordServiceMetrics(
  context: ServiceContext, 
  status: 'success' | 'error', 
  duration: number, 
  errorType?: string
) {
  const labels = {
    service: context.serviceName,
    method: context.methodName,
    status: status
  };

  // Add organization context for better segmentation
  if (context.organizationId) {
    labels['organization_id'] = context.organizationId;
  }

  // Record request count
  if (serviceRequestCounter) {
    serviceRequestCounter.add(1, labels);
  }

  // Record request duration
  if (serviceRequestDuration) {
    serviceRequestDuration.record(duration, labels);
  }

  // Record errors
  if (status === 'error' && serviceErrorCounter && errorType) {
    serviceErrorCounter.add(1, {
      ...labels,
      error_type: errorType
    });
  }
}

/**
 * Get current service context from active span
 */
export function getCurrentServiceContext(): Partial<ServiceContext> {
  const activeSpan = trace.getActiveSpan();
  if (!activeSpan) return {};

  const spanContext = activeSpan.spanContext();
  return {
    requestId: spanContext.traceId
  };
}