import { ForbiddenException, Injectable } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { SetupOrganizationsUtilService } from './util.service';
import { ISetupOrganizationsService } from './interfaces/IService';
import { OrganizationInputs } from './types/organization-inputs';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { UserBanListRepository } from '@modules/users/repositories/user-ban-list.repository';

@Injectable()
export class SetupOrganizationsService implements ISetupOrganizationsService {
  constructor(
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService,
    protected readonly userBanListRepository: UserBanListRepository
  ) {}

  async create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization> {
    if (user?.email) {
      const bannedUser = await this.userBanListRepository.findByEmail(user.email);
      if (bannedUser) {
        throw new ForbiddenException(JSON.stringify({ errorType: 'USER_BANNED' }));
      }
    }

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
