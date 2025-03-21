export enum DataBaseConstraints {
  FOLDER_NAME_UNIQUE = 'folder_name_organization_id_unique',
  APP_NAME_UNIQUE = 'app_name_organization_id_unique',
  APP_SLUG_UNIQUE = 'UQ_35eef0fb1f3f2b435b8b6d82ba0',
  WORKSPACE_NAME_UNIQUE = 'name_organizations_unique',
  WORKSPACE_SLUG_UNIQUE = 'slug_organizations_unique',
  USER_ORGANIZATION_UNIQUE = 'user_organization_unique',
  APP_VERSION_NAME_UNIQUE = 'name_app_id_app_versions_unique',
  CONFIG_SCOPE_ORGANIZATION_SSO_UNIQUE = 'config_scope_organization_sso_unique',
  CONFIG_SCOPE_INSTANCE_SSO_UNIQUE = 'config_scope_sso_unique',
  GROUP_NAME_UNIQUE = 'group_name_organization_id_unique',
  GROUP_USER_UNIQUE = 'user_group_unique',
  GRANULAR_PERMISSIONS_NAME_UNIQUE = 'granular_permissions_name_unique',
}
