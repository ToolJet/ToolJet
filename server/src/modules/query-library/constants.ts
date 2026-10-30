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
