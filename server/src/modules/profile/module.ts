import { DynamicModule } from '@nestjs/common';
import { UserRepository } from '@modules/users/repositories/repository';
import { FilesRepository } from '@modules/files/repository';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class ProfileModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { ProfileService, ProfileController, ProfileUtilService } = await this.getProviders(configs, 'profile', [
      'service',
      'controller',
      'util.service',
    ]);

    return this.cacheModule(cacheKey, {
      module: ProfileModule,
      providers: [FilesRepository, UserRepository, ProfileService, ProfileUtilService, FeatureAbilityFactory],
      controllers: isMainImport ? [ProfileController] : [],
      exports: [ProfileUtilService],
    });
  }
}
