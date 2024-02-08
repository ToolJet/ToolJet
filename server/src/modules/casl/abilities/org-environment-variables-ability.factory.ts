import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';

type Actions =
  | 'createOrgEnvironmentVariable'
  | 'updateOrgEnvironmentVariable'
  | 'deleteOrgEnvironmentVariable'
  | 'fetchEnvironments';

type Subjects = InferSubjects<typeof User | typeof OrgEnvironmentVariable> | 'all';

export type OrgEnvironmentVariablesAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class OrgEnvironmentVariablesAbilityFactory {
  constructor(private usersService: UsersService) {}

  async orgEnvironmentVariableActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(
      Ability as AbilityClass<OrgEnvironmentVariablesAbility>
    );

    if (await this.usersService.userCan(user, 'create', 'OrgEnvironmentVariable')) {
      can('createOrgEnvironmentVariable', OrgEnvironmentVariable);
      can('fetchEnvironments', OrgEnvironmentVariable);
    }

    if (await this.usersService.userCan(user, 'update', 'OrgEnvironmentVariable')) {
      can('updateOrgEnvironmentVariable', OrgEnvironmentVariable);
    }

    if (await this.usersService.userCan(user, 'delete', 'OrgEnvironmentVariable')) {
      can('deleteOrgEnvironmentVariable', OrgEnvironmentVariable);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
