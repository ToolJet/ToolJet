import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import {
  InferSubjects,
  AbilityBuilder,
  Ability,
  AbilityClass,
  ExtractSubjectType,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { OrganizationUsersService } from '@services/organization_users.service';
import { App } from 'src/entities/app.entity';

type Actions = 'changeRole' | 'archiveUser' | 'inviteUser';

type Subjects = InferSubjects<typeof OrganizationUser | typeof User> | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private organizationUsersService: OrganizationUsersService) {}

  async organizationUserActions(user: User, params: any) {
    const { can, cannot, build } = new AbilityBuilder<
      Ability<[Actions, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    const currentUserBelongsToSameOrg = await this.isSameOrganisation(user, params);

    if (user.isAdmin) can('inviteUser', User);
    if (user.isAdmin && currentUserBelongsToSameOrg) {
      can('archiveUser', User);
      can('changeRole', User);
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }

  async isSameOrganisation(currentUser, params) {
    if (!params.id) return false;
    const organizationUser = await this.organizationUsersService.findOne(
      params.id,
    );
    if (!organizationUser) return false;

    return organizationUser.organizationId === currentUser.organizationId;
  }
}
