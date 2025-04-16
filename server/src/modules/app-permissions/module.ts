import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';
import { FeatureAbilityFactory } from './ability';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { User } from '@entities/user.entity';
import { RolesRepository } from '@modules/roles/repository';

export class AppPermissionsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { AppPermissionsController } = await import(`${importPath}/app-permissions/controller`);
    const { AppPermissionsService } = await import(`${importPath}/app-permissions/service`);
    const { AppPermissionsUtilService } = await import(`${importPath}/app-permissions/util.service`);

    return {
      module: AppPermissionsModule,
      imports: [TypeOrmModule.forFeature([GroupPermissions, User])],
      controllers: [AppPermissionsController],
      providers: [AppPermissionsService, AppPermissionsUtilService, RolesRepository, FeatureAbilityFactory],
      exports: [AppPermissionsUtilService],
    };
  }
}
