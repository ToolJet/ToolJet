import { DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { SubModule } from '@modules/app/sub-module';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { FeatureAbilityFactory } from './ability';
import { APP_USAGE_QUEUE } from './constants';

/**
 * Usage analytics (EE/Cloud). CE registers only the 501 controller.
 *
 * EE/Cloud wiring:
 * - listener: turns APP_OPENED_EVENT into a queue job (every process that serves HTTP);
 * - processor: batches jobs into the daily rollup tables (WORKER=true only);
 * - scheduler: keeps monthly partitions of app_usage_daily ahead and drops expired ones.
 */
export class AppUsageAnalyticsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { AppUsageAnalyticsController, AppUsageAnalyticsService } = await this.getProviders(
      configs,
      'app-usage-analytics',
      ['controller', 'service']
    );

    const providers: any[] = [AppUsageAnalyticsService, FeatureAbilityFactory];
    const imports: any[] = [];

    const edition = getTooljetEdition();
    const isEEOrCloud = edition === TOOLJET_EDITIONS.EE || edition === TOOLJET_EDITIONS.Cloud;
    const isRuntime = isMainImport && !configs?.IS_GET_CONTEXT;

    if (isEEOrCloud) {
      const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
      const { AppUsageAnalyticsRepository } = await import(`${importPath}/app-usage-analytics/repository`);
      providers.push(AppUsageAnalyticsRepository);
      imports.push(
        BullModule.registerQueue({
          name: APP_USAGE_QUEUE,
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: 100,
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
          },
        })
      );
      if (edition !== TOOLJET_EDITIONS.Cloud) {
        imports.push(BullBoardModule.forFeature({ name: APP_USAGE_QUEUE, adapter: BullMQAdapter }));
      }

      if (isRuntime) {
        const { AppUsageAnalyticsListener } = await import(`${importPath}/app-usage-analytics/listener`);
        const { AppUsagePartitionScheduler } = await import(`${importPath}/app-usage-analytics/scheduler`);
        providers.push(AppUsageAnalyticsListener, AppUsagePartitionScheduler);

        if (process.env.WORKER === 'true') {
          const { AppUsageQueueProcessor } = await import(`${importPath}/app-usage-analytics/processor`);
          providers.push(AppUsageQueueProcessor);
        }
      }
    }

    return this.cacheModule(cacheKey, {
      module: AppUsageAnalyticsModule,
      imports,
      controllers: isMainImport ? [AppUsageAnalyticsController] : [],
      providers,
      exports: [],
    });
  }
}
