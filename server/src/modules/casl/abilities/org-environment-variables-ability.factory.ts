import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { AbilityService } from '@services/permissions-ability.service';

type Actions =
  | 'createOrgEnvironmentVariable'
  | 'updateOrgEnvironmentVariable'
  | 'deleteOrgEnvironmentVariable'
  | 'fetchEnvironments';

type Subjects = InferSubjects<typeof User | typeof OrgEnvironmentVariable> | 'all';

export type OrgEnvironmentVariablesAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class OrgEnvironmentVariablesAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async orgEnvironmentVariableActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(
      Ability as AbilityClass<OrgEnvironmentVariablesAbility>
    );
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
    });
    const constantPermissions = userPermission.orgConstantCRUD;

    if (constantPermissions) {
      can('createOrgEnvironmentVariable', OrgEnvironmentVariable);
      can('fetchEnvironments', OrgEnvironmentVariable);
    }

    if (constantPermissions) {
      can('updateOrgEnvironmentVariable', OrgEnvironmentVariable);
    }

    if (constantPermissions) {
      can('deleteOrgEnvironmentVariable', OrgEnvironmentVariable);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
