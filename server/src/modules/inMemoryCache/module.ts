import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';

export class InMemoryCacheModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { InMemoryCacheService } = await this.getProviders(configs, 'inMemoryCache', ['in-memory-cache.service']);

    return {
      module: InMemoryCacheModule,
      controllers: [],
      providers: [InMemoryCacheService],
      exports: [InMemoryCacheService],
    };
  }
}
