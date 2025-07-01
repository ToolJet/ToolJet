import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { User } from '@entities/user.entity';
import { RolesRepository } from '@modules/roles/repository';
import { PageUsersRepository } from './repositories/page-users.repository';
import { PagePermissionsRepository } from './repositories/page-permissions.repository';
import { QueryUsersRepository } from './repositories/query-users.repository';
import { QueryPermissionsRepository } from './repositories/query-permissions.repository';
import { ComponentUsersRepository } from './repositories/component-users.repository';
import { ComponentPermissionsRepository } from './repositories/component-permissions.repository';
import { PageUser } from '@entities/page_users.entity';
import { PagePermission } from '@entities/page_permissions.entity';
import { SubModule } from '@modules/app/sub-module';
import { QueryUser } from '@entities/query_users.entity';
import { QueryPermission } from '@entities/query_permissions.entity';
import { ComponentUser } from '@entities/component_users.entity';
import { ComponentPermission } from '@entities/component_permissions.entity';

export class AppPermissionsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AppPermissionsController, AppPermissionsService, AppPermissionsUtilService } = await this.getProviders(
      configs,
      'app-permissions',
      ['controller', 'service', 'util.service']
    );

    return {
      module: AppPermissionsModule,
      controllers: [AppPermissionsController],
      providers: [
        AppPermissionsService,
        AppPermissionsUtilService,
        RolesRepository,
        PageUsersRepository,
        PagePermissionsRepository,
        QueryUsersRepository,
        QueryPermissionsRepository,
        ComponentUsersRepository,
        ComponentPermissionsRepository,
        FeatureAbilityFactory,
      ],
      exports: [AppPermissionsUtilService, AppPermissionsService],
    };
  }
}
