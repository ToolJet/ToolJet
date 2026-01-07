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
import { SsoConfigOidcGroupSyncRepository } from './oidc-group-sync.repository';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoginConfigsService implements ILoginConfigsService {
  constructor(
    protected ssoConfigsRepository: SSOConfigsRepository,
    protected organizationsRepository: OrganizationRepository,
    protected configService: ConfigService,
    protected encryptionService: EncryptionService,
    protected loginConfigsUtilService: LoginConfigsUtilService,
    protected oidcGroupSyncRepository: SsoConfigOidcGroupSyncRepository,
    protected logger: PinoLogger
  ) {}

  async getProcessedOrganizationDetails(organizationId?: string) {
    const existingOrganizationId = (await this.organizationsRepository.getSingleOrganization())?.id;
    if (!existingOrganizationId) {
      throw new NotFoundException();
    }
    if (!organizationId) {
      const result = await this.loginConfigsUtilService.constructSSOConfigs(existingOrganizationId);
      return result;
    }

    try {
      // Fetch organization details, ensuring organization ID and relevant data are always returned
      const result = await this.loginConfigsUtilService.fetchOrganizationDetails(
        organizationId,
        [true, false],
        true,
        true
      );
      return this.loginConfigsUtilService.removeDisabledSsoConfigs(result);
    } catch (error) {
      this.logger.error('Error fetching organization details', error);
    }
    return;
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
    const { type, configs, enabled, oidcGroupSyncs, configId } = params;

    if (
      !(type && [SSOType.GOOGLE, SSOType.GIT, SSOType.FORM, SSOType.OPENID, SSOType.SAML, SSOType.LDAP].includes(type))
    ) {
      throw new BadRequestException('Invalid SSO type');
    }

    await this.loginConfigsUtilService.encryptSecret(configs);
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    const auditLogsData = {
      userId: user.id,
      organizationId: organizationId,
      resourceId: organizationId,
      resourceName: organization.name,
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);

    let ssoConfig;
    // Handle OIDC multi-tenant (supports multiple configs per organization)
    if (type === SSOType.OPENID) {
      if (configId) {
        // configId provided - try to update existing config
        const existingConfig = await this.ssoConfigsRepository.findOne({
          where: {
            id: configId,
            organizationId,
            sso: SSOType.OPENID,
          },
        });

        if (existingConfig) {
          // Config exists - UPDATE
          await this.ssoConfigsRepository.update(configId, { configs, enabled });
          ssoConfig = await this.ssoConfigsRepository.findOne({ where: { id: configId } });
        } else {
          // configId provided but doesn't exist - CREATE new (use frontend-provided name)
          const newConfig = this.ssoConfigsRepository.create({
            organizationId,
            sso: type,
            configs, // Use name from frontend
            enabled,
            configScope: ConfigScope.ORGANIZATION,
          });
          ssoConfig = await this.ssoConfigsRepository.save(newConfig);
        }
      } else {
        // No configId - CREATE new config (use frontend-provided name)
        const newConfig = this.ssoConfigsRepository.create({
          organizationId,
          sso: type,
          configs, // Use name from frontend
          enabled,
          configScope: ConfigScope.ORGANIZATION,
        });
        ssoConfig = await this.ssoConfigsRepository.save(newConfig);
      }
    } else {
      // Other SSO types (single config per organization)
      ssoConfig = await this.ssoConfigsRepository.createOrUpdateSSOConfig({
        sso: type,
        configs,
        enabled,
        organizationId,
        configScope: ConfigScope.ORGANIZATION,
      });
    }

    if (oidcGroupSyncs) {
      await this.oidcGroupSyncRepository.createOrUpdateGroupSync(oidcGroupSyncs, ssoConfig.id);
    }

    return ssoConfig;
  }

  async updateGeneralOrganizationConfigs(user: User, params: OrganizationConfigsUpdateDto) {
    const organizationId = user.organizationId;
    const { domain, passwordAllowedDomains, passwordRestrictedDomains, enableSignUp, inheritSSO, automaticSsoLogin } = params;

    const updatableParams = {
      domain,
      passwordAllowedDomains,
      passwordRestrictedDomains,
      enableSignUp,
      inheritSSO,
      automaticSsoLogin,
    };

    if (automaticSsoLogin === true) {
      const result = await this.loginConfigsUtilService.fetchOrganizationDetails(
        organizationId,
        [true, false],
        true,
        true
      );
      let enabledSSOCount = 0;
      let isFormLoginDisabled = true;

      Object.keys(result).forEach((ssoType) => {
        const ssoConfig = result[ssoType];

        // Helper to process a single config object
        const processConfig = (cfg: any) => {
          if (Object.values(SSOType).includes(cfg?.sso) && cfg?.enabled) {
            // Check if the SSO is enabled
            if (cfg.sso !== SSOType.FORM) {
              enabledSSOCount += 1;
            } else {
              isFormLoginDisabled = false;
            }
          }
        };

        // ssoConfig can be a single object or an array (e.g., multi-tenant OPENID)
        if (Array.isArray(ssoConfig)) {
          ssoConfig.forEach(processConfig);
        } else {
          processConfig(ssoConfig);
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

  async updateInheritSSO(user: User, param: boolean): Promise<void> {
    const organizationId = user.organizationId;
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    await this.organizationsRepository.update({ id: organizationId }, { inheritSSO: param });

    //INSTANCE_SSO_INHERIT audit
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

  /**
   * Delete SSO configuration
   */
  async deleteOrganizationSSOConfig(user: User, configId: string): Promise<void> {
    const organizationId = user.organizationId;

    // Find the config
    const config = await this.ssoConfigsRepository.findOne({
      where: { id: configId, organizationId },
    });

    if (!config) {
      throw new NotFoundException('SSO configuration not found');
    }

    // Delete associated group syncs if OIDC
    if (config.sso === SSOType.OPENID) {
      await this.oidcGroupSyncRepository.delete({ ssoConfigId: configId });
    }

    // Delete the config
    await this.ssoConfigsRepository.delete(configId);

    // Audit log
    const organization = await this.organizationsRepository.findOne({ where: { id: organizationId } });
    const auditLogsData = {
      userId: user.id,
      organizationId: organizationId,
      resourceId: organizationId,
      resourceName: organization.name,
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
  }
}
