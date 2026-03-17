import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';
import { BullModule } from '@nestjs/bullmq';
import { FeatureAbilityFactory } from './ability';
import { NameResolverRepository } from '@modules/app-history/repositories/name-resolver.repository';
import { AppHistoryRepository } from '@modules/app-history/repository';
import { getTooljetEdition } from '@helpers/utils.helper';
@Module({})
export class AppHistoryModule extends SubModule {
  static async register(_configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const importPath = await getImportPath(_configs?.IS_GET_CONTEXT);

    const { AppHistoryController } = await import(`${importPath}/app-history/controller`);
    const { AppHistoryService } = await import(`${importPath}/app-history/service`);
    const { AppStateAggregatorService } = await import(
      `${importPath}/app-history/services/app-state-aggregator.service`
    );
    const { AppStateRepository } = await import(`${importPath}/app-history/repositories/app-state.repository`);
    const { AppHistoryUtilService } = await import(`${importPath}/app-history/util.service`);
    const { AppHistoryStreamService } = await import(`${importPath}/app-history/app-history-stream.service`);
    const { EntityChangeService } = await import(`${importPath}/app-history/services/entity-change.service`);

    const providers: any[] = [
      AppHistoryService,
      AppHistoryRepository,
      AppStateRepository,
      NameResolverRepository,
      AppStateAggregatorService,
      AppHistoryStreamService,
      EntityChangeService,
      FeatureAbilityFactory,
      VersionRepository,
      AppsRepository,
      AppHistoryUtilService,
    ];

    // Only register the queue for EE/Cloud editions
    const imports: any[] = [];
    const edition = getTooljetEdition();
    const isEEOrCloud = edition === TOOLJET_EDITIONS.EE || edition === TOOLJET_EDITIONS.Cloud;
    if (isEEOrCloud) {
      imports.push(
        BullModule.registerQueue({
          name: 'app-history',
          defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        })
      );
    }

    // Register queue processor only when WORKER=true and edition is EE/Cloud
    // This is consistent with workflows and other BullMQ-based features
    // For self-hosted: run main server + worker with WORKER=true
    // For cloud: main server (WORKER=false) + dedicated worker (WORKER=true)
    if (isEEOrCloud && process.env.WORKER === 'true' && isMainImport && !_configs?.IS_GET_CONTEXT) {
      const { HistoryQueueProcessor } = await import(`${importPath}/app-history/queue/history-queue.processor`);
      providers.push(HistoryQueueProcessor);
    }

    return {
      module: AppHistoryModule,
      imports,
      controllers: [AppHistoryController],
      providers,
      exports: [AppHistoryUtilService, EntityChangeService],
    };
  }
}
