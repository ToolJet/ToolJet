import { DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from '@modules/users/repositories/repository';
import { RolesRepository } from '@modules/roles/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { RolesModule } from '@modules/roles/module';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';
import { GroupAdmin } from '@entities/group_admin.entity';

export class GroupPermissionsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const {
      GroupPermissionsService,
      GroupPermissionsUtilService,
      GroupPermissionsControllerV2,
      GranularPermissionsService,
      GranularPermissionsUtilService,
      GroupPermissionLicenseUtilService,
      GroupPermissionsDuplicateService,
      GranularPermissionsController,
      GroupAdminService,
      GroupAdminController,
      FeatureAbilityFactory: LoadedAbilityFactory,
    } = await this.getProviders(configs, 'group-permissions', [
      'service',
      'util.service',
      'controller',
      'services/granular-permissions.service',
      'util-services/granular-permissions.util.service',
      'util-services/license.util.service',
      'services/duplicate.service',
      'controllers/granular-permissions.controller',
      'services/group-admin.service',
      'controllers/group-admin.controller',
      'ability/index',
    ]);

    return {
      module: GroupPermissionsModule,
      imports: [TypeOrmModule.forFeature([GroupAdmin]), await RolesModule.register(configs)],
      controllers: isMainImport ? [GranularPermissionsController, GroupPermissionsControllerV2, GroupAdminController] : [],
      providers: [
        GranularPermissionsService,
        GroupPermissionsService,
        GroupPermissionsDuplicateService,
        GroupPermissionsUtilService,
        GranularPermissionsUtilService,
        GroupPermissionLicenseUtilService,
        GroupAdminService,
        OrganizationUsersRepository,
        RolesRepository,
        UserRepository,
        GroupPermissionsRepository,
        { provide: FeatureAbilityFactory, useClass: LoadedAbilityFactory },
      ],
      exports: [GroupPermissionsUtilService, GranularPermissionsUtilService, GroupAdminService],
    };
  }
}
