import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';

export class LogToFileModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    return this.cacheModule(cacheKey, {
      module: LogToFileModule,
      providers: [],
      exports: [],
    });
  }
}
