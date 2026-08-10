import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram, Meter } from '@opentelemetry/api';
import { getWorkspaceLabel } from './org-plan-cache';

let frontendMeter: Meter;
let jsErrorCounter: Counter;
let widgetErrorCounter: Counter;
let webVitalsHistogram: Histogram;
let clsHistogram: Histogram;
let appLoadDurationHistogram: Histogram;
let appLoadFailureCounter: Counter;

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
    // Default buckets top out at 10s — real ToolJet lcp/fcp land past that, pinning every
    // quantile to the ceiling. Boundaries straddle the web-vitals good/poor thresholds
    // (inp 200/500, ttfb 800/1800, fcp 1800/3000, lcp 2500/4000) and are fewer than the default 15.
    advice: { explicitBucketBoundaries: [100, 200, 500, 800, 1200, 1800, 2500, 4000, 6000, 10000, 20000, 40000] },
  });

  clsHistogram = frontendMeter.createHistogram('tooljet.frontend.cls', {
    description: 'Cumulative Layout Shift score reported by the browser',
    unit: '1',
    // Default buckets are ms-scale (5,10,25…) — CLS is a 0-1ish score, needs its own boundaries
    advice: { explicitBucketBoundaries: [0.05, 0.1, 0.15, 0.25, 0.5, 0.75, 1, 2] },
  });

  // The end-user SLI: viewer mount -> app loaded.
  appLoadDurationHistogram = frontendMeter.createHistogram('tooljet.frontend.app_load.duration', {
    description: 'Time from viewer mount to app loaded',
    unit: 'ms',
    // Same ceiling problem as web vitals: app loads routinely exceed the default 10s top bucket.
    advice: { explicitBucketBoundaries: [250, 500, 1000, 2000, 3000, 5000, 8000, 12000, 20000, 30000, 60000] },
  });

  appLoadFailureCounter = frontendMeter.createCounter('tooljet.frontend.app_load.failures', {
    description: 'App load did not complete (error/timeout before loaded)',
    unit: '1',
  });

  initialized = true;

  if (process.env.OTEL_LOG_LEVEL === 'debug') {
    console.log('[OTEL] Frontend metrics initialized');
  }
};

export type FrontendMetricEventType = 'js_error' | 'widget_error' | 'web_vital' | 'app_load' | 'app_load_failure';

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
  const organizationId = context.organizationId || 'unknown';

  for (const event of batch.events) {
    try {
      // Platform-context events are platform health, never bucketed — only app-scoped metrics gate
      const isPlatformContext = event.attrs?.['app.context'] === 'platform';
      const attrs: Record<string, string | number | boolean> = {
        ...event.attrs,
        'organization.id': isPlatformContext ? organizationId : getWorkspaceLabel(organizationId),
      };
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
        case 'app_load':
          if (typeof event.value !== 'number' || !Number.isFinite(event.value) || event.value < 0) break;
          appLoadDurationHistogram.record(event.value, attrs);
          break;
        case 'app_load_failure':
          appLoadFailureCounter.add(event.count ?? 1, attrs);
          break;
      }
    } catch (err) {
      if (process.env.OTEL_LOG_LEVEL === 'debug') {
        console.error('[OTEL Frontend] Error recording event:', event.type, err);
      }
    }
  }
};
