import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { EncryptionModule } from '@modules/encryption/module';
import { DataSourcesRepository } from './repository';
import { PluginsRepository } from '@modules/plugins/repository';
import { OrganizationConstantModule } from '@modules/organization-constants/module';
import { FeatureAbilityFactory } from './ability';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { OrganizationRepository } from '@modules/organizations/repository';

export class DataSourcesModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { DataSourcesService } = await import(`${importPath}/data-sources/service`);
    const { DataSourcesController } = await import(`${importPath}/data-sources/controller`);
    const { DataSourcesUtilService } = await import(`${importPath}/data-sources/util.service`);
    const { PluginsServiceSelector } = await import(`${importPath}/data-sources/services/plugin-selector.service`);
    const { SampleDataSourceService } = await import(`${importPath}/data-sources/services/sample-ds.service`);
    const { OrganizationsService } = await import(`${importPath}/organizations/service`);

    return {
      module: DataSourcesModule,
      imports: [
        await AppEnvironmentsModule.register(configs),
        await EncryptionModule.register(configs),
        await OrganizationConstantModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await TooljetDbModule.register(configs),
      ],
      providers: [
        DataSourcesService,
        DataSourcesRepository,
        VersionRepository,
        AppsRepository,
        DataSourcesUtilService,
        PluginsServiceSelector,
        PluginsRepository,
        SampleDataSourceService,
        FeatureAbilityFactory,
        OrganizationsService,
        OrganizationRepository,
      ],
      controllers: [DataSourcesController],
      exports: [DataSourcesUtilService, SampleDataSourceService, PluginsServiceSelector],
    };
  }
}
