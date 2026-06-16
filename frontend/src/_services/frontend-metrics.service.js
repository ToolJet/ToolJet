/**
 * Frontend Metrics Service (Track 1 — feat/app-based-metricsv2)
 *
 * Collects lightweight telemetry from the React SPA and forwards it to the
 * backend via POST /api/otel/frontend-metrics, which streams it directly into
 * the OTEL metric pipeline. No OTEL SDK is required in the browser.
 *
 * Telemetry is only sent when:
 *   1. window.public_config.ENABLE_OTEL === 'true'  (server-set flag)
 *   2. The user is authenticated (workspace ID available in session)
 *
 * Events are batched in memory and flushed:
 *   - Every FLUSH_INTERVAL_MS (default 30 s)
 *   - On page unload via pagehide / visibilitychange
 *   - When the batch reaches MAX_BATCH_SIZE events
 */

import config from 'config';
import { authHeader } from '@/_helpers/auth-header';
import { authenticationService } from '@/_services';
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

const FLUSH_INTERVAL_MS = 30_000;
const MAX_BATCH_SIZE = 50;

let eventQueue = [];
let flushTimer = null;
let initialized = false;

// Stored at module scope so teardownFrontendMetrics() can remove them.
// Named functions are required — anonymous arrows have no removable reference.
let _origPushState = null;
const _onUnload = () => flush();
const _onVisibility = () => {
  if (document.visibilityState === 'hidden') flush();
};
const _onPopstate = () => recordPageView(getCurrentPage());

function isEnabled() {
  return window.public_config?.ENABLE_OTEL === 'true';
}

function getCurrentWorkspaceId() {
  try {
    return authenticationService.currentSessionValue?.current_organization_id || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Queue a single metric event.
 *
 * @param {string} type - One of: page_view, page_load, app_open, app_load,
 *                        query_exec, query_error, widget_render, widget_error, js_error
 * @param {object} attrs - Metric labels (app_id, query_id, page, etc.)
 * @param {number} [duration] - Duration in ms (for histogram events)
 */
export function recordMetricEvent(type, attrs = {}, duration = undefined) {
  if (!isEnabled()) return;

  const event = {
    type,
    ts: Date.now(),
    attrs,
    ...(duration !== undefined && { duration }),
  };

  eventQueue.push(event);

  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flush();
  }
}

/**
 * Flush the in-memory event queue to the backend.
 *
 * Uses fetch with keepalive:true so the request survives page unload.
 * navigator.sendBeacon is NOT used because it omits cookies on cross-origin
 * requests (dev: port 8082→3000), causing 401s.
 */
export function flush() {
  if (!isEnabled() || eventQueue.length === 0) return;
  // Capture once — avoids TOCTOU if session changes between guard and batch assembly.
  const wsId = getCurrentWorkspaceId();
  // Session not ready yet — keep events in queue for next tick to avoid 401.
  if (!wsId) return;

  const events = eventQueue.splice(0);
  const batch = {
    collected_at: new Date().toISOString(),
    events,
  };

  fetch(`${config.apiUrl}/otel/frontend-metrics`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
    keepalive: true,
    credentials: 'include',
  }).catch(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[FrontendMetrics] flush failed (OTEL endpoint unreachable?)');
    }
  });
}

/**
 * Map the current URL pathname to a logical page name for metric labels.
 * Keeps cardinality bounded — never includes dynamic IDs.
 */
function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('/apps/')) return 'app-builder';
  if (path.startsWith('/applications/') || path.startsWith('/embed-apps/')) return 'app-viewer';
  if (path.includes('/workflows')) return 'workflows';
  if (path.includes('/database')) return 'database';
  // Covers /workspace-settings/*, /profile-settings/*, legacy /settings/*
  if (path.includes('/settings') || path.includes('/workspace-settings') || path.includes('/workspace-constants'))
    return 'settings';
  if (path.includes('/modules')) return 'modules';
  if (path.includes('/integrations')) return 'integrations';
  if (path.includes('/login') || path.includes('/signup') || path.includes('/sso')) return 'auth';
  if (path.includes('/home') || /^\/[^/]+\/?$/.test(path)) return 'dashboard';
  return 'other';
}

/**
 * Initialize the frontend metrics service.
 * Call this once after window.public_config is available (inside index.jsx).
 */
export function initFrontendMetrics() {
  if (initialized || !isEnabled()) return;
  initialized = true;

  // ponytail: window.__tjMetricsTimer survives HMR module re-evaluation so the
  // old instance's orphaned interval is cleared before the new one starts.
  if (window.__tjMetricsTimer) clearInterval(window.__tjMetricsTimer);
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
  window.__tjMetricsTimer = flushTimer;

  window.addEventListener('pagehide', _onUnload);
  document.addEventListener('visibilitychange', _onVisibility);

  // SPA page view tracking — patch pushState (genuine navigation) and popstate (back/forward).
  // replaceState is intentionally NOT patched: ToolJet uses it for URL cleanup (same page,
  // different query string) and patching it would produce spurious duplicate events.
  _origPushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    _origPushState(...args);
    _onPopstate();
  };
  window.addEventListener('popstate', _onPopstate);
  _onPopstate(); // initial page view

  // CLS is a unitless score (0.0–1.0); multiply by 1000 to store as an integer
  // on the same histogram as other ms-valued vitals. Divide by 1000 when reading.
  onLCP((m) => recordMetricEvent('page_load', { page: getCurrentPage(), vital: 'LCP' }, m.value));
  onINP((m) => recordMetricEvent('page_load', { page: getCurrentPage(), vital: 'INP' }, m.value));
  onCLS((m) => recordMetricEvent('page_load', { page: getCurrentPage(), vital: 'CLS' }, Math.round(m.value * 1000)));
  onFCP((m) => recordMetricEvent('page_load', { page: getCurrentPage(), vital: 'FCP' }, m.value));
  onTTFB((m) => recordMetricEvent('page_load', { page: getCurrentPage(), vital: 'TTFB' }, m.value));
}

/**
 * Tear down the metrics service — for TEST / HMR use only.
 * Restores all patched globals so re-initialization starts clean.
 */
export function teardownFrontendMetrics() {
  flush();
  clearInterval(flushTimer);
  window.__tjMetricsTimer = null;
  flushTimer = null;

  window.removeEventListener('pagehide', _onUnload);
  document.removeEventListener('visibilitychange', _onVisibility);
  window.removeEventListener('popstate', _onPopstate);

  if (_origPushState) {
    history.pushState = _origPushState;
    _origPushState = null;
  }

  eventQueue = [];
  initialized = false;
}

// ── Convenience helpers ──────────────────────────────────────────────────────

export function recordPageView(page) {
  recordMetricEvent('page_view', { page });
}

export function recordPageLoad(page, duration) {
  recordMetricEvent('page_load', { page }, duration);
}

export function recordAppOpen(appId, mode) {
  recordMetricEvent('app_open', { app_id: appId, mode });
}

export function recordAppLoad(appId, mode, duration) {
  recordMetricEvent('app_load', { app_id: appId, mode }, duration);
}

export function recordQueryExec(queryId, appId, status, duration) {
  recordMetricEvent('query_exec', { query_id: queryId, app_id: appId, status }, duration);
}

export function recordQueryError(queryId, appId, errorType = 'unknown') {
  recordMetricEvent('query_error', { query_id: queryId, app_id: appId, error_type: errorType });
}

export function recordWidgetRender(widgetType, duration, appId = '') {
  recordMetricEvent('widget_render', { widget_type: widgetType, app_id: appId }, duration);
}

export function recordWidgetError(widgetType, errorMessage = '') {
  recordMetricEvent('widget_error', { widget_type: widgetType, error_message: errorMessage.slice(0, 200) });
}

export function recordJsError(errorMessage, componentStack = '') {
  recordMetricEvent('js_error', {
    error_message: String(errorMessage).slice(0, 200),
    component_stack: componentStack.slice(0, 500),
  });
}
