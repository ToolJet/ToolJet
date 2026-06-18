import { metrics } from '@opentelemetry/api';

/**
 * OTEL Frontend Metrics — Phase 1 (errors only)
 *
 * Three counters: JS errors, widget errors, query errors.
 * Each carries an app_context label ('released_app' | 'platform') so dashboards
 * can split customer-facing app errors from ToolJet platform errors.
 */

let frontendMeter: any;
let frontendJsErrorCounter: any;
let frontendWidgetErrorCounter: any;
let frontendQueryErrorCounter: any;

let initialized = false;

export const initializeFrontendMetrics = () => {
  if (initialized) return;

  frontendMeter = metrics.getMeter('tooljet-frontend');

  frontendJsErrorCounter = frontendMeter.createCounter('frontend.js.errors', {
    description: 'JavaScript errors caught by React error boundaries',
    unit: '1',
  });

  frontendWidgetErrorCounter = frontendMeter.createCounter('frontend.widget.errors', {
    description: 'Widget render errors',
    unit: '1',
  });

  frontendQueryErrorCounter = frontendMeter.createCounter('frontend.query.errors', {
    description: 'Data query errors observed by the browser',
    unit: '1',
  });

  initialized = true;

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log('[OTEL] Frontend error metrics initialized');
  }
};

export type FrontendMetricEventType = 'query_error' | 'widget_error' | 'js_error';

export interface FrontendMetricEvent {
  type: FrontendMetricEventType;
  ts: number;
  duration?: number;
  attrs: Record<string, string | number | boolean>;
}

export interface FrontendMetricsBatch {
  collected_at: string;
  events: FrontendMetricEvent[];
}

export const recordFrontendMetricsBatch = (
  batch: FrontendMetricsBatch,
  context: { userId?: string; organizationId?: string }
) => {
  if (!initialized) return;

  const workspaceId = context.organizationId || 'unknown';
  const userId = context.userId || 'anonymous';

  for (const event of batch.events) {
    try {
      const attrs = {
        ...event.attrs,
        'workspace.id': workspaceId,
        'user.id': userId,
      };

      switch (event.type) {
        case 'js_error':
          frontendJsErrorCounter.add(1, attrs);
          break;
        case 'widget_error':
          frontendWidgetErrorCounter.add(1, attrs);
          break;
        case 'query_error':
          frontendQueryErrorCounter.add(1, attrs);
          break;
      }
    } catch (err) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.error('[OTEL Frontend] Error recording event:', event.type, err);
      }
    }
  }
};
