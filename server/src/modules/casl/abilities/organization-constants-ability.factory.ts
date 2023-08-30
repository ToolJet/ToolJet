import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';

type Actions = 'createOrganizationConstant' | 'deleteOrganizationConstant';
type Subjects = InferSubjects<typeof User | typeof OrganizationConstant> | 'all';

export type OrganizationConstantsAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class OrganizationConstantsAbilityFactory {
  constructor(private usersService: UsersService) {}

  async organizationConstantActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(
      Ability as AbilityClass<OrganizationConstantsAbility>
    );

    if (await this.usersService.userCan(user, 'create', 'OrganizationConstant')) {
      can('createOrganizationConstant', OrganizationConstant);
    }

    if (await this.usersService.userCan(user, 'delete', 'OrganizationConstant')) {
      can('deleteOrganizationConstant', OrganizationConstant);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
