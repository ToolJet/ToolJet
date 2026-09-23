import { DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { NotificationsModule } from '@modules/notifications/module';
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
import { GitSyncConfigsModule } from '@modules/git-sync-configs/module';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { CustomDomainsModule } from '@modules/custom-domains/module';
import { OpenApiSpecOperation } from '@entities/openapi_spec_operation.entity';
import { OpenApiSpecTerminationRegistry } from '@modules/openapi-spec/services/openapi-spec-termination-registry';
import { OpenApiSpecProcessor } from '@modules/openapi-spec/processors/openapi-spec.processor';
import { OPENAPI_SPEC_PROCESSING_QUEUE } from '@modules/openapi-spec/constants';

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
      GitSyncDataSourceCreateGuard,
      GitSyncDataSourceEditGuard,
    } = await this.getProviders(configs, 'data-sources', [
      'service',
      'controller',
      'util.service',
      'services/plugin-selector.service',
      'services/sample-ds.service',
      'guards/git-sync-datasource.guard',
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
        await GitSyncConfigsModule.register(configs),
        await AppPermissionsModule.register(configs!),
        await CustomDomainsModule.register(configs!),
        await NotificationsModule.register(configs),
        await TypeOrmModule.forFeature([OpenApiSpecOperation]),
        await BullModule.registerQueue({ name: OPENAPI_SPEC_PROCESSING_QUEUE }),
        await BullBoardModule.forFeature({ name: OPENAPI_SPEC_PROCESSING_QUEUE, adapter: BullMQAdapter }),
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
        GitSyncDataSourceCreateGuard,
        GitSyncDataSourceEditGuard,
        OpenApiSpecTerminationRegistry,
        // Only WORKER=true instances consume jobs, like the Workflows queue.
        ...(isMainImport && process.env.WORKER === 'true' ? [OpenApiSpecProcessor] : []),
      ],
      controllers: isMainImport ? [DataSourcesController] : [],
      exports: [DataSourcesUtilService, SampleDataSourceService, PluginsServiceSelector],
    });
  }
}
