export const APP_VALIDATION_FAILED = 'APP_VALIDATION_FAILED';

// "report", or per source with a fallback: "pat=enforce,*=report".
export const APP_VALIDATION_MODE_ENV = 'APP_VALIDATION_MODE';

export const VALIDATION_MODES = ['off', 'report', 'enforce'] as const;
export const DEFAULT_VALIDATION_MODE = 'report';

export const WRITE_SOURCES = ['ui', 'pat', 'ext_api', 'import', 'git', 'ai', 'copy', 'restore'] as const;

// Matches /api/ext routes with or without SUB_PATH.
export const EXT_API_ROUTE_PATTERN = /\/api\/ext(\/|\?|$)/;

export const VALIDATION_WARNINGS_LOCALS_KEY = 'tj_app_validation_warnings';
export const VALIDATION_WARNINGS_HEADER = 'x-tooljet-validation-warnings';
export const VALIDATION_WARNINGS_BODY_KEY = 'validationWarnings';

export const MAX_EXPRESSION_LENGTH = 100_000;
