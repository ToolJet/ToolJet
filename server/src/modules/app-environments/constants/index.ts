export enum AppEnvironmentActions {
  VERSION_DELETED = 'version_deleted',
  ENVIROMENT_CHANGED = 'environment_changed',
}

export enum FEATURE_KEY {
  INIT = 'INIT', // For the init method
  POST_ACTION = 'POST_ACTION', // For the environmentActions method
  GET_ALL = 'GET_ALL', // For the index method (fetching all environments)
  GET_DEFAULT = 'GET_DEFAULT', // For the getDefaultEnvironment method
  GET_VERSIONS_BY_ENVIRONMENT = 'GET_VERSIONS_BY_ENVIRONMENT', // For the getVersionsByEnvironment method
  CREATE = 'CREATE', // For the create method
  UPDATE = 'UPDATE', // For the update method
  DELETE = 'DELETE', // For the delete method
  GET_BY_ID = 'GET_BY_ID', // For the getEnvironmentById method
}
