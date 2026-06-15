/**
 * Frontend Metrics Service (Track 1 — feat/app-based-metricsv2)
 *
 * Collects lightweight telemetry from the React SPA and forwards it to the
 * backend via POST /api/otel/frontend-metrics, which streams it directly into
 * the OTEL metric pipeline. No OTEL SDK is required in the browser.
 *
 * Telemetry is only sent when:
 *   1. window.public_config.ENABLE_OTEL === 'true'  (server-set flag)
 *   2. The user is authenticated (JWT cookie is present, workspace known)
 *
 * Events are batched in memory and flushed:
 *   - Every FLUSH_INTERVAL_MS (default 30 s)
 *   - On page unload via navigator.sendBeacon
 *   - When the batch reaches MAX_BATCH_SIZE events
 */

import config from 'config';
import { authHeader } from '@/_helpers/auth-header';
import { authenticationService } from '@/_services';
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

const FLUSH_INTERVAL_MS = 30_000; // 30 seconds
const MAX_BATCH_SIZE = 50; // flush early when batch is large

// In-memory event queue
let eventQueue = [];
let flushTimer = null;
let initialized = false;

/**
 * Returns true when frontend metrics collection is enabled.
 * Reads the flag injected by ConfigService into window.public_config.
 */
function isEnabled() {
  return window.public_config?.ENABLE_OTEL === 'true';
}

/**
 * Get the current workspace ID from the auth session.
 * Falls back to undefined if not yet authenticated.
 */
function getCurrentWorkspaceId() {
  try {
    return authenticationService.currentSessionValue?.current_organization_id || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Queue a single metric event.
 * Called by the SPA at instrumentation points.
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
 * Always uses fetch with keepalive:true so the request survives page unload.
 * navigator.sendBeacon is NOT used because it omits cookies on cross-origin
 * requests (dev: port 8082→3000), causing 401s. fetch+keepalive is the modern
 * equivalent and supports credentials:'include'.
 */
export function flush() {
  if (!isEnabled() || eventQueue.length === 0) return;

  const events = eventQueue.splice(0); // drain queue atomically
  const batch = {
    collected_at: new Date().toISOString(),
    workspace_id: getCurrentWorkspaceId(),
    events,
  };

  fetch(`${config.apiUrl}/otel/frontend-metrics`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(batch),
    keepalive: true, // survives page unload (same role as sendBeacon)
    credentials: 'include', // sends tj_auth_token cookie cross-origin in dev
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
  // App editor: /:workspaceId/apps/:slug/...
  if (path.includes('/apps/')) return 'app-builder';
  // App viewer: /applications/... or /embed-apps/...
  if (path.startsWith('/applications/') || path.startsWith('/embed-apps/')) return 'app-viewer';
  // Workflows
  if (path.includes('/workflows')) return 'workflows';
  // TooljetDB
  if (path.includes('/database')) return 'database';
  // Any settings variant: workspace-settings, profile-settings, workspace-constants
  if (path.includes('/settings') || path.includes('/workspace-constants')) return 'settings';
  // Modules
  if (path.includes('/modules')) return 'modules';
  // Integrations / marketplace
  if (path.includes('/integrations')) return 'integrations';
  // Auth
  if (path.includes('/login') || path.includes('/signup') || path.includes('/sso')) return 'auth';
  // Dashboard: /:workspaceId or /:workspaceId/home
  if (path.includes('/home') || /^\/[^/]+\/?$/.test(path)) return 'dashboard';
  return 'other';
}

/**
 * Initialize the frontend metrics service.
 * Call this once after window.public_config is available (inside index.jsx).
 *
 * Sets up:
 * - Periodic flush interval
 * - Page unload beacon
 * - SPA route-change page view tracking (History API)
 * - Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
 */
export function initFrontendMetrics() {
  if (initialized || !isEnabled()) return;
  // Clear any stale timer from a previous init (HMR re-evaluation)
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  initialized = true;

  // Periodic flush
  flushTimer = setInterval(() => flush(false), FLUSH_INTERVAL_MS);

  // Unload beacon — fires when the user navigates away
  const onUnload = () => flush();
  window.addEventListener('pagehide', onUnload);
  // visibilitychange catches tab switches and mobile backgrounding
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  // SPA page view tracking — patch pushState (genuine navigation) and popstate (back/forward).
  // replaceState is intentionally NOT patched: ToolJet uses it for URL cleanup (same page,
  // different query string) and patching it would produce spurious duplicate events.
  const firePV = () => recordPageView(getCurrentPage());
  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
    firePV();
  };
  window.addEventListener('popstate', firePV);
  // Record the initial page load view
  firePV();

  // Core Web Vitals — reported once per page load (or on each attribution update for INP).
  // LCP/INP/FCP/TTFB are in ms. CLS is a unitless score (0.0–1.0); we multiply by 1000
  // to store it as an integer (milliunits) on the same histogram — dashboards querying
  // vital='CLS' should divide by 1000 to get the actual CLS score.
  const vitalAttrs = () => ({ page: getCurrentPage() });
  onLCP((m) => recordMetricEvent('page_load', { ...vitalAttrs(), vital: 'LCP' }, m.value));
  onINP((m) => recordMetricEvent('page_load', { ...vitalAttrs(), vital: 'INP' }, m.value));
  onCLS((m) => recordMetricEvent('page_load', { ...vitalAttrs(), vital: 'CLS' }, Math.round(m.value * 1000)));
  onFCP((m) => recordMetricEvent('page_load', { ...vitalAttrs(), vital: 'FCP' }, m.value));
  onTTFB((m) => recordMetricEvent('page_load', { ...vitalAttrs(), vital: 'TTFB' }, m.value));
}

/**
 * Tear down the metrics service — for TEST / HMR use only.
 * Never call from production code paths (e.g. logout handlers) because this
 * attempts a best-effort flush then drops any remaining buffered events.
 */
export function teardownFrontendMetrics() {
  flush(); // best-effort send; errors are silently ignored by flush()
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  eventQueue = [];
  initialized = false;
}

// ============================================================================
// Convenience helpers — call these at specific SPA instrumentation points
// ============================================================================

/**
 * Record a page view. Call from route change handlers.
 *
 * @param {string} page - Page/route name (e.g. 'dashboard', 'app-builder', 'viewer')
 */
export function recordPageView(page) {
  recordMetricEvent('page_view', { page });
}

/**
 * Record page load duration. Call after initial render.
 *
 * @param {string} page - Page name
 * @param {number} duration - Load time in ms
 */
export function recordPageLoad(page, duration) {
  recordMetricEvent('page_load', { page }, duration);
}

/**
 * Record an app open event (edit or view).
 *
 * @param {string} appId - ToolJet app UUID
 * @param {string} mode - 'edit' | 'view'
 */
export function recordAppOpen(appId, mode) {
  recordMetricEvent('app_open', { app_id: appId, mode });
}

/**
 * Record time-to-interactive for a ToolJet app.
 *
 * @param {string} appId
 * @param {string} mode - 'edit' | 'view'
 * @param {number} duration - ms from open to first-interactive
 */
export function recordAppLoad(appId, mode, duration) {
  recordMetricEvent('app_load', { app_id: appId, mode }, duration);
}

/**
 * Record a data query execution (client round-trip).
 *
 * @param {string} queryId
 * @param {string} appId
 * @param {string} status - 'success' | 'failure'
 * @param {number} duration - full round-trip ms
 */
export function recordQueryExec(queryId, appId, status, duration) {
  recordMetricEvent('query_exec', { query_id: queryId, app_id: appId, status }, duration);
}

/**
 * Record a client-side query error.
 *
 * @param {string} queryId
 * @param {string} appId
 * @param {string} errorType
 */
export function recordQueryError(queryId, appId, errorType = 'unknown') {
  recordMetricEvent('query_error', { query_id: queryId, app_id: appId, error_type: errorType });
}

/**
 * Record a widget render duration.
 *
 * @param {string} widgetType - Widget component name
 * @param {number} duration - Render time in ms
 * @param {string} [appId]
 */
export function recordWidgetRender(widgetType, duration, appId = '') {
  recordMetricEvent('widget_render', { widget_type: widgetType, app_id: appId }, duration);
}

/**
 * Record a widget error caught by the error boundary.
 *
 * @param {string} widgetType
 * @param {string} [errorMessage]
 */
export function recordWidgetError(widgetType, errorMessage = '') {
  recordMetricEvent('widget_error', { widget_type: widgetType, error_message: errorMessage.slice(0, 200) });
}

/**
 * Record a JavaScript error caught by a React error boundary.
 *
 * @param {string} errorMessage
 * @param {string} [componentStack]
 */
export function recordJsError(errorMessage, componentStack = '') {
  recordMetricEvent('js_error', {
    error_message: String(errorMessage).slice(0, 200),
    component_stack: componentStack.slice(0, 500),
  });
}
