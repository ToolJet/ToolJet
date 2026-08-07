import config from 'config';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { authHeader } from '@/_helpers/auth-header';
import { authenticationService } from '@/_services';

const FLUSH_INTERVAL_MS = 30_000;
const MAX_UNIQUE_ERRORS = 50;

let eventMap = new Map();
let flushTimer = null;
let initialized = false;

const _onUnload = () => flush();
const _onVisibility = () => {
  if (document.visibilityState === 'hidden') flush();
};

const _onGlobalError = (event) => {
  if (event.filename && !event.filename.startsWith(window.location.origin)) return;
  recordJsError(event.message || 'unknown_error', `${event.filename}:${event.lineno}`);
};
const _onUnhandledRejection = (event) => {
  const msg = event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'unknown_rejection');
  recordJsError(msg, 'unhandled_promise_rejection');
};

function isEnabled() {
  return window.public_config?.ENABLE_OTEL_FRONTEND === 'true';
}

function getCurrentWorkspaceId() {
  try {
    return authenticationService.currentSessionValue?.current_organization_id || undefined;
  } catch {
    return undefined;
  }
}

function getAppContext() {
  const path = window.location.pathname;
  if (path.startsWith('/applications/') || path.startsWith('/embed-apps/')) return 'released_app';
  if (path.match(/^\/apps\/[^/]+(\/preview)?$/)) return path.includes('/preview') ? 'preview' : 'edit';
  return 'platform';
}

// Called by AppBuilder/Viewer on mount so errors carry the human-readable name.
let _currentAppName = '';
export function setCurrentAppName(name) {
  _currentAppName = name || '';
}

function recordMetricEvent(fingerprint, type, attrs = {}) {
  if (!isEnabled()) return;

  const existing = eventMap.get(fingerprint);
  if (existing) {
    existing.count += 1;
    return;
  }
  if (eventMap.size >= MAX_UNIQUE_ERRORS) {
    flush();
    // flush defers when session isn't ready — drop rather than grow unbounded
    if (eventMap.size >= MAX_UNIQUE_ERRORS) return;
  }
  eventMap.set(fingerprint, { type, attrs, count: 1, firstSeen: Date.now() });
}

// Vitals are cumulative values, not occurrences — latest report supersedes, no count increment.
function recordWebVital(metric) {
  if (!isEnabled()) return;

  const fingerprint = `web_vital:${metric.name}:${metric.id}`;
  const existing = eventMap.get(fingerprint);
  if (existing) {
    existing.value = metric.value;
  } else {
    eventMap.set(fingerprint, {
      type: 'web_vital',
      attrs: { 'vital.name': metric.name.toLowerCase(), 'app.context': getAppContext() },
      value: metric.value,
      count: 1,
      firstSeen: Date.now(),
    });
  }
}

export function flush() {
  if (!isEnabled() || eventMap.size === 0) return;
  const wsId = getCurrentWorkspaceId();
  if (!wsId) return;

  const events = [...eventMap.values()];
  eventMap.clear();

  fetch(`${config.apiUrl}/otel/frontend-metrics`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ collected_at: new Date().toISOString(), events }),
    keepalive: true,
    credentials: 'include',
  }).catch(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[FrontendMetrics] flush failed (OTEL endpoint unreachable?)');
    }
  });
}

export function initFrontendMetrics() {
  if (initialized || !isEnabled()) return;
  initialized = true;

  if (window.__tjMetricsTimer) clearInterval(window.__tjMetricsTimer);
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
  window.__tjMetricsTimer = flushTimer;

  // Register vitals before our own visibilitychange listener — the lib reports
  // final CLS/INP on hidden, and listener order ensures they land in this flush.
  onLCP(recordWebVital);
  onFCP(recordWebVital);
  onCLS(recordWebVital);
  onINP(recordWebVital);
  onTTFB(recordWebVital);

  window.addEventListener('pagehide', _onUnload);
  document.addEventListener('visibilitychange', _onVisibility);
  window.addEventListener('error', _onGlobalError);
  window.addEventListener('unhandledrejection', _onUnhandledRejection);
}

export function teardownFrontendMetrics() {
  flush();
  clearInterval(flushTimer);
  window.__tjMetricsTimer = null;
  flushTimer = null;
  window.removeEventListener('pagehide', _onUnload);
  document.removeEventListener('visibilitychange', _onVisibility);
  window.removeEventListener('error', _onGlobalError);
  window.removeEventListener('unhandledrejection', _onUnhandledRejection);
  eventMap.clear();
  initialized = false;
}

// Message/source stay in the fingerprint for dedup but are never sent as metric
// attrs — unbounded strings would explode Prometheus label cardinality.
export function recordJsError(errorMessage, source = '') {
  const msg = String(errorMessage).slice(0, 200);
  recordMetricEvent(`js_error:${msg}:${String(source).slice(0, 100)}`, 'js_error', {
    'app.name': _currentAppName,
    'app.context': getAppContext(),
  });
}

export function recordWidgetError(widgetType, errorMessage = '') {
  const msg = String(errorMessage).slice(0, 200);
  recordMetricEvent(`widget_error:${widgetType}:${msg}`, 'widget_error', {
    'app.name': _currentAppName,
    'app.context': getAppContext(),
    'widget.type': widgetType,
  });
}
