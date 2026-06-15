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
import { DataQueryFolderMappingRepository } from '@modules/data-query-folders/repository';
import { AppScopedThrottlerGuard } from './throttler/app-scoped-throttler.guard';

function parsePositiveInt(raw: unknown, fallback: number): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export class DataQueriesModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { DataQueriesController, DataQueriesService, DataQueriesUtilService } = await this.getProviders(
      configs,
      'data-queries',
      ['controller', 'service', 'util.service']
    );

    return this.cacheModule(cacheKey, {
      module: DataQueriesModule,
      imports: [
        await AppEnvironmentsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppPermissionsModule.register(configs),
        await AppHistoryModule.register(configs),
        // 50/s per (user, app). Single-pod counters until Redis storage added.
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => [
            {
              ttl: parsePositiveInt(config.get('DATA_QUERY_RUN_TTL'), 1000),
              limit: parsePositiveInt(config.get('DATA_QUERY_RUN_LIMIT'), 50),
            },
          ],
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
      ],
      exports: [DataQueriesUtilService],
      controllers: isMainImport ? [DataQueriesController] : [],
    });
  }
}
