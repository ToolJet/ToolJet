import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { RolesRepository } from '@modules/roles/repository';
import { PageUsersRepository } from './repositories/page-users.repository';
import { PagePermissionsRepository } from './repositories/page-permissions.repository';
import { QueryUsersRepository } from './repositories/query-users.repository';
import { QueryPermissionsRepository } from './repositories/query-permissions.repository';
import { ComponentUsersRepository } from './repositories/component-users.repository';
import { ComponentPermissionsRepository } from './repositories/component-permissions.repository';
import { SubModule } from '@modules/app/sub-module';
import { AppsRepository } from '@modules/apps/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';

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
        AppsRepository,
        RolesRepository,
        PageUsersRepository,
        PagePermissionsRepository,
        QueryUsersRepository,
        QueryPermissionsRepository,
        ComponentUsersRepository,
        ComponentPermissionsRepository,
        FeatureAbilityFactory,
        GroupPermissionsRepository
      ],
      exports: [AppPermissionsUtilService, AppPermissionsService],
    };
  }
}
