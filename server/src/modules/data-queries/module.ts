import { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { AppHistoryModule } from '@modules/app-history/module';
import { GitSyncConfigsModule } from '@modules/git-sync-configs/module';
import { DataQueryFolderMappingRepository } from '@modules/data-query-folders/repository';
import { AppScopedThrottlerGuard } from './throttler/app-scoped-throttler.guard';
import { QueryLibraryModule } from '@modules/query-library/module';
import { queryRunThrottlerConfig } from './throttler/config';

export class DataQueriesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { DataQueriesController, DataQueriesService, DataQueriesUtilService, GitSyncQueryEditGuard } =
      await this.getProviders(configs, 'data-queries', [
        'controller',
        'service',
        'util.service',
        'guards/git-sync-query-edit.guard',
      ]);

    return this.cacheModule(cacheKey, {
      module: DataQueriesModule,
      imports: [
        await QueryLibraryModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppPermissionsModule.register(configs),
        await AppHistoryModule.register(configs),
        await GitSyncConfigsModule.register(configs),
        // 50/s per (user, app). Single-pod counters until Redis storage added.
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: queryRunThrottlerConfig,
        }),
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
        DataQueryFolderMappingRepository,
        AppScopedThrottlerGuard,
        GitSyncQueryEditGuard,
      ],
      exports: [DataQueriesUtilService, DataQueriesService],
      controllers: isMainImport ? [DataQueriesController] : [],
    });
  }
}
