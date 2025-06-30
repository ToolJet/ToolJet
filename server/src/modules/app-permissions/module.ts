import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { User } from '@entities/user.entity';
import { RolesRepository } from '@modules/roles/repository';
import { PageUsersRepository } from './repositories/page-users.repository';
import { PagePermissionsRepository } from './repositories/page-permissions.repository';
import { PageUser } from '@entities/page_users.entity';
import { PagePermission } from '@entities/page_permissions.entity';
import { SubModule } from '@modules/app/sub-module';

export class AppPermissionsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AppPermissionsController, AppPermissionsService, AppPermissionsUtilService } = await this.getProviders(
      configs,
      'app-permissions',
      ['controller', 'service', 'util.service']
    );

    return {
      module: AppPermissionsModule,
      imports: [TypeOrmModule.forFeature([GroupPermissions, User, PageUser, PagePermission])],
      controllers: [AppPermissionsController],
      providers: [
        AppPermissionsService,
        AppPermissionsUtilService,
        RolesRepository,
        PageUsersRepository,
        PagePermissionsRepository,
        FeatureAbilityFactory,
      ],
      exports: [AppPermissionsUtilService, AppPermissionsService],
    };
  }
}
