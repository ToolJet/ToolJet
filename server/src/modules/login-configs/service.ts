import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { ConfigService } from '@nestjs/config';
import { LoginConfigsUtilService } from './util.service';
import { ILoginConfigsService } from './interfaces/IService';
import { SSOConfigsRepository } from './repository';
import { EncryptionService } from '@modules/encryption/service';
import { OrganizationRepository } from '@modules/organizations/repository';
import { ConfigScope, SSOType } from '@entities/sso_config.entity';
import { cleanObject } from '@helpers/utils.helper';
import { OrganizationConfigsUpdateDto } from './dto';
import { SsoConfigOidcGroupSyncRepository } from './oidc-group-sync.repository';

@Injectable()
export class LoginConfigsService implements ILoginConfigsService {
  constructor(
    protected ssoConfigsRepository: SSOConfigsRepository,
    protected organizationsRepository: OrganizationRepository,
    protected configService: ConfigService,
    protected encryptionService: EncryptionService,
    protected loginConfigsUtilService: LoginConfigsUtilService,
    protected oidcGroupSyncRepository: SsoConfigOidcGroupSyncRepository
  ) {}

  async getProcessedOrganizationDetails(organizationId: string) {
    const existingOrganizationId = (await this.organizationsRepository.getSingleOrganization())?.id;
    if (!existingOrganizationId) {
      throw new NotFoundException();
    }
    if (!organizationId) {
      const result = await this.loginConfigsUtilService.constructSSOConfigs();
      return result;
    }

    const result = await this.loginConfigsUtilService.fetchOrganizationDetails(organizationId, [true], true, true);
    if (!result) throw new NotFoundException();

    return result;
  }

  async getProcessedOrganizationConfigs(organizationId: string) {
    const result = await this.loginConfigsUtilService.fetchOrganizationDetails(organizationId);
    const instanceConfigs = await this.loginConfigsUtilService.constructSSOConfigs();

    const decamelizedOrganizationDetails = decamelizeKeys(result) as any;

    const decamelizedInstanceConfigs = decamelizeKeys(instanceConfigs);

    return {
      organization_details: decamelizedOrganizationDetails,
      instance_configs: decamelizedInstanceConfigs,
    };
  }

  async updateOrganizationSSOConfigs(organizationId: string, params: any): Promise<any> {
    const { type, configs, enabled, oidcGroupSyncs } = params;

    if (
      !(type && [SSOType.GOOGLE, SSOType.GIT, SSOType.FORM, SSOType.OPENID, SSOType.SAML, SSOType.LDAP].includes(type))
    ) {
      throw new BadRequestException('Invalid SSO type');
    }

    await this.loginConfigsUtilService.encryptSecret(configs);

    const ssoConfig = await this.ssoConfigsRepository.createOrUpdateSSOConfig({
      sso: type,
      configs,
      enabled,
      organizationId,
      configScope: ConfigScope.ORGANIZATION,
    });

    if (oidcGroupSyncs) {
      await this.oidcGroupSyncRepository.createOrUpdateGroupSync(oidcGroupSyncs, ssoConfig.id);
    }

    return ssoConfig;
  }

  async updateGeneralOrganizationConfigs(organizationId: string, params: OrganizationConfigsUpdateDto) {
    const { domain, enableSignUp, inheritSSO, automaticSsoLogin } = params;

    const updatableParams = {
      domain,
      enableSignUp,
      inheritSSO,
      automaticSsoLogin,
    };

    if (automaticSsoLogin === true) {
      const result = await this.loginConfigsUtilService.fetchOrganizationDetails(organizationId, [true], true, true);
      let enabledSSOCount = 0;
      let isFormLoginDisabled = true;

      Object.keys(result).forEach((ssoType) => {
        const ssoConfig = result[ssoType];

        if (Object.values(SSOType).includes(ssoConfig?.sso) && ssoConfig?.enabled) {
          // Check if the SSO is enabled
          if (ssoType !== SSOType.FORM) {
            enabledSSOCount += 1;
          } else {
            isFormLoginDisabled = false;
          }
        }
      });
      if (!(isFormLoginDisabled && enabledSSOCount == 1)) {
        throw new Error(
          'Automatic SSO login can only be enabled if password login is disabled and there is one SSO enabled'
        );
      }
    }

    // removing keys with undefined values
    cleanObject(updatableParams);
    await this.organizationsRepository.updateOne(organizationId, updatableParams);
  }

  async getInstanceSSOConfigs() {
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
      enableSignUp: this.configService.get<string>('DISABLE_SIGNUPS') !== 'true',
    };
  }

  async updateInstanceSSOConfigs(params: any) {
    throw new Error('Method not implemented.');
  }

  public async validateAndUpdateSystemParams(params: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
