import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { ORGANIZATION_RESOURCE_ACTIONS } from 'src/constants/global.constant';
import { AbilityService } from '@services/permissions-ability.service';

type Actions =
  | ORGANIZATION_RESOURCE_ACTIONS.EDIT_ROLE
  | ORGANIZATION_RESOURCE_ACTIONS.USER_ARCHIVE
  | ORGANIZATION_RESOURCE_ACTIONS.USER_INVITE
  | ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS
  | ORGANIZATION_RESOURCE_ACTIONS.UPDATE
  | ORGANIZATION_RESOURCE_ACTIONS.UPDATE_USERS
  | ORGANIZATION_RESOURCE_ACTIONS.VIEW_ALL_USERS;

type Subjects = InferSubjects<typeof OrganizationUser | typeof User> | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async organizationUserActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(Ability as AbilityClass<AppAbility>);
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
    });
    const adminPermission = userPermission.isAdmin;
    if (adminPermission) {
      can(ORGANIZATION_RESOURCE_ACTIONS.USER_INVITE, User);
      can(ORGANIZATION_RESOURCE_ACTIONS.USER_ARCHIVE, User);
      can(ORGANIZATION_RESOURCE_ACTIONS.EDIT_ROLE, User);
      can(ORGANIZATION_RESOURCE_ACTIONS.ACCESS_PERMISSIONS, User);
      can(ORGANIZATION_RESOURCE_ACTIONS.UPDATE, User);
      can(ORGANIZATION_RESOURCE_ACTIONS.VIEW_ALL_USERS, User);
      can(ORGANIZATION_RESOURCE_ACTIONS.UPDATE_USERS, User);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
