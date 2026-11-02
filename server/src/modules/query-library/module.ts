import { ConfigModule, ConfigService } from '@nestjs/config';
import { queryRunThrottlerConfig } from '@modules/data-queries/throttler/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppScopedThrottlerGuard } from '@modules/data-queries/throttler/app-scoped-throttler.guard';
import { DataQueriesUtilService as BaseRuntime } from '@modules/data-queries/util.service';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { VersionRepository } from '@modules/versions/repository';
import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { QueryLibraryService as BaseService } from './service';
import { QueryLibraryRepository } from './repository';
import { QueryLibraryAccessGuard } from './guards/query-library-access.guard';
import { ValidateLibraryQueryGuard } from './guards/validate-library-query.guard';
import { ValidateLibraryDataSourceGuard } from './guards/validate-library-data-source.guard';
import { FeatureAbilityFactory } from './ability';
import { FeatureAbilityGuard } from './ability/guard';
import { LibraryDraftService } from './draft.service';
import { LibraryLifecycleService } from './lifecycle.service';
export class QueryLibraryModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport = false): Promise<DynamicModule> {
    const {
      QueryLibraryController,
      QueryLibraryService,
      LibraryLifecycleService: SelectedLifecycle,
      LibraryDraftService: SelectedDraft,
    } = await this.getProviders(configs, 'query-library', [
      'controller',
      'service',
      'lifecycle.service',
      'draft.service',
    ]);
    const { AuditLogsModule } = await this.getProviders(configs, 'audit-logs', ['module']);
    const { DataQueriesUtilService } = await this.getProviders(configs, 'data-queries', ['util.service']);
    return {
      module: QueryLibraryModule,
      imports: [
        await AuditLogsModule.register(configs),
        await DataSourcesModule.register(configs),
        await AppEnvironmentsModule.register(configs),
        await AppPermissionsModule.register(configs),
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: queryRunThrottlerConfig,
        }),
      ],
      providers: [
        { provide: BaseService, useClass: QueryLibraryService },
        { provide: BaseRuntime, useClass: DataQueriesUtilService },
        VersionRepository,
        AppScopedThrottlerGuard,
        { provide: LibraryLifecycleService, useClass: SelectedLifecycle },
        { provide: LibraryDraftService, useClass: SelectedDraft },
        FeatureAbilityFactory,
        FeatureAbilityGuard,
        QueryLibraryRepository,
        DataSourcesRepository,
        QueryLibraryAccessGuard,
        ValidateLibraryQueryGuard,
        ValidateLibraryDataSourceGuard,
      ],
      controllers: isMainImport ? [QueryLibraryController] : [],
      exports: [BaseService, QueryLibraryRepository, LibraryLifecycleService, LibraryDraftService],
    };
  }
}
