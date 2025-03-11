import { Injectable } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { IOrganizationsUtilService } from '@modules/organizations/interfaces/IUtilService';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { GroupPermissionsUtilService } from '@modules/group-permissions/util.service';

@Injectable()
export class OrganizationsUtilService implements IOrganizationsUtilService {
  constructor(
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly groupPermissionUtilService: GroupPermissionsUtilService
  ) {}

  async createOrganizationWithDefaultSettings(
    name: string,
    slug: string,
    manager?: EntityManager
  ): Promise<Organization> {
    let organization: Organization;
    await dbTransactionWrap(async (manager: EntityManager) => {
      organization = await this.organizationRepository.createOne(name, slug, manager);
      await this.appEnvironmentUtilService.createDefaultEnvironments(organization.id, manager);
      await this.groupPermissionUtilService.createDefaultGroups(organization.id, manager);
    }, manager);

    return organization;
  }
}
