import { DynamicModule } from '@nestjs/common';
import { BackgroundProcessorService } from './service';
import { BackgroundProcessorController } from './controller';
import { BackgroundProcessorUtilService } from './util.service';
import { BackgroundProcessorJobStore } from './store';
import { SubModule } from '@modules/app/sub-module';

export class BackgroundProcessorModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    return this.cacheModule(cacheKey, {
      module: BackgroundProcessorModule,
      controllers: isMainImport ? [BackgroundProcessorController] : [],
      providers: [BackgroundProcessorService, BackgroundProcessorUtilService, BackgroundProcessorJobStore],
      exports: [BackgroundProcessorUtilService],
    });
  }
}
