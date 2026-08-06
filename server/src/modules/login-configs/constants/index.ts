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
  // One feature for all 3 workspace-level env-config providers (was SAVE_OIDC_ENV_CONFIGS /
  // SAVE_SAML_ENV_CONFIGS / SAVE_LDAP_ENV_CONFIGS) and one for the instance-level route (was
  // SAVE_INSTANCE_OIDC_ENV_CONFIGS) — the guard only checks WORKSPACE_ENV (common to all
  // providers); the EE service re-checks the specific provider's own license internally, same
  // as before.
  SAVE_ENV_CONFIGS = 'save_env_configs',
  SAVE_INSTANCE_ENV_CONFIGS = 'save_instance_env_configs',
}

/** Valid values for the `:provider` route param on the workspace-level env-config routes. */
export enum SsoEnvProvider {
  OIDC = 'oidc',
  SAML = 'saml',
  LDAP = 'ldap',
}

/** Instance-level env config only exists for OIDC today — no instance SAML/LDAP in the product. */
export enum InstanceSsoEnvProvider {
  OIDC = 'oidc',
}
