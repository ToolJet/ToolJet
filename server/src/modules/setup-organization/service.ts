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
import { OrganizationsService } from '@modules/organizations/service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { CreateWorkspaceV2Dto, WorkspaceV2ResponseDto, toWorkspaceV2Response } from '@modules/organizations/dto/v2';

@Injectable()
export class SetupOrganizationsService implements ISetupOrganizationsService {
  constructor(
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService,
    protected readonly userBanListRepository: UserBanListRepository,
    protected readonly organizationsService: OrganizationsService
  ) {}

  async create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization> {
    if (user?.email) {
      const bannedUser = await this.userBanListRepository.findByEmail(user.email);
      if (bannedUser) {
        throw new ForbiddenException('This account has been suspended by ToolJet. Contact ToolJet support for help.');
      }
    }

    const organization = await this.setupOrganizationsUtilService.create(organizationInputs, user, manager);
    if (!user) return organization;

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

  // External API v2. Same setup as a dashboard-created workspace; a PAT caller becomes its admin.
  // The first workspace on the platform becomes the default.
  async createWorkspaceV2(dto: CreateWorkspaceV2Dto, user?: User): Promise<WorkspaceV2ResponseDto> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await this.organizationsService.checkWorkspaceFieldsAvailableV2(dto);
      const isDefault = (await manager.count(Organization)) === 0;
      const organization = await this.create({ name: dto.name, slug: dto.slug, isDefault }, user, manager);
      return toWorkspaceV2Response(organization);
    });
  }
}
