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
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { DefaultDataSourceKinds } from '@modules/data-sources/constants';
import { OrganizationInputs } from './types/organization-inputs';
import { ORGANIZATION_INSTANCE_KEY } from '@modules/licensing/constants';

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
    protected readonly organizationUserRepository: OrganizationUsersRepository,
    protected readonly dataSourceUtilService: DataSourcesUtilService,
    protected readonly dataSourcesRepository: DataSourcesRepository
  ) {}

  async create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await this.organizationRepository.createOne(organizationInputs, manager);
      await this.appEnvironmentUtilService.createDefaultEnvironments(organization.id, manager);
      await this.groupPermissionUtilService.createDefaultGroups(organization.id, manager);

      if (user) {
        await this.organizationUserRepository.createOne(user, organization, false, manager);
        await this.rolesUtilService.addUserRole(organization.id, { role: USER_ROLE.ADMIN, userId: user.id }, manager);
      }
      await this.sampleDBService.createSampleDB(organization.id, manager);
      await this.licenseOrganizationService.validateOrganization(manager, organization.id);
      await this.licenseUserService.validateUser(manager, organization.id);
      //create default theme for this organization
      await this.organizationThemesUtilService.createDefaultTheme(manager, organization.id);
      await this.tooljetDbTableOperationsService.createTooljetDbTenantSchemaAndRole(organization.id, manager);

      // Create static data sources for the organization
      for (const defaultSource of DefaultDataSourceKinds) {
        const dataSource = await this.dataSourcesRepository.createDefaultDataSource(
          defaultSource,
          organization.id,
          manager
        );
        await this.dataSourceUtilService.createDataSourceInAllEnvironments(organization.id, dataSource.id, manager);
      }

      return organization;
    }, manager);
  }
}
