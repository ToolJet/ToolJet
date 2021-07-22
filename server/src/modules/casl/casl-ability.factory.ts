import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { OrganizationUsersService } from '@services/organization_users.service';

type Actions = 'changeRole' | 'archiveUser';

type Subjects = InferSubjects<typeof OrganizationUser| typeof User> | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {

  constructor(
    private organizationUsersService: OrganizationUsersService,
  ) { }

  async organizationUserActions(user: User, params: any) {
    const { can, cannot, build } = new AbilityBuilder<  
      Ability<[Actions, Subjects]>
    >(Ability as AbilityClass<AppAbility>);

    const organizationUser = await this.organizationUsersService.findOne(params.id);
    const currentUserBelongsToSameOrg = organizationUser.organizationId === user.organizationId;

    if(user.isAdmin && currentUserBelongsToSameOrg) {
      can('changeRole', User);
      can('archiveUser', User);
    }

    return build({
      detectSubjectType: item => item.constructor as ExtractSubjectType<Subjects>
    });
  }
}
