import { DynamicModule } from '@nestjs/common';
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
import { SessionModule } from '@modules/session/module';
import { SubModule } from '@modules/app/sub-module';
import { InMemoryCacheModule } from '@modules/inMemoryCache/module';

export class DataSourcesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      DataSourcesService,
      DataSourcesController,
      DataSourcesUtilService,
      PluginsServiceSelector,
      SampleDataSourceService,
    } = await this.getProviders(configs, 'data-sources', [
      'service',
      'controller',
      'util.service',
      'services/plugin-selector.service',
      'services/sample-ds.service',
    ]);

    return {
      module: DataSourcesModule,
      imports: [
        await AppEnvironmentsModule.register(configs),
        await EncryptionModule.register(configs),
        await OrganizationConstantModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await TooljetDbModule.register(configs),
        await SessionModule.register(configs),
        await InMemoryCacheModule.register(configs),
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
        OrganizationRepository,
      ],
      controllers: [DataSourcesController],
      exports: [DataSourcesUtilService, SampleDataSourceService, PluginsServiceSelector],
    };
  }
}
