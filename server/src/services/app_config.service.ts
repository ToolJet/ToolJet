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
      'DISABLE_SIGNUPS',
      'DISABLE_MULTI_WORKSPACE',
      'SSO_GOOGLE_OAUTH2_CLIENT_ID',
      'SSO_GIT_OAUTH2_CLIENT_ID',
      'SSO_GIT_OAUTH2_HOST',
      'SSO_DISABLE_SIGNUPS',
      'TOOLJET_HOST',
      'SUB_PATH',
    ];
  }

  fetchAllowedConfigFromEnv() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS.split(',').map((envVar) => envVar.trim());

    return whitelistedConfigVars;
  }

  async constructSSOConfigs() {
    const configs = await this.public_config();
    return {
      google: {
        enabled: !!configs?.SSO_GOOGLE_OAUTH2_CLIENT_ID,
        configs: {
          client_id: configs?.SSO_GOOGLE_OAUTH2_CLIENT_ID,
        },
      },
      git: {
        enabled: !!configs?.SSO_GIT_OAUTH2_CLIENT_ID,
        configs: {
          client_id: configs?.SSO_GIT_OAUTH2_CLIENT_ID,
          host_name: configs?.SSO_GIT_OAUTH2_HOST,
        },
      },
      form: {
        enable_sign_up: configs?.DISABLE_SIGNUPS !== 'true',
        enabled: true,
      },
    };
  }
}
