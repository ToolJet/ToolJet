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
  PAGE_REORDER = 'page_reorder',

  // Event actions
  EVENT_ADD = 'event_add',
  EVENT_UPDATE = 'event_update',
  EVENT_DELETE = 'event_delete',
  EVENT_REORDER = 'event_reorder',

  // Settings actions
  GLOBAL_SETTINGS_UPDATE = 'global_settings_update',
  PAGE_SETTINGS_UPDATE = 'page_settings_update',

  // Batch/bulk actions
  BATCH_UPDATE = 'batch_update',

  // AI-generated changes
  AI_CHANGE = 'ai_change',

  // History-specific actions
  HISTORY_RESTORE = 'history_restore',
  INITIAL_SNAPSHOT = 'initial_snapshot',
}

// Snapshot creation frequency: Every 10th change creates a complete state snapshot
// This means entries 1, 11, 21, 31, etc. are snapshots
// Entries 2-10, 12-20, 22-30, etc. are deltas (JSON patches)
export const SNAPSHOT_FREQUENCY = 10;

// Maximum visible entries in the UI history list
export const RETENTION_VISIBLE_LIMIT = 100;

// Maximum total entries before cleanup is triggered
// 110 entries = 11 complete snapshot groups (each group: 1 snapshot + 9 deltas)
// When entry 111 is created, the oldest complete group (entries 1-10) is deleted
// This ensures all remaining entries can be reconstructed from their base snapshots
export const RETENTION_BUFFER_LIMIT = 110;

export enum FEATURE_KEY {
  LIST_HISTORY = 'list_history',
  RESTORE_HISTORY = 'restore_history',
  UPDATE_DESCRIPTION = 'update_description',
  STREAM_HISTORY = 'stream_history',
}

export const MODULE_NAME = 'AppHistory';
