/**
 * The single authority for every metric name and attribute key ToolJet emits.
 *
 * Rules applied (OpenTelemetry naming specification):
 *  - lowercase, dot-delimited namespaces; snake_case inside a segment
 *  - object properties read {object}.{property}
 *  - application-specific names take our own `tooljet.` prefix. `app.*` is an
 *    OCCUPIED semconv namespace meaning the client application (app.build_id,
 *    app.crash.id, app.jank.*, app.widget.*) — reusing it as our prefix is
 *    explicitly discouraged, hence `tooljet.app.*` for customer-built apps.
 *  - metric namespaces are never pluralized; `_total` is the Prometheus
 *    exporter's suffix to add, never ours to author
 *  - durations are recorded in SECONDS
 *
 * Everything is authored dotted. The Prometheus exporter flattens dots, so
 * `tooljet.query.executions` is queried as `tooljet_query_executions_total`.
 */

// ─── Metrics ────────────────────────────────────────────────────────────────

export const METRIC = {
  // Browser beacon
  FRONTEND_ERRORS: 'tooljet.frontend.errors',
  FRONTEND_WEB_VITAL_DURATION: 'tooljet.frontend.web_vital.duration',
  FRONTEND_WEB_VITAL_SCORE: 'tooljet.frontend.web_vital.score',
  FRONTEND_APP_LOAD_DURATION: 'tooljet.frontend.app_load.duration',
  FRONTEND_APP_LOAD_FAILURES: 'tooljet.frontend.app_load.failures',

  // Query execution
  QUERY_EXECUTIONS: 'tooljet.query.executions',
  QUERY_DURATION: 'tooljet.query.duration',

  // Seats and activity
  ORGANIZATION_SEATS: 'tooljet.organization.seats',
  APP_ACTIVE_USERS: 'tooljet.app.active_users',
} as const;

/**
 * Histogram boundaries, in seconds.
 *
 * The SDK defaults top out at 10s. Real ToolJet lcp/fcp and app loads exceed
 * that, which pinned every quantile to the ceiling. These straddle the
 * web-vitals good/poor thresholds (inp 0.2/0.5, ttfb 0.8/1.8, fcp 1.8/3,
 * lcp 2.5/4) using fewer buckets than the default 15.
 */
export const BUCKETS_SECONDS = {
  WEB_VITAL: [0.1, 0.2, 0.5, 0.8, 1.2, 1.8, 2.5, 4, 6, 10, 20, 40],
  APP_LOAD: [0.25, 0.5, 1, 2, 3, 5, 8, 12, 20, 30, 60],
  QUERY: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60],
  // CLS is a unitless 0-1ish score, not a duration — kept here so every
  // boundary set lives in one place.
  CLS_SCORE: [0.05, 0.1, 0.15, 0.25, 0.5, 0.75, 1, 2],
} as const;

// ─── Resource attributes ────────────────────────────────────────────────────

/**
 * Semconv renamed `deployment.environment` to `deployment.environment.name`.
 * The SDK still ships only the deprecated constant, so it is spelled here.
 */
export const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name';

/**
 * Where this server runs — 'local', 'staging', 'production'.
 *
 * NOT service.name. service.name is the LOGICAL service and must be identical
 * across every instance of it; putting a branch or deployment name there makes
 * a feature branch look like a different service in every query. Several
 * per-branch deployments sharing one Prometheus discriminate here instead
 * (e.g. 'staging-refactor-optimisations').
 *
 * Falls back to NODE_ENV, which is why staging reported 'production'.
 */
export const deploymentEnvironmentName = (): string =>
  process.env.DEPLOYMENT_ENVIRONMENT_NAME || process.env.NODE_ENV || 'development';

// ─── Attributes ─────────────────────────────────────────────────────────────

export const ATTR = {
  /**
   * Stable semconv. Low-cardinality error class, set ONLY when the operation
   * failed — its absence is what marks success, so no parallel `status` label.
   * `exception.type`/`.message`/`.stacktrace` are the log-record equivalents
   * and never appear on metrics.
   */
  ERROR_TYPE: 'error.type',

  // Customer-built apps
  APP_ID: 'tooljet.app.id',
  APP_NAME: 'tooljet.app.name',
  APP_VERSION: 'tooljet.app.version',
  /** Server-side truth: 'edit' | 'view'. Distinct from APP_CONTEXT. */
  APP_MODE: 'tooljet.app.mode',
  /** Browser-side truth: 'editor' | 'released_app' | 'platform'. */
  APP_CONTEXT: 'tooljet.app.context',
  APP_RELEASED: 'tooljet.app.released',

  // Workspaces
  ORGANIZATION_ID: 'tooljet.organization.id',
  ORGANIZATION_NAME: 'tooljet.organization.name',

  // Queries
  QUERY_ID: 'tooljet.query.id',
  QUERY_NAME: 'tooljet.query.name',
  QUERY_TYPE: 'tooljet.query.type',
  QUERY_TEXT: 'tooljet.query.text',
  DATA_SOURCE_TYPE: 'tooljet.data_source.type',

  // Multi-environment (development/staging/production inside a workspace) —
  // NOT deployment.environment.name, which names where the server itself runs.
  ENVIRONMENT_NAME: 'tooljet.environment.name',

  USER_ROLE: 'tooljet.user.role',
  WEB_VITAL_NAME: 'tooljet.web_vital.name',
  /** Component kind that threw — 'table', 'button', … Bounded by the widget catalogue. */
  WIDGET_TYPE: 'tooljet.widget.type',

  // Log records only. Metrics use ERROR_TYPE; these carry the unbounded detail
  // that would be cardinality suicide as a label.
  EXCEPTION_TYPE: 'exception.type',
  EXCEPTION_MESSAGE: 'exception.message',
  EXCEPTION_STACKTRACE: 'exception.stacktrace',
  EVENT_TYPE: 'event.type',
  EVENT_COUNT: 'event.count',
  ERROR_FINGERPRINT: 'error.fingerprint',
  USER_ID: 'user.id',
} as const;

/**
 * Values for ATTR.ERROR_TYPE on frontend error metrics.
 */
export const FRONTEND_ERROR_TYPE = {
  JS: 'js_error',
  WIDGET: 'widget_error',
} as const;

// ─── Beacon translation ─────────────────────────────────────────────────────

/**
 * The browser beacon sends its own key names and keeps sending them — a
 * deployed frontend outlives any given server build, so the server translates
 * at ingest rather than requiring the two to change in lockstep. This is also
 * the only place that decides what a label is finally called.
 *
 * Keys absent from this map are dropped, not passed through: the beacon is
 * client-controlled input, and an unbounded key would mint unbounded series.
 */
export const BEACON_ATTR_MAP: Readonly<Record<string, string>> = {
  'app.name': ATTR.APP_NAME,
  'app.context': ATTR.APP_CONTEXT,
  'app.environment': ATTR.ENVIRONMENT_NAME,
  'app.version': ATTR.APP_VERSION,
  'error.kind': ATTR.ERROR_TYPE,
  'vital.name': ATTR.WEB_VITAL_NAME,
  'widget.type': ATTR.WIDGET_TYPE,
};

/**
 * The keys the ingest endpoint accepts from a client payload. This IS the
 * allowlist — server-injected keys (organization.id, user.id, …) are absent
 * from the map, so a client that sends them is ignored by construction rather
 * than by a second reserved-key list that could fall out of step.
 */
export const isAcceptedBeaconAttr = (key: string): boolean =>
  Object.prototype.hasOwnProperty.call(BEACON_ATTR_MAP, key);

/** Longest label value we accept from the browser before truncating. */
export const MAX_BEACON_LABEL_LENGTH = 120;

/**
 * Translate one beacon attribute bag into canonical keys, dropping anything
 * unrecognised and clamping value length.
 */
export const translateBeaconAttrs = (
  raw: Record<string, string | number | boolean> | undefined
): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  if (!raw) return out;

  for (const [key, value] of Object.entries(raw)) {
    const canonical = BEACON_ATTR_MAP[key];
    if (!canonical) continue;
    out[canonical] = typeof value === 'string' ? value.slice(0, MAX_BEACON_LABEL_LENGTH) : value;
  }
  return out;
};
