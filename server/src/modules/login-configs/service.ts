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
import { User } from '@entities/user.entity';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { RequestContext } from '@modules/request-context/service';

@Injectable()
export class LoginConfigsService implements ILoginConfigsService {
  constructor(
    protected ssoConfigsRepository: SSOConfigsRepository,
    protected organizationsRepository: OrganizationRepository,
    protected configService: ConfigService,
    protected encryptionService: EncryptionService,
    protected loginConfigsUtilService: LoginConfigsUtilService
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

  async updateOrganizationSSOConfigs(user: User, params: any): Promise<any> {
    const organizationId = user.organizationId;
    const { type, configs, enabled } = params;

    if (
      !(type && [SSOType.GOOGLE, SSOType.GIT, SSOType.FORM, SSOType.OPENID, SSOType.SAML, SSOType.LDAP].includes(type))
    ) {
      throw new BadRequestException('Invalid SSO type');
    }

    await this.loginConfigsUtilService.encryptSecret(configs);
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    //SSO_UPDATE audit
    const auditLogsData = {
      userId: user.id,
      organizationId: organizationId,
      resourceId: organizationId,
      resourceName: organization.name,
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);

    return await this.ssoConfigsRepository.createOrUpdateSSOConfig({
      sso: type,
      configs,
      enabled,
      organizationId,
      configScope: ConfigScope.ORGANIZATION,
    });
  }

  async updateGeneralOrganizationConfigs(user: User, params: OrganizationConfigsUpdateDto) {
    const organizationId = user.organizationId;
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
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    await this.organizationsRepository.updateOne(organizationId, updatableParams);

    //WORKSPACE_LOGIN_SETTINGS_UPDATE audit
    const auditLogsData = {
      userId: user.id,
      organizationId: organizationId,
      resourceId: organizationId,
      resourceName: organization.name,
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
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

  public async validateAndUpdateSystemParams(params: any, user: User): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
