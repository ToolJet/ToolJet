import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { InMemoryCacheModule } from '@modules/inMemoryCache/module';

export class MetaModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { MetadataService, MetadataController, MetadataUtilService } = await this.getProviders(configs, 'meta', [
      'service',
      'controller',
      'util.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: MetaModule,
      imports: [await InMemoryCacheModule.register(configs)],
      controllers: isMainImport ? [MetadataController] : [],
      providers: [MetadataService, MetadataUtilService, FeatureAbilityFactory],
      exports: [MetadataUtilService],
    });
  }
}
