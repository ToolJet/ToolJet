import { DynamicModule } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { FeatureAbilityFactory } from './ability';
import { DataQueryFolderRepository, DataQueryFolderMappingRepository } from './repository';
import { AppHistoryModule } from '@modules/app-history/module';

export class DataQueryFoldersModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { DataQueryFoldersController, DataQueryFoldersService, DataQueryFoldersUtilService } =
      await this.getProviders(configs, 'data-query-folders', ['controller', 'service', 'util.service']);

    return this.cacheModule(cacheKey, {
      module: DataQueryFoldersModule,
      imports: [await AppHistoryModule.register(configs)],
      controllers: isMainImport ? [DataQueryFoldersController] : [],
      providers: [
        DataQueryFoldersService,
        DataQueryFoldersUtilService,
        DataQueryFolderRepository,
        DataQueryFolderMappingRepository,
        FeatureAbilityFactory,
      ],
      exports: [DataQueryFoldersUtilService],
    });
  }
}
