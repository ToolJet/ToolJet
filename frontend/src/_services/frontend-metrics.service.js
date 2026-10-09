import config from 'config';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { authHeader } from '@/_helpers/auth-header';
import { authenticationService } from '@/_services';

const DEFAULT_FLUSH_INTERVAL_S = 30;
const MIN_FLUSH_INTERVAL_S = 5;
const MAX_FLUSH_INTERVAL_S = 600;
const MAX_UNIQUE_ERRORS = 50;

// OTEL_FRONTEND_FLUSH_INTERVAL_SECONDS, clamped. Too low floods ingest, too high loses a
// tab's events to the buffer cap; a bad value falls back rather than breaking the timer.
function getFlushIntervalMs() {
  const raw = Number(window.public_config?.OTEL_FRONTEND_FLUSH_INTERVAL_SECONDS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_FLUSH_INTERVAL_S * 1000;
  return Math.min(Math.max(raw, MIN_FLUSH_INTERVAL_S), MAX_FLUSH_INTERVAL_S) * 1000;
}

let eventMap = new Map();
let flushTimer = null;
let initialized = false;

const _onUnload = () => {
  recordAppLoadFailureIfPending();
  flush();
};
const _onVisibility = () => {
  if (document.visibilityState !== 'hidden') return;
  // Tab-hide is not session end. Failing the pending load here fabricates a failure for anyone
  // who switches tabs mid-load AND permanently discards the real duration, since markAppLoaded
  // no-ops once _appLoad is cleared. Bias lands hardest on slow loads. Flush only; pagehide owns failure.
  flush();
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
  // Editor/preview URLs carry a workspace-slug prefix (/demo/apps/...) — match anywhere, not anchored
  const path = window.location.pathname;
  if (path.includes('/applications/') || path.includes('/embed-apps/')) return 'released_app';
  if (path.match(/\/apps\/[^/]+/)) return path.includes('/preview') ? 'preview' : 'edit';
  return 'platform';
}

// Called by AppBuilder/Viewer on mount so errors carry the human-readable name.
let _currentAppName = '';
export function setCurrentAppName(name) {
  _currentAppName = name || '';
}

// ToolJet app environment (development|staging|production) + released version name.
let _currentAppEnvironment = '';
let _currentAppVersion = '';
export function setCurrentAppMeta({ environment, version } = {}) {
  _currentAppEnvironment = environment || '';
  _currentAppVersion = version || '';
}

function appAttrs() {
  const attrs = {
    'app.name': _currentAppName,
    'app.context': getAppContext(),
    'app.environment': _currentAppEnvironment,
  };
  // Version only for released traffic — bounds cardinality, answers "did the last release break it?"
  if (getAppContext() === 'released_app' && _currentAppVersion) attrs['app.version'] = _currentAppVersion;
  return attrs;
}

// App load SLI: mount -> layout ready. Load that never completes before the session
// ends (tab close/navigation) counts as a failure — the user never saw the app.
let _appLoad = null; // { start } while in-flight, null otherwise
let _appLoadResult = null; // { duration, firstSeen } awaiting flush
export function markAppLoadStart() {
  if (!isEnabled()) return;
  _appLoad = { start: performance.now() };
}
export function markAppLoaded() {
  if (!isEnabled() || !_appLoad) return;
  // Attrs materialize at flush — layout can be ready before the env/version store populates
  _appLoadResult = { duration: Math.round(performance.now() - _appLoad.start), firstSeen: Date.now() };
  _appLoad = null;
}
function recordAppLoadFailureIfPending() {
  if (!_appLoad) return;
  _appLoad = null;
  recordMetricEvent(`app_load_failure:${getAppContext()}`, 'app_load_failure', appAttrs());
}

function recordMetricEvent(fingerprint, type, attrs = {}, detail = undefined) {
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
  // detail rides only on first occurrence per fingerprint — dedup'd at the source
  eventMap.set(fingerprint, { type, attrs, count: 1, firstSeen: Date.now(), ...(detail && { detail }) });
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
  if (!isEnabled()) return;
  if (_appLoadResult) {
    eventMap.set(`app_load:${_appLoadResult.firstSeen}`, {
      type: 'app_load',
      attrs: appAttrs(),
      value: _appLoadResult.duration,
      count: 1,
      firstSeen: _appLoadResult.firstSeen,
    });
    _appLoadResult = null;
  }
  if (eventMap.size === 0) return;
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
  flushTimer = setInterval(flush, getFlushIntervalMs());
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
  // chunk_load = stale assets after deploy, not an app bug — tag so dashboards can split them
  const kind = /Loading (CSS )?chunk|ChunkLoadError/.test(msg) ? 'chunk_load' : 'generic';
  recordMetricEvent(
    `js_error:${msg}:${String(source).slice(0, 100)}`,
    'js_error',
    { ...appAttrs(), 'error.kind': kind },
    // Faro-compatible field names; server routes detail to logs, never metric attrs
    { type: 'js_error', value: msg, stacktrace: String(source).slice(0, 1000) }
  );
}

export function recordWidgetError(widgetType, errorMessage = '') {
  const msg = String(errorMessage).slice(0, 200);
  recordMetricEvent(
    `widget_error:${widgetType}:${msg}`,
    'widget_error',
    { ...appAttrs(), 'widget.type': widgetType },
    { type: 'widget_error', value: msg, stacktrace: '' }
  );
}
