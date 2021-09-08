import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  constructor() {}

  async public_config() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS
      ? this.fetchAllowedConfigFromEnv()
      : this.fetchDefaultConfig();

    const mapEntries = await Promise.all(whitelistedConfigVars.map(
      (envVar) => [envVar, process.env[envVar]] as [string, string],
    ));

    return Object.fromEntries(mapEntries);
  }

  fetchDefaultConfig() {
    return ['GOOGLE_MAPS_API_KEY']
  }

  fetchAllowedConfigFromEnv() {
    const whitelistedConfigVars = process.env.ALLOWED_CLIENT_CONFIG_VARS.split(
      ',',
    ).map((envVar) => envVar.trim());

    return whitelistedConfigVars;
  }
}
