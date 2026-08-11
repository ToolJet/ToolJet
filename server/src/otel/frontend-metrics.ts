import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram, Meter } from '@opentelemetry/api';
import { getWorkspaceLabel } from './org-plan-cache';
import { ATTR, BUCKETS_SECONDS, FRONTEND_ERROR_TYPE, METRIC, translateBeaconAttrs } from './semconv';

let frontendMeter: Meter;
let errorCounter: Counter;
let webVitalDurationHistogram: Histogram;
let webVitalScoreHistogram: Histogram;
let appLoadDurationHistogram: Histogram;
let appLoadFailureCounter: Counter;

let initialized = false;

export const initializeFrontendMetrics = () => {
  if (initialized) return;

  frontendMeter = metrics.getMeter('tooljet-frontend');

  // One counter split by error.type, not two counters that can drift apart.
  errorCounter = frontendMeter.createCounter(METRIC.FRONTEND_ERRORS, {
    description: 'Browser errors, split by error.type (js_error, widget_error)',
    unit: '1',
  });

  // Separate instruments — seconds vs unitless score need different buckets
  webVitalDurationHistogram = frontendMeter.createHistogram(METRIC.FRONTEND_WEB_VITAL_DURATION, {
    description: 'Web vitals durations (lcp, fcp, ttfb, inp) reported by the browser',
    unit: 's',
    advice: { explicitBucketBoundaries: [...BUCKETS_SECONDS.WEB_VITAL] },
  });

  webVitalScoreHistogram = frontendMeter.createHistogram(METRIC.FRONTEND_WEB_VITAL_SCORE, {
    description: 'Unitless web vital scores reported by the browser (cls)',
    unit: '1',
    advice: { explicitBucketBoundaries: [...BUCKETS_SECONDS.CLS_SCORE] },
  });

  // The end-user SLI: viewer mount -> app loaded.
  appLoadDurationHistogram = frontendMeter.createHistogram(METRIC.FRONTEND_APP_LOAD_DURATION, {
    description: 'Time from viewer mount to app loaded',
    unit: 's',
    advice: { explicitBucketBoundaries: [...BUCKETS_SECONDS.APP_LOAD] },
  });

  appLoadFailureCounter = frontendMeter.createCounter(METRIC.FRONTEND_APP_LOAD_FAILURES, {
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

const MS_PER_SECOND = 1000;

const isUsableDuration = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

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
        ...translateBeaconAttrs(event.attrs),
        [ATTR.ORGANIZATION_ID]: isPlatformContext ? organizationId : getWorkspaceLabel(organizationId),
      };
      // Log-record detail. As a label it would multiply every error series.
      delete attrs[ATTR.ERROR_KIND];

      switch (event.type) {
        case 'js_error':
          errorCounter.add(event.count ?? 1, { ...attrs, [ATTR.ERROR_TYPE]: FRONTEND_ERROR_TYPE.JS });
          break;
        case 'widget_error':
          errorCounter.add(event.count ?? 1, { ...attrs, [ATTR.ERROR_TYPE]: FRONTEND_ERROR_TYPE.WIDGET });
          break;
        case 'web_vital': {
          if (!isUsableDuration(event.value)) break;
          const { [ATTR.WEB_VITAL_NAME]: vitalName, ...withoutName } = attrs;
          if (vitalName === 'cls') {
            // Unitless score — no ms->s, no name label
            webVitalScoreHistogram.record(event.value, withoutName);
          } else {
            webVitalDurationHistogram.record(event.value / MS_PER_SECOND, attrs);
          }
          break;
        }
        case 'app_load':
          if (!isUsableDuration(event.value)) break;
          appLoadDurationHistogram.record(event.value / MS_PER_SECOND, attrs);
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
