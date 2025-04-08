import { Injectable } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { OrganizationRepository } from '@modules/organizations/repository';
import { LicenseOrganizationService } from '@modules/licensing/services/organization.service';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { OrganizationThemesUtilService } from '@modules/organization-themes/util.service';
import { RolesUtilService } from '@modules/roles/util.service';
import { GroupPermissionsUtilService } from '@modules/group-permissions/util.service';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { SampleDataSourceService } from '@modules/data-sources/services/sample-ds.service';
import { ISetupOrganizationsUtilService } from './interfaces/IUtilService';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';

@Injectable()
export class SetupOrganizationsUtilService implements ISetupOrganizationsUtilService {
  constructor(
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly groupPermissionUtilService: GroupPermissionsUtilService,
    protected readonly rolesUtilService: RolesUtilService,
    protected readonly tooljetDbTableOperationsService: TooljetDbTableOperationsService,
    protected readonly organizationThemesUtilService: OrganizationThemesUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly sampleDBService: SampleDataSourceService,
    protected readonly licenseOrganizationService: LicenseOrganizationService,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly organizationUserRepository: OrganizationUsersRepository
  ) {}

  async create(name: string, slug: string, user?: User, manager?: EntityManager): Promise<Organization> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await this.organizationRepository.createOne(name, slug, manager);
      await this.appEnvironmentUtilService.createDefaultEnvironments(organization.id, manager);
      await this.groupPermissionUtilService.createDefaultGroups(organization.id, manager);

      if (user) {
        await this.organizationUserRepository.createOne(user, organization, false, manager);
        await this.rolesUtilService.addUserRole(organization.id, { role: USER_ROLE.ADMIN, userId: user.id }, manager);
      }
      await this.sampleDBService.createSampleDB(organization.id, manager);
      await this.licenseOrganizationService.validateOrganization(manager);
      await this.licenseUserService.validateUser(manager);
      //create default theme for this organization
      await this.organizationThemesUtilService.createDefaultTheme(manager, organization.id);
      await this.tooljetDbTableOperationsService.createTooljetDbTenantSchemaAndRole(organization.id, manager);
      return organization;
    }, manager);
  }
}
