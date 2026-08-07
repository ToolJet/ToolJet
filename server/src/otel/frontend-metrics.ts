import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram, Meter } from '@opentelemetry/api';

let frontendMeter: Meter;
let jsErrorCounter: Counter;
let widgetErrorCounter: Counter;
let webVitalsHistogram: Histogram;
let clsHistogram: Histogram;

let initialized = false;

export const initializeFrontendMetrics = () => {
  if (initialized) return;

  frontendMeter = metrics.getMeter('tooljet-frontend');

  jsErrorCounter = frontendMeter.createCounter('tooljet.frontend.js.errors', {
    description: 'JavaScript errors caught in the browser (error boundaries, window.onerror, unhandled rejections)',
    unit: '1',
  });

  widgetErrorCounter = frontendMeter.createCounter('tooljet.frontend.widget.errors', {
    description: 'Widget render errors caught by widget error boundaries',
    unit: '1',
  });

  // Durations and CLS are separate instruments — ms vs unitless score need different buckets
  webVitalsHistogram = frontendMeter.createHistogram('tooljet.frontend.web_vitals.duration', {
    description: 'Web vitals durations (lcp, fcp, ttfb, inp) reported by the browser',
    unit: 'ms',
  });

  clsHistogram = frontendMeter.createHistogram('tooljet.frontend.cls', {
    description: 'Cumulative Layout Shift score reported by the browser',
    unit: '1',
    // Default buckets are ms-scale (5,10,25…) — CLS is a 0-1ish score, needs its own boundaries
    advice: { explicitBucketBoundaries: [0.05, 0.1, 0.15, 0.25, 0.5, 0.75, 1, 2] },
  });

  initialized = true;

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log('[OTEL] Frontend metrics initialized');
  }
};

export type FrontendMetricEventType = 'js_error' | 'widget_error' | 'web_vital';

export interface FrontendMetricEvent {
  type: FrontendMetricEventType;
  firstSeen: number;
  count?: number;
  value?: number;
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

  // Org id comes from the JWT, never from the client payload.
  // user.id deliberately NOT a label — users × apps × widgets = series explosion.
  const baseAttrs = {
    'organization.id': context.organizationId || 'unknown',
  };

  for (const event of batch.events) {
    try {
      const attrs: Record<string, string | number | boolean> = { ...event.attrs, ...baseAttrs };
      switch (event.type) {
        case 'js_error':
          jsErrorCounter.add(event.count ?? 1, attrs);
          break;
        case 'widget_error':
          widgetErrorCounter.add(event.count ?? 1, attrs);
          break;
        case 'web_vital': {
          if (typeof event.value !== 'number' || !Number.isFinite(event.value) || event.value < 0) break;
          const { 'vital.name': vitalName, ...rest } = attrs;
          if (vitalName === 'cls') {
            clsHistogram.record(event.value, rest);
          } else {
            webVitalsHistogram.record(event.value, attrs);
          }
          break;
        }
      }
    } catch (err) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.error('[OTEL Frontend] Error recording event:', event.type, err);
      }
    }
  }
};
