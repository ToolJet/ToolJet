export enum FEATURE_KEY {
  CREATE = 'create',
  GET = 'get',
  UPDATE = 'update',
  DELETE = 'delete',
  UPDATE_ONE = 'updateOne',
  UPDATE_DATA_SOURCE = 'updateDataSource',
  RUN_VIEWER = 'runViewer',
  RUN_EDITOR = 'runEditor',
  PREVIEW = 'preview',
  LIST_TABLES = 'listTables',
}

// ToolJet-synthesized query error kinds (QueryError.data.type); frontend mirrors these
export const TJ_QUERY_ERROR_TYPE = {
  UNAUTHORIZED: 'tj-401', // app-level Query Access denied
  FORBIDDEN: 'tj-403', // data-source query-run restricted
} as const;
