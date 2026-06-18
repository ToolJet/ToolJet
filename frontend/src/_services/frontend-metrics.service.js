/**
 * Frontend Metrics Service (Track 1 — feat/app-based-metricsv2)
 *
 * Collects error telemetry from the React SPA and forwards it to the
 * backend via POST /api/otel/frontend-metrics.
 *
 * Only three event types are tracked (Phase 1):
 *   - js_error   : React error boundary catches
 *   - widget_error: widget render failures
 *   - query_error : data query failures
 *
 * Events are flushed every 30 s, but ONLY when the queue is non-empty.
 * On page unload the queue is flushed immediately.
 *
 * Enabled only when window.public_config.ENABLE_OTEL === 'true'.
 */

import config from 'config';
import { authHeader } from '@/_helpers/auth-header';
import { authenticationService } from '@/_services';

const FLUSH_INTERVAL_MS = 30_000;
const MAX_BATCH_SIZE = 50;

let eventQueue = [];
let flushTimer = null;
let initialized = false;

const _onUnload = () => flush();
const _onVisibility = () => {
  if (document.visibilityState === 'hidden') flush();
};

// Global error listeners — defined at module level so teardown can remove the same refs.
const _onGlobalError = (event) => {
  // Skip errors from browser extensions (filename won't match our origin).
  if (event.filename && !event.filename.startsWith(window.location.origin)) return;
  recordJsError(event.message || 'unknown_error', `${event.filename}:${event.lineno}`);
};
const _onUnhandledRejection = (event) => {
  const msg = event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'unknown_rejection');
  recordJsError(msg, 'unhandled_promise_rejection');
};

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

/** 'released_app' for /applications/* and /embed-apps/*, 'platform' for everything else. */
function getAppContext() {
  const path = window.location.pathname;
  return path.startsWith('/applications/') || path.startsWith('/embed-apps/') ? 'released_app' : 'platform';
}

/**
 * Extract app identifier from the current URL.
 * Editor:   /apps/{uuid}/...        → UUID
 * Released: /applications/{slug}/... → slug
 * Embed:    /embed-apps/{slug}/...   → slug
 */
function getAppIdFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/^\/(?:apps|applications|embed-apps)\/([^/]+)/);
  return match ? match[1] : null;
}

function recordMetricEvent(type, attrs = {}) {
  if (!isEnabled()) return;
  eventQueue.push({ type, ts: Date.now(), attrs });
  if (eventQueue.length >= MAX_BATCH_SIZE) flush();
}

export function flush() {
  if (!isEnabled() || eventQueue.length === 0) return;
  const wsId = getCurrentWorkspaceId();
  if (!wsId) return;

  const events = eventQueue.splice(0);
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
  eventQueue = [];
  initialized = false;
}

// ── Error helpers ────────────────────────────────────────────────────────────

export function recordJsError(errorMessage, componentStack = '') {
  recordMetricEvent('js_error', {
    app_context: getAppContext(),
    error_message: String(errorMessage).slice(0, 200),
    component_stack: componentStack.slice(0, 500),
  });
}

export function recordWidgetError(widgetType, errorMessage = '') {
  recordMetricEvent('widget_error', {
    app_context: getAppContext(),
    widget_type: widgetType,
    error_message: String(errorMessage).slice(0, 200),
  });
}

export function recordQueryError(queryId, appId, errorType = 'unknown') {
  recordMetricEvent('query_error', {
    app_context: getAppContext(),
    query_id: queryId,
    app_id: appId ?? getAppIdFromUrl(),
    error_type: errorType,
  });
}
