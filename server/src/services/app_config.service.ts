import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  async public_config() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS
      ? this.fetchAllowedConfigFromEnv()
      : this.fetchDefaultConfig();

    const mapEntries = await Promise.all(
      whitelistedConfigVars.map((envVar) => [envVar, process.env[envVar]] as [string, string])
    );

    return Object.fromEntries(mapEntries);
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

  fetchAllowedConfigFromEnv() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS.split(',').map((envVar) => envVar.trim());

    return whitelistedConfigVars;
  }
}
