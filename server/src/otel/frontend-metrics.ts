import { metrics } from '@opentelemetry/api';

/**
 * OTEL Frontend Metrics
 *
 * Captures browser-side telemetry forwarded from the React SPA to the backend
 * via POST /api/otel/frontend-metrics. The backend records these into the OTEL
 * metric pipeline exactly like server-side metrics — no separate collector needed.
 *
 * Metric naming convention: frontend.* prefix to distinguish from server-side metrics.
 */

// Meter for all frontend-sourced metrics
let frontendMeter: any;

// Page & navigation metrics
let frontendPageViewCounter: any;
let frontendPageLoadHistogram: any;

// App builder / viewer metrics
let frontendAppLoadHistogram: any; // time-to-interactive for an app
let frontendAppOpenCounter: any; // app opened (view or edit)

// Query metrics (client-side perspective — measures full round-trip including network)
let frontendQueryDurationHistogram: any;
let frontendQueryCounter: any;
let frontendQueryErrorCounter: any;

// Widget render metrics
let frontendWidgetRenderHistogram: any;
let frontendWidgetErrorCounter: any;

// Component load error counter (JS errors caught by boundary)
let frontendJsErrorCounter: any;

let initialized = false;

/**
 * Initialize frontend metric instruments.
 * Called from startOpenTelemetry() in tracing.ts — only runs when OTEL is enabled.
 */
export const initializeFrontendMetrics = () => {
  if (initialized) return;

  frontendMeter = metrics.getMeter('tooljet-frontend');

  // ── Page / navigation ─────────────────────────────────────────────────────
  frontendPageViewCounter = frontendMeter.createCounter('frontend.page.views', {
    description: 'Number of page views in the ToolJet SPA',
    unit: '1',
  });

  frontendPageLoadHistogram = frontendMeter.createHistogram('frontend.page.load_duration', {
    description: 'Page load duration in the browser (ms)',
    unit: 'ms',
  });

  // ── App builder / viewer ──────────────────────────────────────────────────
  frontendAppOpenCounter = frontendMeter.createCounter('frontend.app.opens', {
    description: 'Number of times a ToolJet app is opened (view or edit)',
    unit: '1',
  });

  frontendAppLoadHistogram = frontendMeter.createHistogram('frontend.app.load_duration', {
    description: 'Time from app open to first-interactive (ms)',
    unit: 'ms',
  });

  // ── Query metrics (client round-trip) ─────────────────────────────────────
  frontendQueryCounter = frontendMeter.createCounter('frontend.query.executions', {
    description: 'Number of data queries fired from the browser (includes network time)',
    unit: '1',
  });

  frontendQueryDurationHistogram = frontendMeter.createHistogram('frontend.query.duration', {
    description: 'Full round-trip query duration as measured by the browser (ms)',
    unit: 'ms',
  });

  frontendQueryErrorCounter = frontendMeter.createCounter('frontend.query.errors', {
    description: 'Number of query errors observed by the browser',
    unit: '1',
  });

  // ── Widget render metrics ─────────────────────────────────────────────────
  frontendWidgetRenderHistogram = frontendMeter.createHistogram('frontend.widget.render_duration', {
    description: 'Widget render time in the browser (ms)',
    unit: 'ms',
  });

  frontendWidgetErrorCounter = frontendMeter.createCounter('frontend.widget.errors', {
    description: 'Number of widget render errors',
    unit: '1',
  });

  // ── JS errors ─────────────────────────────────────────────────────────────
  frontendJsErrorCounter = frontendMeter.createCounter('frontend.js.errors', {
    description: 'Number of JavaScript errors caught by React error boundaries',
    unit: '1',
  });

  initialized = true;

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log('[OTEL] Frontend metrics initialized (meter: tooljet-frontend)');
  }
};

// ============================================================================
// Metric event types — mirrored in the frontend beacon payload
// ============================================================================

export type FrontendMetricEventType =
  | 'page_view'
  | 'page_load'
  | 'app_open'
  | 'app_load'
  | 'query_exec'
  | 'query_error'
  | 'widget_render'
  | 'widget_error'
  | 'js_error';

export interface FrontendMetricEvent {
  type: FrontendMetricEventType;
  /** Millisecond timestamp on the client when the event was captured */
  ts: number;
  /** Duration in ms (for histogram events) */
  duration?: number;
  /** Attributes for the metric */
  attrs: Record<string, string | number | boolean>;
}

export interface FrontendMetricsBatch {
  collected_at: string;
  events: FrontendMetricEvent[];
}

// ============================================================================
// Recording functions — called by the backend controller
// ============================================================================

/**
 * Process a batch of frontend metric events and forward them to OTEL.
 * Safe to call even when OTEL is not enabled (returns immediately).
 */
export const recordFrontendMetricsBatch = (
  batch: FrontendMetricsBatch,
  context: { userId?: string; organizationId?: string }
) => {
  if (!initialized) return;

  // JWT-derived values win; sanitizeAttrs in service.ts already stripped 'workspace.id'/'user.id'
  // from client attrs, so these assignments cannot be overridden by client data.
  const workspaceId = context.organizationId || 'unknown';
  const userId = context.userId || 'anonymous';

  for (const event of batch.events) {
    try {
      const baseAttrs = {
        ...event.attrs,
        'workspace.id': workspaceId,
        'user.id': userId,
      };

      switch (event.type) {
        case 'page_view':
          frontendPageViewCounter.add(1, baseAttrs);
          break;

        case 'page_load':
          if (event.duration !== undefined) frontendPageLoadHistogram.record(event.duration, baseAttrs);
          break;

        case 'app_open':
          frontendAppOpenCounter.add(1, baseAttrs);
          break;

        case 'app_load':
          if (event.duration !== undefined) frontendAppLoadHistogram.record(event.duration, baseAttrs);
          break;

        case 'query_exec':
          frontendQueryCounter.add(1, baseAttrs);
          if (event.duration !== undefined) frontendQueryDurationHistogram.record(event.duration, baseAttrs);
          break;

        case 'query_error':
          frontendQueryErrorCounter.add(1, baseAttrs);
          break;

        case 'widget_render':
          if (event.duration !== undefined) frontendWidgetRenderHistogram.record(event.duration, baseAttrs);
          break;

        case 'widget_error':
          frontendWidgetErrorCounter.add(1, baseAttrs);
          break;

        case 'js_error':
          frontendJsErrorCounter.add(1, baseAttrs);
          break;

        default:
          if (process.env.OTEL_LOG_LEVEL === 'debug') {
            console.warn(`[OTEL Frontend] Unknown event type: ${(event as any).type}`);
          }
      }
    } catch (err) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.error('[OTEL Frontend] Error recording event:', event.type, err);
      }
    }
  }

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log(`[OTEL Frontend] Recorded ${batch.events.length} events for workspace=${workspaceId} user=${userId}`);
  }
};
