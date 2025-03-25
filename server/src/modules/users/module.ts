import { getImportPath } from '@modules/app/constants';
import { DynamicModule } from '@nestjs/common';
import { UserRepository } from './repository';
import { SessionModule } from '@modules/session/module';
import { FeatureAbilityFactory } from './ability';
import { SessionUtilService } from '@modules/session/util.service';
import { OrganizationRepository } from '@modules/organizations/repository';
import { GroupPermissionsRepository } from '@modules/group-permissions/repository';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { MetadataUtilService } from '@modules/meta/util.service';
import { RolesRepository } from '@modules/roles/repository';
import { EncryptionService } from '@modules/encryption/service';
import { JwtService } from '@nestjs/jwt';
import { LicenseCountsService } from '@modules/licensing/services/count.service';

export class UsersModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { UsersService } = await import(`${importPath}/users/service`);
    const { UsersController } = await import(`${importPath}/users/controller`);
    const { UsersUtilService } = await import(`${importPath}/users/util.service`);

    return {
      module: UsersModule,
      imports: [await SessionModule.register(configs)],
      controllers: [UsersController],
      providers: [
        UsersService,
        UserRepository,
        UsersUtilService,
        FeatureAbilityFactory,
        SessionUtilService,
        OrganizationRepository,
        OrganizationUsersRepository,
        GroupPermissionsRepository,
        MetadataUtilService,
        RolesRepository,
        EncryptionService,
        JwtService,
        LicenseCountsService,
      ],
      exports: [UsersUtilService, UserRepository],
    };
  }
}
