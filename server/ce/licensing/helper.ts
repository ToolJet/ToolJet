export enum LICENSE_FIELD {
  IS_EXPIRED = 'expired',
  APP_COUNT = 'appCount',
  TABLE_COUNT = 'tableCount',
  TOTAL_USERS = 'usersCount',
  EDITORS = 'editorsCount',
  VIEWERS = 'viewersCount',
  OIDC = 'oidcEnabled',
  LDAP = 'ldapEnabled',
  SAML = 'samlEnabled',
  CUSTOM_STYLE = 'customStylingEnabled',
  WHITE_LABEL = 'whitelabellingEnabled',
  CUSTOM_THEMES = 'customThemeEnabled',
  AUDIT_LOGS = 'auditLogsEnabled',
  MAX_DURATION_FOR_AUDIT_LOGS = 'maxDaysForAuditLogs',
  MULTI_ENVIRONMENT = 'multiEnvironmentEnabled',
  UPDATED_AT = 'updatedAt',
  ALL = 'all',
  USER = 'allUsers',
  VALID = 'valid',
  WORKSPACES = 'workspaces',
  FEATURES = 'features',
  DOMAINS = 'domains',
  STATUS = 'status',
  META = 'metadata',
  WORKFLOWS = 'workflows',
  GIT_SYNC = 'gitSyncEnabled',
}

export enum LICENSE_LIMITS_LABEL {
  //Users
  USERS = 'Total Users',
  SUPERADMINS = 'Superadmins',
  EDIT_USERS = 'Builders',
  END_USERS = 'End Users',
  SUPERADMIN_USERS = 'Super Admins',

  //Apps
  APPS = 'Apps',
  WORKFLOWS = 'Workflows',

  //Workspaces
  WORKSPACES = 'Workspaces',

  //Tables
  TABLES = 'Tables',
}

export enum LICENSE_TYPE {
  BASIC = 'basic',
  TRIAL = 'trial',
  ENTERPRISE = 'enterprise',
  BUSINESS = 'business',
}

export enum LICENSE_LIMIT {
  UNLIMITED = 'UNLIMITED',
}
