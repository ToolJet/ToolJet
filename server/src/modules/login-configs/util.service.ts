import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '@modules/encryption/service';
import { DeepPartial } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { OrganizationRepository } from '@modules/organizations/repository';
import { ILoginConfigsUtilService } from './interfaces/IUtilsService';
import { SSOConfigsRepository } from './repository';
import { SSOConfigs } from 'src/entities/sso_config.entity';

@Injectable()
export class LoginConfigsUtilService implements ILoginConfigsUtilService {
  constructor(
    protected configService: ConfigService,
    protected encryptionService: EncryptionService,
    protected organizationRepository: OrganizationRepository,
    protected ssoConfigsRepository: SSOConfigsRepository
  ) {}

  async constructSSOConfigs(organizationId?: string) {
    return {
      google: {
        enabled: !!this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
        configs: {
          client_id: this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
        },
      },
      git: {
        enabled: !!this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
        configs: {
          client_id: this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
          host_name: this.configService.get<string>('SSO_GIT_OAUTH2_HOST'),
        },
      },
      form: {
        enable_sign_up: this.configService.get<string>('DISABLE_SIGNUPS') !== 'true',
        enabled: true,
      },
      enableSignUp: this.configService.get<string>('SSO_DISABLE_SIGNUPS') !== 'true',
    };
  }

  async fetchOrganizationDetails(
    organizationIdOrSlug: string,
    statusList?: Array<boolean>,
    isHideSensitiveData?: boolean,
    addInstanceLevelSSO?: boolean,
    allowArchivedWorkspace: boolean = false
  ): Promise<DeepPartial<Organization>> {
    const result: Organization = await this.organizationRepository.fetchOrganizationWithSSOConfigs(
      organizationIdOrSlug,
      statusList,
      allowArchivedWorkspace
    );
    if (!result) return;

    if (addInstanceLevelSSO && result.inheritSSO) {
      await this.addInstanceLevelSSOConfigs(result);
    }

    if (!isHideSensitiveData) {
      if (!(result?.ssoConfigs?.length > 0)) {
        return;
      }
      for (const sso of result?.ssoConfigs) {
        await this.decryptSecret(sso?.configs);
      }
      return result;
    }

    const filteredConfigs = this.hideSSOSensitiveData(result?.ssoConfigs, result?.name, result.id);
    return { ...filteredConfigs, enableSignUp: result.enableSignUp, automaticSsoLogin: result.automaticSsoLogin };
  }

  async addInstanceLevelSSOConfigs(result: DeepPartial<Organization>) {
    if (
      this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID') &&
      !result.ssoConfigs?.some((config) => config.sso === 'google')
    ) {
      if (!result.ssoConfigs) {
        result.ssoConfigs = [];
      }
      result.ssoConfigs.push({
        sso: 'google',
        enabled: true,
        configs: {
          clientId: this.configService.get<string>('SSO_GOOGLE_OAUTH2_CLIENT_ID'),
        },
      } as SSOConfigs);
    }

    if (
      this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID') &&
      !result.ssoConfigs?.some((config) => config.sso === 'git')
    ) {
      if (!result.ssoConfigs) {
        result.ssoConfigs = [];
      }
      result.ssoConfigs.push({
        sso: 'git',
        enabled: true,
        configs: {
          clientId: this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_ID'),
          clientSecret: await this.encryptionService.encryptColumnValue(
            'ssoConfigs',
            'clientSecret',
            this.configService.get<string>('SSO_GIT_OAUTH2_CLIENT_SECRET')
          ),
          hostName: this.configService.get<string>('SSO_GIT_OAUTH2_HOST'),
        },
      } as SSOConfigs);
    }
  }

  hideSSOSensitiveData(ssoConfigs: DeepPartial<SSOConfigs>[], organizationName: string, organizationId: string): any {
    const configs = { name: organizationName, id: organizationId };
    if (ssoConfigs?.length > 0) {
      for (const config of ssoConfigs) {
        const configId = config['id'];
        const configScope = config['configScope'];
        delete config['id'];
        delete config['organizationId'];
        delete config['createdAt'];
        delete config['updatedAt'];

        // Handle OIDC as array only for organization-level (multi-tenant)
        // Instance-level OIDC should be single object
        if (config.sso === 'openid' && configScope === 'organization') {
          if (!configs['openid']) {
            configs['openid'] = [];
          }
          configs['openid'].push(this.buildConfigs(config, configId));
        } else {
          // Other SSO types and instance-level OIDC remain as single object
          configs[config.sso] = this.buildConfigs(config, configId);
        }
      }
    }
    return configs;
  }

  public buildConfigs(config: any, configId: string) {
    if (!config) return config;
    return {
      ...config,
      configs: {
        ...(config?.configs || {}),
        ...(config?.configs ? { clientSecret: '' } : {}),
      },
      configId,
    };
  }

  async encryptSecret(configs) {
    if (!configs || typeof configs !== 'object') return configs;
    await Promise.all(
      Object.keys(configs).map(async (key) => {
        if (key.toLowerCase().includes('secret')) {
          if (configs[key]) {
            configs[key] = await this.encryptionService.encryptColumnValue('ssoConfigs', key, configs[key]);
          }
        }
      })
    );
  }

  async decryptSecret(configs) {
    if (!configs || typeof configs !== 'object') return configs;
    await Promise.all(
      Object.keys(configs).map(async (key) => {
        if (key.toLowerCase().includes('secret')) {
          if (configs[key]) {
            configs[key] = await this.encryptionService.decryptColumnValue('ssoConfigs', key, configs[key]);
          }
        }
      })
    );
  }

  async getConfigs(id: string): Promise<SSOConfigs> {
    const result = await this.ssoConfigsRepository.getConfigs(id);
    await this.decryptSecret(result?.configs);
    return result;
  }

  async getInstanceSSOConfigs(decryptSensitiveData = true): Promise<SSOConfigs[]> {
    throw new Error('Method not implemented.');
  }

  async updateInstanceSSOConfigs(params: any): Promise<SSOConfigs> {
    throw new Error('Method not implemented.');
  }

  async validateAndUpdateSystemParams(params: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  // Loop through all SSO config entries and remove any that are disabled
  removeDisabledSsoConfigs(result) {
    if (!result || Object.keys(result).length === 0) {
      return result;
    }

    for (const key in result) {
      // Handle OIDC as array
      if (key === 'openid' && Array.isArray(result[key])) {
        // Filter out disabled configs
        result[key] = result[key].filter((config) => config.enabled !== false);
        // Remove the key if no enabled configs remain
        if (result[key].length === 0) {
          delete result[key];
        }
      } else if (result[key]?.enabled === false) {
        // Other SSO types - remove if disabled
        delete result[key];
      }
    }

    return result;
  }
}
