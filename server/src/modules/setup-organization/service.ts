import { Injectable } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { SetupOrganizationsUtilService } from './util.service';
import { ISetupOrganizationsService } from './interfaces/IService';
import { OrganizationInputs } from './types/organization-inputs';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';

@Injectable()
export class SetupOrganizationsService implements ISetupOrganizationsService {
  constructor(protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService) {}

  async create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization> {
    const organization = await this.setupOrganizationsUtilService.create(organizationInputs, user, manager);

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
}
