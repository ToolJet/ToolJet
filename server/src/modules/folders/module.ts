import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { DynamicModule } from '@nestjs/common';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';

export class FoldersModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { FoldersController, FoldersService, FoldersUtilService } = await this.getProviders(configs, 'folders', [
      'controller',
      'service',
      'util.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: FoldersModule,
      controllers: isMainImport ? [FoldersController] : [],
      providers: [FoldersUtilService, FoldersService, FeatureAbilityFactory, OrganizationGitSyncRepository],
      exports: [FoldersUtilService],
    });
  }
}
