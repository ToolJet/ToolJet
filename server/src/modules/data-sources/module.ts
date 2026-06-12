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
import { AppPermissionsModule } from '@modules/app-permissions/module';

export class DataSourcesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

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

    const { DataQueriesUtilService } = await this.getProviders(configs, 'data-queries', ['util.service']);

    return this.cacheModule(cacheKey, {
      module: DataSourcesModule,
      imports: [
        await AppEnvironmentsModule.register(configs),
        await EncryptionModule.register(configs),
        await OrganizationConstantModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await TooljetDbModule.register(configs),
        await SessionModule.register(configs),
        await InMemoryCacheModule.register(configs),
        await AppPermissionsModule.register(configs!),
      ],
      providers: [
        DataSourcesService,
        DataSourcesRepository,
        VersionRepository,
        AppsRepository,
        DataSourcesUtilService,
        DataQueriesUtilService,
        PluginsServiceSelector,
        PluginsRepository,
        SampleDataSourceService,
        FeatureAbilityFactory,
        OrganizationRepository,
      ],
      controllers: isMainImport ? [DataSourcesController] : [],
      exports: [DataSourcesUtilService, SampleDataSourceService, PluginsServiceSelector],
    });
  }
}
