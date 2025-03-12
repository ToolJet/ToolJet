// export enum TOOLJET_RESOURCE {
//   APP = 'App',
//   ORGANIZATIONS = 'Organization',
//   USER = 'User',
//   PLUGINS = 'Plugins',
//   GLOBAL_DATA_SOURCE = 'GlobalDataSource',
//   DATA_QUERY = 'DataQueries',
//   THREAD = 'Thread',
//   COMMENT = 'Comment',
//   FOLDER = 'Folder',
//   ORGANIZATION_VARIABLE = 'OrgEnvironmentVariable',
//   ORGANIZATION_CONSTANT = 'OrganizationConstant',
// }

export enum APP_RESOURCE_ACTIONS {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
  CLONE = 'clone',
  EXPORT = 'export',
  IMPORT = 'import',
  VIEW = 'view',
  EDIT = 'edit',
  VERSIONS_CREATE = 'createVersions',
  VERSION_UPDATE = 'updateVersions',
  VERSION_DELETE = 'deleteVersions',
  VERSION_READ = 'readVersions',
  ENV_CREATE = 'createEnvironments',
  ENV_UPDATE = 'updateEnvironments',
  ENV_DELETE = 'deleteEnvironments',
  ENV_READ = 'fetchEnvironments',
}
export enum GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS {
  CREATE = 'create',
  DELETE = 'delete',
  READ = 'read',
  UPDATE = 'update',
}
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
export enum ORGANIZATION_RESOURCE_ACTIONS {
  USER_INVITE = 'inviteUsers',
  USER_ARCHIVE = 'archiveUser',
  EDIT_ROLE = 'changeRole',
  ACCESS_PERMISSIONS = 'accessGroupPermission',
  UPDATE = 'update',
  VIEW_ALL_USERS = 'viewAllUsers',
  UPDATE_USERS = 'updateUser',
  CONFIGURE_GIT_SYNC = 'ConfigureGitSync',
}
export enum COMMENT_RESOURCE_ACTION {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
}
export enum THREAD_RESOURCE_ACTION {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  READ = 'read',
}

export enum PLUGIN_RESOURCE_ACTION {
  INSTALL = 'install',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum WHITE_LABELS_RESOURCE_ACTIONS {
  CREATE = 'create',
  DELETE = 'delete',
  UPDATE = 'update',
}
