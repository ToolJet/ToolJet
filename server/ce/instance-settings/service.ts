import { Injectable } from '@nestjs/common';

enum INSTANCE_SYSTEM_SETTINGS {
  WHITE_LABEL_LOGO = 'WHITE_LABEL_LOGO',
  WHITE_LABEL_TEXT = 'WHITE_LABEL_TEXT',
  WHITE_LABEL_FAVICON = 'WHITE_LABEL_FAVICON',
  ALLOWED_DOMAINS = 'ALLOWED_DOMAINS',
  ENABLE_SIGNUP = 'ENABLE_SIGNUP',
  ENABLE_WORKSPACE_LOGIN_CONFIGURATION = 'ENABLE_WORKSPACE_LOGIN_CONFIGURATION',

  //SMTP ENUMS
  SMTP_PORT = 'SMTP_PORT',
  SMTP_DOMAIN = 'SMTP_DOMAIN',
  SMTP_USERNAME = 'SMTP_USERNAME',
  SMTP_PASSWORD = 'SMTP_PASSWORD',
  SMTP_ENABLED = 'SMTP_ENABLED',
  SMTP_FROM_EMAIL = 'SMTP_FROM_EMAIL',
}

enum INSTANCE_USER_SETTINGS {
  ALLOW_PERSONAL_WORKSPACE = 'ALLOW_PERSONAL_WORKSPACE',
  ENABLE_MULTIPLAYER_EDITING = 'ENABLE_MULTIPLAYER_EDITING',
  ENABLE_COMMENTS = 'ENABLE_COMMENTS',
}

@Injectable()
export class InstanceSettingsService {
  async getSettings(key?: string | string[], getAllData = false, type?: any): Promise<any> {
    const defaultInstanceSettings = {
      [INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP]: process.env.SSO_DISABLE_SIGNUPS,
      [INSTANCE_SYSTEM_SETTINGS.ENABLE_WORKSPACE_LOGIN_CONFIGURATION]: 'true',
      [INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE]: 'true',
      [INSTANCE_USER_SETTINGS.ENABLE_MULTIPLAYER_EDITING]: process.env.ENABLE_MULTIPLAYER_EDITING,
      [INSTANCE_USER_SETTINGS.ENABLE_COMMENTS]: process.env.COMMENT_FEATURE_ENABLE,
      [INSTANCE_SYSTEM_SETTINGS.SMTP_PORT]: process.env.SMTP_PORT,
      [INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN]: process.env.SMTP_DOMAIN,
      [INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME]: process.env.SMTP_USERNAME,
      [INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD]: process.env.SMTP_PASSWORD,
      [INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED]: process.env.SMTP_ENABLED,
      [INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL]: process.env.DEFAULT_FROM_EMAIL,
    };

    let settings = Object.keys(defaultInstanceSettings)
      .filter((e) => (Array.isArray(key) ? key.includes(e) : key === e))
      .map((e) => ({ key: e, value: defaultInstanceSettings[e] }));

    if (!settings) {
      settings = [];
    }
    (Array.isArray(key) ? key : [key]).forEach((s) => {
      if (!settings.some((e) => e.key === s)) {
        // Key is not included on settings, adding empty value
        settings.push({ key: s, value: null });
      }
    });

    const instanceConfigs = {};
    settings?.forEach((config) => {
      instanceConfigs[config.key] = getAllData ? config : config.value;
    });

    const res = Array.isArray(key) ? instanceConfigs : instanceConfigs[key];
    return res;
  }
}
