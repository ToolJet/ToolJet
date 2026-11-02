export enum FEATURE_KEY {
  LIST = 'list',
  CREATE = 'create',
  UPDATE = 'update',
  CHANGE_DATA_SOURCE = 'change-data-source',
  DELETE = 'delete',
  LIST_FOLDERS = 'list-folders',
  CREATE_FOLDER = 'create-folder',
  RENAME_FOLDER = 'rename-folder',
  DELETE_FOLDER = 'delete-folder',
}
export const LIBRARY_QUERY_AUDIT_KEYS = {
  CREATE: 'LIBRARY_QUERY_CREATE',
  UPDATE: 'LIBRARY_QUERY_UPDATE',
  DELETE: 'LIBRARY_QUERY_DELETE',
} as const;
// Audit log action types for library query versions and drafts, set by the lifecycle routes.
export const LIBRARY_QUERY_VERSION_AUDIT_KEYS = {
  SAVE: 'LIBRARY_QUERY_VERSION_SAVE',
  CREATE_DRAFT: 'LIBRARY_QUERY_DRAFT_CREATE',
  DISCARD_DRAFT: 'LIBRARY_QUERY_DRAFT_DELETE',
  PROMOTE: 'LIBRARY_QUERY_VERSION_PROMOTE',
  RELEASE: 'LIBRARY_QUERY_VERSION_RELEASE',
  DELETE: 'LIBRARY_QUERY_VERSION_DELETE',
} as const;
