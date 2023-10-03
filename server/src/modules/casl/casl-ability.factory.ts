import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from '@services/users.service';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';

type Actions =
  | 'changeRole'
  | 'archiveUser'
  | 'inviteUser'
  | 'accessGroupPermission'
  | 'createGroupPermission'
  | 'deleteGroupPermission'
  | 'updateGroupPermission'
  | 'accessAuditLogs'
  | 'viewAllUsers'
  | 'updateOrganizations'
  | 'updateGroupUserPermission'
  | 'updateGroupAppPermission'
  | 'updateGroupDataSourcePermission';

type Subjects = InferSubjects<typeof OrganizationUser | typeof User> | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private usersService: UsersService, private licenseService: LicenseService) {}

  async organizationUserActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<AppAbility>);

    const isAdmin = await this.usersService.hasGroup(user, 'admin');
    const licenseTerms = await this.licenseService.getLicenseTerms([LICENSE_FIELD.VALID, LICENSE_FIELD.AUDIT_LOGS]);
    const isLicenseValid = licenseTerms[LICENSE_FIELD.VALID];

    if (isAdmin) {
      can('inviteUser', User);
      can('archiveUser', User);
      can('changeRole', User);
      can('accessGroupPermission', User);
      can('updateOrganizations', User);
      can('viewAllUsers', User);
      can('updateGroupUserPermission', User);
      can('updateGroupAppPermission', User);

      if (isLicenseValid) {
        can('createGroupPermission', User);
        can('deleteGroupPermission', User);
        can('updateGroupPermission', User);
        can('updateGroupDataSourcePermission', User);

        if (licenseTerms[LICENSE_FIELD.AUDIT_LOGS]) {
          can('accessAuditLogs', User);
        }
      }
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
