import { DynamicModule } from '@nestjs/common';
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
import { SubModule } from '@modules/app/sub-module';

export class SetupOrganizationsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { SetupOrganizationsService, SetupOrganizationsUtilService, SetupOrganizationsController } =
      await this.getProviders(configs, 'setup-organization', ['service', 'util.service', 'controller']);

    const { FeatureAbilityFactory } = await this.getProviders(configs, 'organizations', ['ability']);

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
