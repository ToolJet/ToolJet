import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { EncryptionModule } from '@modules/encryption/module';
import { UserRepository } from '@modules/users/repository';
import { RolesRepository } from '@modules/roles/repository';
import { OrganizationUsersRepository } from './repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { SessionModule } from '@modules/session/module';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { RolesModule } from '@modules/roles/module';
import { SetupOrganizationsModule } from '@modules/setup-organization/module';
import { FeatureAbilityFactory } from './ability';
import { OrganizationRepository } from '@modules/organizations/repository';

export class OrganizationUsersModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { IS_GET_CONTEXT } = configs || {};

    const { OrganizationUsersController } = await import(
      `${await getImportPath(IS_GET_CONTEXT)}/organization-users/controller`
    );
    const { OrganizationUsersService } = await import(`${await getImportPath(IS_GET_CONTEXT)}/organization-users/service`);
    const { OrganizationUsersUtilService } = await import(
      `${await getImportPath(IS_GET_CONTEXT)}/organization-users/util.service`
    );
    const { UserDetailsService } = await import(
      `${await getImportPath(IS_GET_CONTEXT)}/organization-users/services/user-details.service`
    );
    return {
      module: OrganizationUsersModule,
      imports: [
        await EncryptionModule.register(configs),
        await SessionModule.register(configs),
        await InstanceSettingsModule.register(configs),
        await RolesModule.register(configs),
        await GroupPermissionsModule.register(configs),
        await SetupOrganizationsModule.register(configs),
      ],
      controllers: [OrganizationUsersController],
      providers: [
        OrganizationUsersService,
        OrganizationUsersUtilService,
        OrganizationUsersRepository,
        OrganizationRepository,
        RolesRepository,
        UserRepository,
        UserDetailsService,
        GroupPermissionsRepository,
        FeatureAbilityFactory,
      ],
      exports: [OrganizationUsersUtilService],
    };
  }
}
