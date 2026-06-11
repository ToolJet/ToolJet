import { DynamicModule } from '@nestjs/common';
import { UserRepository } from './repositories/repository';
import { SessionModule } from '@modules/session/module';
import { FeatureAbilityFactory } from './ability';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { SubModule } from '@modules/app/sub-module';

export class UsersModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    const { UsersService, UsersController, UsersUtilService } = await this.getProviders(configs, 'users', [
      'service',
      'util.service',
      'controller',
    ]);

    return this.cacheModule(cacheKey, {
      module: UsersModule,
      imports: [await SessionModule.register(configs)],
      controllers: isMainImport ? [UsersController] : [],
      providers: [UsersService, UserRepository, UsersUtilService, FeatureAbilityFactory, OrganizationUsersRepository],
      exports: [UsersUtilService],
    });
  }
}
