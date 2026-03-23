import { Injectable, Logger, Optional } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { SetupOrganizationsUtilService } from './util.service';
import { ISetupOrganizationsService } from './interfaces/IService';
import { OrganizationInputs } from './types/organization-inputs';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { OrganizationEnvRegistryService } from '@ee/organization-env/organization-env-registry.service';

@Injectable()
export class SetupOrganizationsService implements ISetupOrganizationsService {
  private readonly logger = new Logger(SetupOrganizationsService.name);

  constructor(
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService,
    protected readonly organizationEnvRegistryService: OrganizationEnvRegistryService
  ) { }

  async create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization> {
    const organization = await this.setupOrganizationsUtilService.create(organizationInputs, user, manager);
    await this.reloadEnvConfigs('workspace-create');

    //WORKSPACE_CREATE audit
    const auditLogsData = {
      userId: user.id,
      organizationId: organization.id,
      resourceId: organization.id,
      resourceName: organization.name,
      resourceData: {
        workspace_details: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      },
    };
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    return organization;
  }

  private async reloadEnvConfigs(trigger: string): Promise<void> {
    if (!this.organizationEnvRegistryService) return;

    try {
      await this.organizationEnvRegistryService.reload();
      this.logger.debug(`Environment config registry reloaded after ${trigger}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to reload environment config registry after ${trigger}: ${errorMessage}`);
    }
  }
}
