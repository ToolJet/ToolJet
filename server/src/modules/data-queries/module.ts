import { DynamicModule } from '@nestjs/common';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { VersionRepository } from '@modules/versions/repository';
import { DataQueryRepository } from './repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { FeatureAbilityFactory as AppFeatureAbilityFactory } from './ability/app';
import { FeatureAbilityFactory as DataSourceFeatureAbilityFactory } from './ability/data-source';
import { AppsRepository } from '@modules/apps/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { SubModule } from '@modules/app/sub-module';
import { AppPermissionsModule } from '@modules/app-permissions/module';

export class DataQueriesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { DataQueriesController, DataQueriesService, DataQueriesUtilService } = await this.getProviders(
      configs,
      'data-queries',
      ['controller', 'service', 'util.service']
    );

    return {
      module: DataQueriesModule,
      imports: [
        await AppEnvironmentsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppPermissionsModule.register(configs),
      ],
      providers: [
        DataQueryRepository,
        VersionRepository,
        AppsRepository,
        DataSourcesRepository,
        OrganizationRepository,
        DataQueriesService,
        DataQueriesUtilService,
        AppFeatureAbilityFactory,
        DataSourceFeatureAbilityFactory,
      ],
      exports: [DataQueriesUtilService],
      controllers: [DataQueriesController],
    };
  }
}
