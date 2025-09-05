export enum HISTORY_TYPE {
  SNAPSHOT = 'snapshot',
  DELTA = 'delta',
}

export enum ACTION_TYPE {
  // Component actions
  COMPONENT_ADD = 'component_add',
  COMPONENT_UPDATE = 'component_update',
  COMPONENT_DELETE = 'component_delete',

  // Query actions
  QUERY_ADD = 'query_add',
  QUERY_UPDATE = 'query_update',
  QUERY_DELETE = 'query_delete',

  // Page actions
  PAGE_ADD = 'page_add',
  PAGE_UPDATE = 'page_update',
  PAGE_DELETE = 'page_delete',

  // Batch/bulk actions
  BATCH_UPDATE = 'batch_update',

  // AI-generated changes
  AI_CHANGE = 'ai_change',

  // History-specific actions
  HISTORY_RESTORE = 'history_restore',
}

export const SNAPSHOT_FREQUENCY = 10;
export const RETENTION_VISIBLE_LIMIT = 100;
export const RETENTION_INTERNAL_BUFFER = 109;

export enum FEATURE_KEY {
  LIST_HISTORY = 'list_history',
  GET_HISTORY_ENTRY = 'get_history_entry',
  RESTORE_HISTORY = 'restore_history',
  UPDATE_DESCRIPTION = 'update_description',
}

export const MODULE_NAME = 'AppHistory';
