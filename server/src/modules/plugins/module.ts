import { FilesRepository } from '@modules/files/repository';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { SubModule } from '@modules/app/sub-module';

export class PluginsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport: boolean = false): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { PluginsController, PluginsService, PluginsUtilService } = await this.getProviders(configs, 'plugins', [
      'controller',
      'service',
      'util.service',
    ]);
    return this.cacheModule(cacheKey, {
      module: PluginsModule,
      controllers: isMainImport ? [PluginsController] : [],
      providers: [PluginsService, FilesRepository, PluginsUtilService, FeatureAbilityFactory, DataSourcesRepository],
      exports: [PluginsUtilService, PluginsService],
    });
  }
}
