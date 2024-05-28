export enum TOOLJET_RESOURCE {
  APP = 'App',
  ORGANIZATIONS = 'Organization',
  USER = 'User',
  PLUGINS = 'Plugins',
  GLOBAL_DATA_SOURCE = 'GlobalDataSource',
  DATA_QUERY = 'DataQueries',
  THREAD = 'Thread',
  COMMENT = 'Comment',
  FOLDER = 'Folder',
  ORGANIZATION_VARIABLE = 'OrgEnvironmentVariable',
  ORGANIZATION_CONSTANT = 'OrganizationConstant',
}

export enum APP_RESOURCE_ACTIONS {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  CLONE = 'clone',
  IMPORT = 'import',
  VIEW = 'view',
  EDIT = 'edit',
  VERSIONS_CREATE = 'createVersions',
  VERSION_UPDATE = 'deleteVersions',
  VERSION_DELETE = 'updateVersions',
  VERSION_READ = 'readßVersions',
}
export enum GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS {}
export enum LOCAL_DATA_SOURCE_RESOURCE_ACTIONS {
  CREATE = 'create',
  DELETE = 'delete',
  READ = 'read',
  UPDATE = 'update',
}
export enum DATA_QUERIES_RESOURCE_ACTIONS {
  CREATE = 'create',
  DELETE = 'delete',
  READ = 'read',
  UPDATE = 'update',
  RUN = 'run',
}
export enum ORGANIZATION_CONSTANT_RESOURCE_ACTIONS {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
export enum ORGANIZATION_VARIABLE_ACTIONS {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
export enum USER_RESOURCE_ACTIONS {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
}
export enum ORGANIZATION_RESOURCE_ACTIONS {}
export enum FOLDER_RESOURCE_ACTION {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
