export enum FEATURE_KEY {
  CREATE_FOLDER = 'CREATE_FOLDER',
  UPDATE_FOLDER = 'UPDATE_FOLDER',
  DELETE_FOLDER = 'DELETE_FOLDER',
}

// Folder `type` value for data-source folders. App folders use APP_TYPES values
// ('front-end' / 'workflow' / 'module'); data sources are NOT an app type, so their folder type
// is defined here rather than polluting APP_TYPES (which drives app creation/versioning logic).
export const DATA_SOURCE_FOLDER_TYPE = 'data_source';
