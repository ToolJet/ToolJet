import config from 'config';
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
  return path.startsWith('/applications/') || path.startsWith('/embed-apps/') ? 'released_app' : 'platform';
}

function getAppIdFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/^\/(?:apps|applications|embed-apps)\/([^/]+)/);
  return match ? match[1] : null;
}

function recordMetricEvent(fingerprint, type, attrs = {}) {
  if (!isEnabled()) return;

  const existing = eventMap.get(fingerprint);
  if (existing) {
    existing.count += 1;
  } else {
    eventMap.set(fingerprint, { type, attrs, count: 1, firstSeen: Date.now() });
  }

  if (eventMap.size >= MAX_UNIQUE_ERRORS) flush();
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

export function recordJsError(errorMessage, componentStack = '') {
  const msg = String(errorMessage).slice(0, 200);
  recordMetricEvent(`js_error:${msg}`, 'js_error', {
    app_context: getAppContext(),
    error_message: msg,
    component_stack: componentStack.slice(0, 500),
  });
}

export function recordWidgetError(widgetType, errorMessage = '') {
  const msg = String(errorMessage).slice(0, 200);
  recordMetricEvent(`widget_error:${widgetType}:${msg}`, 'widget_error', {
    app_context: getAppContext(),
    widget_type: widgetType,
    error_message: msg,
  });
}

export function recordQueryError(queryId, appId, errorType = 'unknown') {
  recordMetricEvent(`query_error:${queryId}:${errorType}`, 'query_error', {
    app_context: getAppContext(),
    query_id: queryId,
    app_id: appId ?? getAppIdFromUrl(),
    error_type: errorType,
  });
}
