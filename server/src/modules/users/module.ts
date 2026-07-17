import { DynamicModule } from '@nestjs/common';
import { UserRepository } from './repositories/repository';
import { UserBanListRepository } from './repositories/user-ban-list.repository';
import { SessionModule } from '@modules/session/module';
import { FeatureAbilityFactory } from './ability';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { SubModule } from '@modules/app/sub-module';
import { UserMfaRepository } from '@modules/auth/mfa/repository';

export class UsersModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const { UsersService, UsersController, UsersUtilService } = await this.getProviders(configs, 'users', [
      'service',
      'util.service',
      'controller',
    ]);

    return {
      module: UsersModule,
      imports: [await SessionModule.register(configs)],
      controllers: isMainImport ? [UsersController] : [],
      providers: [
        UsersService,
        UserRepository,
        UserBanListRepository,
        UsersUtilService,
        FeatureAbilityFactory,
        OrganizationUsersRepository,
        UserMfaRepository,
      ],
      exports: [UsersUtilService, UserBanListRepository],
    };
  }
}
