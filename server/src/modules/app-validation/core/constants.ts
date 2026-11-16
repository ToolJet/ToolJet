import type { ValidationMode, WriteSource } from '../types';

export const APP_VALIDATION_FAILED = 'APP_VALIDATION_FAILED';

export const VALIDATION_MODES = ['off', 'report', 'enforce'] as const;

export const WRITE_SOURCES = ['ui', 'pat', 'ext_api', 'import', 'git', 'ai', 'copy', 'restore'] as const;

// Change a source to 'enforce' here to start rejecting invalid data from it.
export const VALIDATION_MODE_BY_SOURCE: Record<WriteSource, ValidationMode> = {
  ui: 'report',
  pat: 'enforce',
  ext_api: 'report',
  import: 'report',
  git: 'report',
  // Reaches here via the AI-builder session's AI_BUILDER_API_SOURCE claim (EE mints it);
  // the EE server-side AI writes pass no source yet and resolve to 'ui'.
  ai: 'report',
  copy: 'report',
  restore: 'report',
};

// Matches /api/ext routes with or without SUB_PATH.
export const EXT_API_ROUTE_PATTERN = /\/api\/ext(\/|\?|$)/;

export const VALIDATION_WARNINGS_LOCALS_KEY = 'tj_app_validation_warnings';
export const VALIDATION_WARNINGS_HEADER = 'x-tooljet-validation-warnings';
export const VALIDATION_WARNINGS_BODY_KEY = 'validationWarnings';

export const MAX_EXPRESSION_LENGTH = 100_000;
