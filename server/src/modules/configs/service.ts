import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { Injectable } from '@nestjs/common';
import { IConfigService } from './interfaces/IService';

@Injectable()
export class ConfigService implements IConfigService {
  constructor(protected instanceSettingsUtilService: InstanceSettingsUtilService) {}
  async public_config() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS
      ? this.fetchAllowedConfigFromEnv()
      : this.fetchDefaultConfig();

    const mapEntries = await Promise.all(
      whitelistedConfigVars.map((envVar) => [envVar, process.env[envVar]] as [string, string])
    );

    const instanceConfigs = await this.instanceSettingsUtilService.getSettings(this.fetchDefaultInstanceConfig());
    const publicConfigVars = { ...instanceConfigs, ...Object.fromEntries(mapEntries) };

    if (publicConfigVars?.ENABLE_WORKFLOWS_FEATURE === undefined) {
      publicConfigVars.ENABLE_WORKFLOWS_FEATURE = 'true';
    }
    return publicConfigVars;
  }

  private fetchDefaultConfig() {
    return [
      'TOOLJET_SERVER_URL',
      'RELEASE_VERSION',
      'GOOGLE_MAPS_API_KEY',
      'APM_VENDOR',
      'SENTRY_DNS',
      'SENTRY_DEBUG',
      'TOOLJET_HOST',
      'SUB_PATH',
      'LANGUAGE',
      'ENABLE_PRIVATE_APP_EMBED',
      'DISABLE_WEBHOOKS',
      'HIDE_ACCOUNT_SETUP_LINK',
      'ENABLE_WORKFLOW_SCHEDULING',
    ];
  }

  private fetchDefaultInstanceConfig() {
    return [
      INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE,
      INSTANCE_USER_SETTINGS.ENABLE_MULTIPLAYER_EDITING,
      INSTANCE_USER_SETTINGS.ENABLE_COMMENTS,
      INSTANCE_SYSTEM_SETTINGS.ALLOWED_DOMAINS,
      INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP,
      INSTANCE_SYSTEM_SETTINGS.ENABLE_WORKSPACE_LOGIN_CONFIGURATION,
      INSTANCE_SYSTEM_SETTINGS.AUTOMATIC_SSO_LOGIN,
      INSTANCE_SYSTEM_SETTINGS.CUSTOM_LOGOUT_URL,
    ];
  }

  private fetchAllowedConfigFromEnv() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS.split(',').map((envVar) => envVar.trim());

    return whitelistedConfigVars;
  }
}
