import { GitSyncConfigsModule } from '@modules/git-sync-configs/module';
import { FoldersModule } from '@modules/folders/module';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class FolderDataSourcesModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { FolderDataSourcesController, FolderDataSourcesService, FolderDataSourcesUtilService } =
      await this.getProviders(configs, 'folder-data-sources', ['controller', 'service', 'util.service']);

    return this.cacheModule(cacheKey, {
      module: FolderDataSourcesModule,
      controllers: isMainImport ? [FolderDataSourcesController] : [],
      imports: [await GitSyncConfigsModule.register(configs), await FoldersModule.register(configs)],
      providers: [FolderDataSourcesService, FolderDataSourcesUtilService, FeatureAbilityFactory],
      exports: [FolderDataSourcesService, FolderDataSourcesUtilService],
    });
  }
}
