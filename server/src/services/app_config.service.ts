import { Injectable } from '@nestjs/common';
import { InstanceSettingsService } from './instance_settings.service';
import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';

@Injectable()
export class AppConfigService {
  constructor(private instanceSettingsService: InstanceSettingsService) {}
  async public_config() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS
      ? this.fetchAllowedConfigFromEnv()
      : this.fetchDefaultConfig();

    const mapEntries = await Promise.all(
      whitelistedConfigVars.map((envVar) => [envVar, process.env[envVar]] as [string, string])
    );

    const instanceConfigs = await this.instanceSettingsService.getSettings(this.fetchDefaultInstanceConfig());
    const publicConfigVars = { ...instanceConfigs, ...Object.fromEntries(mapEntries) };

    if (publicConfigVars?.ENABLE_WORKFLOWS_FEATURE === undefined) {
      publicConfigVars.ENABLE_WORKFLOWS_FEATURE = 'true';
    }
    return publicConfigVars;
  }

  fetchDefaultConfig() {
    return [
      'TOOLJET_SERVER_URL',
      'RELEASE_VERSION',
      'GOOGLE_MAPS_API_KEY',
      'APM_VENDOR',
      'SENTRY_DNS',
      'SENTRY_DEBUG',
      'TOOLJET_HOST',
      'SUB_PATH',
      'ENABLE_MARKETPLACE_FEATURE',
      'ENABLE_WORKFLOWS_FEATURE',
      'ENABLE_TOOLJET_DB',
      'LANGUAGE',
      'ENABLE_PRIVATE_APP_EMBED',
    ];
  }

  fetchDefaultInstanceConfig() {
    return [
      INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE,
      INSTANCE_USER_SETTINGS.ENABLE_MULTIPLAYER_EDITING,
      INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_LOGO,
      INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_TEXT,
      INSTANCE_SYSTEM_SETTINGS.WHITE_LABEL_FAVICON,
    ];
  }

  fetchAllowedConfigFromEnv() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS.split(',').map((envVar) => envVar.trim());

    return whitelistedConfigVars;
  }
}
