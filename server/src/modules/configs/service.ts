import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { Injectable } from '@nestjs/common';
import { IConfigService } from './interfaces/IService';
import { InMemoryCacheService } from '@modules/inMemoryCache/in-memory-cache.service';

// Instance-wide (not per-user/per-org) settings + env vars — same short TTL rationale as the
// license-terms cache: coalesce the burst of bootstrap calls within one page load, not cache
// across an admin actually changing an instance setting.
const PUBLIC_CONFIG_CACHE_TTL_MS = 30_000;
const PUBLIC_CONFIG_CACHE_KEY = 'public_config';

@Injectable()
export class ConfigService implements IConfigService {
  constructor(
    protected instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly inMemoryCacheService: InMemoryCacheService
  ) {}
  async public_config() {
    const cached = this.inMemoryCacheService.get(PUBLIC_CONFIG_CACHE_KEY);
    if (cached) return cached;

    const configPromise = this.computePublicConfig();
    this.inMemoryCacheService.set(PUBLIC_CONFIG_CACHE_KEY, configPromise, PUBLIC_CONFIG_CACHE_TTL_MS);
    return configPromise;
  }

  private async computePublicConfig() {
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

    if (process.env.TOOLJET_EDITION === 'cloud') {
      publicConfigVars.ENABLE_MARKETPLACE_DEV_MODE = 'false';
    } else {
      publicConfigVars.ENABLE_MARKETPLACE_DEV_MODE = process.env.ENABLE_MARKETPLACE_DEV_MODE || 'false';
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
      'SSO_HUBSPOT_PORTAL_ID',
      'SSO_HUBSPOT_FORM_ID',
    ];
  }

  private fetchDefaultInstanceConfig() {
    return [
      INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE,
      INSTANCE_USER_SETTINGS.ENABLE_MULTIPLAYER_EDITING,
      INSTANCE_USER_SETTINGS.ENABLE_COMMENTS,
      INSTANCE_SYSTEM_SETTINGS.PASSWORD_ALLOWED_DOMAINS,
      INSTANCE_SYSTEM_SETTINGS.PASSWORD_RESTRICTED_DOMAINS,
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
