import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  constructor() {}

  async public_config() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS
      ? this.fetchAllowedConfigFromEnv()
      : this.fetchDefaultConfig();

    const mapEntries = await Promise.all(
      whitelistedConfigVars.map(
        (envVar) => [envVar, process.env[envVar]] as [string, string],
      ),
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
    ];
  }

  fetchAllowedConfigFromEnv() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS.split(
      ',',
    ).map((envVar) => envVar.trim());

    return whitelistedConfigVars;
  }
}
