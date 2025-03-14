export enum FEATURE_KEY {
  GET = 'get',
  UPDATE = 'update',
  DELETE = 'delete',
  CREATE = 'create',
}

export enum INSTANCE_SETTINGS_TYPE {
  USER = 'user',
  SYSTEM = 'system',
}

export enum INSTANCE_SYSTEM_SETTINGS {
  ALLOWED_DOMAINS = 'ALLOWED_DOMAINS',
  ENABLE_SIGNUP = 'ENABLE_SIGNUP',
  ENABLE_WORKSPACE_LOGIN_CONFIGURATION = 'ENABLE_WORKSPACE_LOGIN_CONFIGURATION',
  AUTOMATIC_SSO_LOGIN = 'AUTOMATIC_SSO_LOGIN',
  CUSTOM_LOGOUT_URL = 'CUSTOM_LOGOUT_URL',

  //SMTP ENUMS
  SMTP_PORT = 'SMTP_PORT',
  SMTP_DOMAIN = 'SMTP_DOMAIN',
  SMTP_USERNAME = 'SMTP_USERNAME',
  SMTP_PASSWORD = 'SMTP_PASSWORD',
  SMTP_ENABLED = 'SMTP_ENABLED',
  SMTP_FROM_EMAIL = 'SMTP_FROM_EMAIL',
  SMTP_ENV_CONFIGURED = 'SMTP_ENV_CONFIGURED',
}

export enum INSTANCE_USER_SETTINGS {
  ALLOW_PERSONAL_WORKSPACE = 'ALLOW_PERSONAL_WORKSPACE',
  ENABLE_MULTIPLAYER_EDITING = 'ENABLE_MULTIPLAYER_EDITING',
  ENABLE_COMMENTS = 'ENABLE_COMMENTS',
}

export const INSTANCE_CONFIGS_DATA_TYPES = {
  TEXT: 'text',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  PASSWORD: 'password',
  TEXT_AREA: 'text_area',
};

export const INSTANCE_SETTINGS_ENCRYPTION_KEY = 'instance_settings';

export function getDefaultInstanceSettings() {
  return {
    [INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP]: process.env.DISABLE_SIGNUPS === 'false' ? 'true' : 'false',
    [INSTANCE_SYSTEM_SETTINGS.ENABLE_WORKSPACE_LOGIN_CONFIGURATION]: 'true',
    [INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE]: 'true',
    [INSTANCE_USER_SETTINGS.ENABLE_MULTIPLAYER_EDITING]:
      process.env.ENABLE_MULTIPLAYER_EDITING === 'true' ? 'true' : 'false',
    [INSTANCE_USER_SETTINGS.ENABLE_COMMENTS]: process.env.COMMENT_FEATURE_ENABLE === 'true' ? 'true' : 'false',
    [INSTANCE_SYSTEM_SETTINGS.SMTP_PORT]: process.env.SMTP_PORT,
    [INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN]: process.env.SMTP_DOMAIN,
    [INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME]: process.env.SMTP_USERNAME,
    [INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD]: process.env.SMTP_PASSWORD,
    [INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED]: process.env.SMTP_DISABLED === 'true' ? 'false' : 'true',
    [INSTANCE_SYSTEM_SETTINGS.SMTP_ENV_CONFIGURED]: 'true',
  };
}
