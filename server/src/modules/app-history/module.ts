import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { getImportPath } from '@modules/app/constants';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';
import { BullModule } from '@nestjs/bull';
import { FeatureAbilityFactory } from './ability';
import { NameResolverRepository } from '@modules/app-history/repositories/name-resolver.repository';
import { AppHistoryRepository } from '@modules/app-history/repository';
@Module({})
export class AppHistoryModule extends SubModule {
  private static isProcessorRegistered = false;

  static async register(_configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(_configs?.IS_GET_CONTEXT);

    const { AppHistoryController } = await import(`${importPath}/app-history/controller`);
    const { AppHistoryService } = await import(`${importPath}/app-history/service`);
    const { AppStateAggregatorService } = await import(
      `${importPath}/app-history/services/app-state-aggregator.service`
    );
    const { AppStateRepository } = await import(`${importPath}/app-history/repositories/app-state.repository`);
    const { AppHistoryUtilService } = await import(`${importPath}/app-history/util.service`);

    const providers: any[] = [
      AppHistoryService,
      AppHistoryRepository,
      AppStateRepository,
      NameResolverRepository,
      AppStateAggregatorService,
      FeatureAbilityFactory,
      VersionRepository,
      AppsRepository,
      AppHistoryUtilService,
    ];

    // Always register the queue for dependency injection
    const imports: any[] = [
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
    ];

    // Only register the processor once to avoid duplicate handlers
    if (!this.isProcessorRegistered) {
      const { HistoryQueueProcessor } = await import(`${importPath}/app-history/queue/history-queue.processor`);
      providers.push(HistoryQueueProcessor);
      this.isProcessorRegistered = true;
    }

    return {
      module: AppHistoryModule,
      imports,
      controllers: [AppHistoryController],
      providers,
      exports: [
        AppHistoryService,
        AppStateRepository,
        NameResolverRepository,
        AppStateAggregatorService,
        AppHistoryUtilService,
        FeatureAbilityFactory,
      ],
    };
  }
}
