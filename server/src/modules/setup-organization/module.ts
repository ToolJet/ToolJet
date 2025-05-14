import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { DataSourcesModule } from '@modules/data-sources/module';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { RolesModule } from '@modules/roles/module';
import { ThemesModule } from '@modules/organization-themes/module';
import { SessionModule } from '@modules/session/module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { DataSourcesRepository } from '@modules/data-sources/repository';

export class SetupOrganizationsModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { SetupOrganizationsService } = await import(`${importPath}/setup-organization/service`);
    const { SetupOrganizationsUtilService } = await import(`${importPath}/setup-organization/util.service`);
    const { SetupOrganizationsController } = await import(`${importPath}/setup-organization/controller`);
    const { FeatureAbilityFactory } = await import(`${importPath}/organizations/ability`);

    return {
      module: SetupOrganizationsModule,
      imports: [
        await GroupPermissionsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await RolesModule.register(configs),
        await ThemesModule.register(configs),
        await SessionModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await TooljetDbModule.register(configs),
      ],
      controllers: [SetupOrganizationsController],
      providers: [
        SetupOrganizationsService,
        SetupOrganizationsUtilService,
        OrganizationRepository,
        OrganizationUsersRepository,
        FeatureAbilityFactory,
        DataSourcesRepository,
      ],
      exports: [SetupOrganizationsUtilService],
    };
  }
}
