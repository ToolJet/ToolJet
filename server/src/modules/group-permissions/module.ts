import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { UserRepository } from '@modules/users/repository';
import { RolesRepository } from '@modules/roles/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { RolesModule } from '@modules/roles/module';
import { FeatureAbilityFactory } from './ability';

export class GroupPermissionsModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    const { GroupPermissionsService } = await import(`${importPath}/group-permissions/service`);
    const { GroupPermissionsUtilService } = await import(`${importPath}/group-permissions/util.service`);
    const { GroupPermissionsControllerV2 } = await import(`${importPath}/group-permissions/controller`);
    const { GranularPermissionsService } = await import(
      `${importPath}/group-permissions/services/granular-permissions.service`
    );
    const { GranularPermissionsUtilService } = await import(
      `${importPath}/group-permissions/util-services/granular-permissions.util.service`
    );
    const { GroupPermissionLicenseUtilService } = await import(
      `${importPath}/group-permissions/util-services/license.util.service`
    );
    const { GroupPermissionsDuplicateService } = await import(
      `${importPath}/group-permissions/services/duplicate.service`
    );
    const { GranularPermissionsController } = await import(
      `${importPath}/group-permissions/controllers/granular-permissions.controller`
    );

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
