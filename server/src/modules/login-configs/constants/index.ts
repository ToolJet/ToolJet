export enum FEATURE_KEY {
  GET_ORGANIZATION_CONFIGS = 'get_organization_configs',
  GET_PUBLIC_CONFIGS = 'get_public_configs',
  UPDATE_ORGANIZATION_SSO = 'update_organization_sso',
  DELETE_ORGANIZATION_SSO = 'delete_organization_sso',
  UPDATE_ORGANIZATION_GENERAL_CONFIGS = 'update_organization_general_configs',
  UPDATE_INSTANCE_SSO = 'update_instance_sso',
  UPDATE_INSTANCE_GENERAL_CONFIGS = 'update_instance_general_configs',
  GET_INSTANCE_SSO = 'get_instance_sso',
  INSTANCE_SSO_INHERIT = 'instance_sso_inherit',
  SAVE_ENV_CONFIGS = 'save_env_configs',
  SAVE_INSTANCE_ENV_CONFIGS = 'save_instance_env_configs',
}

export enum SsoEnvProvider {
  OIDC = 'oidc',
  SAML = 'saml',
  LDAP = 'ldap',
}

export enum InstanceSsoEnvProvider {
  OIDC = 'oidc',
}
