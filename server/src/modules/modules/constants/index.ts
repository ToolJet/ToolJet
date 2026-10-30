export enum FEATURE_KEY {
  CREATE_MODULE = 'create-module',
  DELETE_MODULE = 'delete-module',
  UPDATE_MODULE = 'update-module',
  IMPORT_MODULE = 'import-module',
  EXPORT_MODULE = 'export-module',
  CLONE_MODULE = 'clone-module',
}

/**
 * Audit log action types for module version operations.
 * Used by version/app services to override the default APP_* audit keys
 * when the operation targets a module.
 */
export const MODULE_VERSION_AUDIT_KEYS: Record<string, string> = {
  CREATE: 'MODULE_VERSION_CREATE',
  DELETE: 'MODULE_VERSION_DELETE',
  SAVE: 'MODULE_VERSION_SAVE',
  PROMOTE: 'MODULE_VERSION_PROMOTE',
  RELEASE: 'MODULE_VERSION_RELEASE',
};

/**
 * Audit log action types for query library query versions.
 * Passed as `actionType` in the audit-log request context by the library query lifecycle routes.
 */
export const LIBRARY_QUERY_VERSION_AUDIT_KEYS: Record<string, string> = {
  SAVE: 'LIBRARY_QUERY_VERSION_SAVE',
  CREATE_DRAFT: 'LIBRARY_QUERY_DRAFT_CREATE',
  DISCARD_DRAFT: 'LIBRARY_QUERY_DRAFT_DELETE',
  PROMOTE: 'LIBRARY_QUERY_VERSION_PROMOTE',
  RELEASE: 'LIBRARY_QUERY_VERSION_RELEASE',
  DELETE: 'LIBRARY_QUERY_VERSION_DELETE',
};
