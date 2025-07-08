import { DynamicModule } from '@nestjs/common';
import { UserRepository } from '@modules/users/repositories/repository';
import { RolesRepository } from '@modules/roles/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { RolesModule } from '@modules/roles/module';
import { FeatureAbilityFactory } from './ability';
import { SubModule } from '@modules/app/sub-module';

export class GroupPermissionsModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const {
      GroupPermissionsService,
      GroupPermissionsUtilService,
      GroupPermissionsControllerV2,
      GranularPermissionsService,
      GranularPermissionsUtilService,
      GroupPermissionLicenseUtilService,
      GroupPermissionsDuplicateService,
      GranularPermissionsController,
    } = await this.getProviders(configs, 'group-permissions', [
      'service',
      'util.service',
      'controller',
      'services/granular-permissions.service',
      'util-services/granular-permissions.util.service',
      'util-services/license.util.service',
      'services/duplicate.service',
      'controllers/granular-permissions.controller',
    ]);

    return {
      module: GroupPermissionsModule,
      imports: [await RolesModule.register(configs)],
      controllers: [GranularPermissionsController, GroupPermissionsControllerV2],
      providers: [
        GranularPermissionsService,
        GroupPermissionsService,
        GroupPermissionsDuplicateService,
        GroupPermissionsUtilService,
        GranularPermissionsUtilService,
        GroupPermissionLicenseUtilService,
        OrganizationUsersRepository,
        RolesRepository,
        UserRepository,
        GroupPermissionsRepository,
        FeatureAbilityFactory,
      ],
      exports: [GroupPermissionsUtilService],
    };
  }
}
