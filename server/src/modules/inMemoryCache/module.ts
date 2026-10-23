import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';

export class InMemoryCacheModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { InMemoryCacheService } = await this.getProviders(configs, 'inMemoryCache', ['in-memory-cache.service']);

    return this.cacheModule(cacheKey, {
      module: InMemoryCacheModule,
      controllers: [],
      providers: [InMemoryCacheService],
      exports: [InMemoryCacheService],
    });
  }
}
