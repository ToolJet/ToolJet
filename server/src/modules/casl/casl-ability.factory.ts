import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from '@services/users.service';

type Actions =
  | 'changeRole'
  | 'archiveUser'
  | 'inviteUser'
  | 'createGroupPermission'
  | 'updateAppGroupPermission'
  | 'updateGroupPermission';

type Subjects = InferSubjects<typeof OrganizationUser | typeof User> | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private usersService: UsersService) {}

  async organizationUserActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<AppAbility>);

    const isAdmin = await this.usersService.hasGroup(user, 'admin');
    if (isAdmin) {
      can('inviteUser', User);
      can('archiveUser', User);
      can('changeRole', User);
      can('createGroupPermission', User);
      can('updateAppGroupPermission', User);
      can('updateGroupPermission', User);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
