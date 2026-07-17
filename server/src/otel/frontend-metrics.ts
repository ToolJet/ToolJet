import { metrics } from '@opentelemetry/api';
import { getWorkspaceLabel } from './org-plan-cache';

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
  firstSeen: number;
  count?: number;
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

  const orgId = context.organizationId || 'unknown';
  const userId = context.userId || 'anonymous';

  for (const event of batch.events) {
    try {
      // Platform events (app_context = 'platform') always use the real org ID —
      // we need full platform visibility. App events are gated on cloud.
      const isPlatform = event.attrs?.['app_context'] === 'platform';
      const workspaceId = isPlatform ? orgId : getWorkspaceLabel(orgId);

      const attrs = {
        ...event.attrs,
        'workspace.id': workspaceId,
        'user.id': userId,
      };

      const count = event.count ?? 1;
      switch (event.type) {
        case 'js_error':
          frontendJsErrorCounter.add(count, attrs);
          break;
        case 'widget_error':
          frontendWidgetErrorCounter.add(count, attrs);
          break;
        case 'query_error':
          frontendQueryErrorCounter.add(count, attrs);
          break;
      }
    } catch (err) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.error('[OTEL Frontend] Error recording event:', event.type, err);
      }
    }
  }
};
