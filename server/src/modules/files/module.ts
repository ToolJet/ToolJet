import { DynamicModule } from '@nestjs/common';
import { FilesRepository } from '@modules/files/repository';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
export class FilesModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { FilesController, FilesService } = await this.getProviders(configs, 'files', ['controller', 'service']);

    return this.cacheModule(cacheKey, {
      module: FilesModule,
      providers: [FilesService, FilesRepository, FeatureAbilityFactory],
      controllers: isMainImport ? [FilesController] : [],
    });
  }
}
