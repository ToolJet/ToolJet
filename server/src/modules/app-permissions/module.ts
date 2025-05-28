import { getImportPath } from '@modules/app/constants';
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
import { PageUser } from '@entities/page_users.entity';
import { PagePermission } from '@entities/page_permissions.entity';
import { QueryUser } from '@entities/query_users.entity';
import { QueryPermission } from '@entities/query_permissions.entity';

export class AppPermissionsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { AppPermissionsController } = await import(`${importPath}/app-permissions/controller`);
    const { AppPermissionsService } = await import(`${importPath}/app-permissions/service`);
    const { AppPermissionsUtilService } = await import(`${importPath}/app-permissions/util.service`);

    return {
      module: AppPermissionsModule,
      imports: [
        TypeOrmModule.forFeature([GroupPermissions, User, PageUser, PagePermission, QueryUser, QueryPermission]),
      ],
      controllers: [AppPermissionsController],
      providers: [
        AppPermissionsService,
        AppPermissionsUtilService,
        RolesRepository,
        PageUsersRepository,
        PagePermissionsRepository,
        QueryUsersRepository,
        QueryPermissionsRepository,
        FeatureAbilityFactory,
      ],
      exports: [AppPermissionsUtilService, AppPermissionsService],
    };
  }
}
