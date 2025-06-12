import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { VersionRepository } from '@modules/versions/repository';
import { DataQueryRepository } from './repository';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { FeatureAbilityFactory as AppFeatureAbilityFactory } from './ability/app';
import { FeatureAbilityFactory as DataSourceFeatureAbilityFactory } from './ability/data-source';
import { AppsRepository } from '@modules/apps/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { LicenseModule } from '@modules/licensing/module';
import { AppPermissionsModule } from '@modules/app-permissions/module';

export class DataQueriesModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { DataQueriesUtilService } = await import(`${importPath}/data-queries/util.service`);
    const { DataQueriesService } = await import(`${importPath}/data-queries/service`);
    const { DataQueriesController } = await import(`${importPath}/data-queries/controller`);

    return {
      module: DataQueriesModule,
      imports: [
        await AppEnvironmentsModule.register(configs),
        await DataSourcesModule.register(configs),
        await LicenseModule.forRoot(configs),
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
