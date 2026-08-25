// Every metric name and attribute key we emit. Dotted; exporter flattens. Durations in seconds.
// `app.*` is an occupied semconv namespace (the client app) — ours go under `tooljet.app.*`.

export const METRIC = {
  FRONTEND_ERRORS: 'tooljet.frontend.errors',
  FRONTEND_WEB_VITAL_DURATION: 'tooljet.frontend.web_vital.duration',
  FRONTEND_WEB_VITAL_SCORE: 'tooljet.frontend.web_vital.score',
  FRONTEND_APP_LOAD_DURATION: 'tooljet.frontend.app_load.duration',
  FRONTEND_APP_LOAD_FAILURES: 'tooljet.frontend.app_load.failures',

  QUERY_EXECUTIONS: 'tooljet.query.executions',
  QUERY_DURATION: 'tooljet.query.duration',

  ORGANIZATION_SEATS: 'tooljet.organization.seats',
  APP_ACTIVE_USERS: 'tooljet.app.active_users',
} as const;

// SDK defaults top out at 10s; real lcp/fcp and app loads overflow it and pin every quantile.
export const BUCKETS_SECONDS = {
  WEB_VITAL: [0.1, 0.2, 0.5, 0.8, 1.2, 1.8, 2.5, 4, 6, 10, 20, 40],
  APP_LOAD: [0.25, 0.5, 1, 2, 3, 5, 8, 12, 20, 30, 60],
  QUERY: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60],
  CLS_SCORE: [0.05, 0.1, 0.15, 0.25, 0.5, 0.75, 1, 2],
} as const;

// SDK still ships only the deprecated `deployment.environment`.
export const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = 'deployment.environment.name';

// Where this server runs. NOT service.name, which must be identical across instances.
export const deploymentEnvironmentName = (): string => process.env.NODE_ENV || 'development';

export const ATTR = {
  // Set only on failure — absence marks success, so no parallel `status` label.
  ERROR_TYPE: 'error.type',

  APP_ID: 'tooljet.app.id',
  APP_NAME: 'tooljet.app.name',
  APP_VERSION: 'tooljet.app.version',
  // Server truth: 'edit' | 'view'. APP_CONTEXT is the browser's answer, different question.
  APP_MODE: 'tooljet.app.mode',
  APP_CONTEXT: 'tooljet.app.context',
  APP_RELEASED: 'tooljet.app.released',

  ORGANIZATION_ID: 'tooljet.organization.id',
  ORGANIZATION_NAME: 'tooljet.organization.name',

  QUERY_ID: 'tooljet.query.id',
  QUERY_NAME: 'tooljet.query.name',
  QUERY_TYPE: 'tooljet.query.type',
  QUERY_TEXT: 'tooljet.query.text',
  DATA_SOURCE_TYPE: 'tooljet.data_source.type',

  // Workspace environment, not where the server runs.
  ENVIRONMENT_NAME: 'tooljet.environment.name',

  USER_ROLE: 'tooljet.user.role',
  WEB_VITAL_NAME: 'tooljet.web_vital.name',
  // Beacon classification. Separate key so ERROR_TYPE stays event class on both signals.
  ERROR_KIND: 'tooljet.error.kind',
  WIDGET_TYPE: 'tooljet.widget.type',

  // Log records only — unbounded detail, never metric labels.
  EXCEPTION_TYPE: 'exception.type',
  EXCEPTION_MESSAGE: 'exception.message',
  EXCEPTION_STACKTRACE: 'exception.stacktrace',
  EVENT_TYPE: 'event.type',
  EVENT_COUNT: 'event.count',
  ERROR_FINGERPRINT: 'error.fingerprint',
  USER_ID: 'user.id',
} as const;

export const FRONTEND_ERROR_TYPE = {
  JS: 'js_error',
  WIDGET: 'widget_error',
} as const;

// Beacon keys accepted, and what we call them. Absent key = dropped; client input is cardinality.
export const BEACON_ATTR_MAP: Readonly<Record<string, string>> = {
  'app.name': ATTR.APP_NAME,
  'app.context': ATTR.APP_CONTEXT,
  'app.environment': ATTR.ENVIRONMENT_NAME,
  'app.version': ATTR.APP_VERSION,
  'error.kind': ATTR.ERROR_KIND,
  'vital.name': ATTR.WEB_VITAL_NAME,
  'widget.type': ATTR.WIDGET_TYPE,
};

// Server-injected keys are absent from the map, so a client cannot pre-empt them.
export const isAcceptedBeaconAttr = (key: string): boolean =>
  Object.prototype.hasOwnProperty.call(BEACON_ATTR_MAP, key);

// Rename only — ingest already clamped value length.
export const translateBeaconAttrs = (
  raw: Record<string, string | number | boolean> | undefined
): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  if (!raw) return out;

  for (const [key, value] of Object.entries(raw)) {
    const canonical = BEACON_ATTR_MAP[key];
    if (canonical) out[canonical] = value;
  }
  return out;
};
