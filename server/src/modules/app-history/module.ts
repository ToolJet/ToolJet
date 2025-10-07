import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { getImportPath } from '@modules/app/constants';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';
import { BullModule } from '@nestjs/bull';
import { FeatureAbilityFactory } from './ability';

@Module({})
export class AppHistoryModule extends SubModule {
  static async register(_configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(_configs?.IS_GET_CONTEXT);

    const { AppHistoryController } = await import(`${importPath}/app-history/controller`);
    const { AppHistoryService } = await import(`${importPath}/app-history/service`);
    const { AppHistoryRepository } = await import(`${importPath}/app-history/repository`);
    const { AppStateAggregatorService } = await import(
      `${importPath}/app-history/services/app-state-aggregator.service`
    );
    const { NameResolverService } = await import(`${importPath}/app-history/services/name-resolver.service`);
    const { QueueHistoryIntegrationService } = await import(
      `${importPath}/app-history/services/queue-history-integration.service`
    );
    const { AppHistoryUtilService } = await import(`${importPath}/app-history/util.service`);

    const providers: any[] = [
      AppHistoryService,
      AppHistoryRepository,
      AppStateAggregatorService,
      NameResolverService,
      QueueHistoryIntegrationService,
      FeatureAbilityFactory,
      VersionRepository,
      AppsRepository,
      AppHistoryUtilService,
    ];

    return {
      module: AppHistoryModule,
      imports: [
        BullModule.registerQueue({
          name: 'app-history',
          defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 50,
            attempts: 1,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        }),
      ],
      controllers: [AppHistoryController],
      providers,
      exports: [
        AppHistoryService,
        AppHistoryRepository,
        AppStateAggregatorService,
        NameResolverService,
        QueueHistoryIntegrationService,
        AppHistoryUtilService,
        FeatureAbilityFactory,
      ],
    };
  }
}
