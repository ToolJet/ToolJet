import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { OrganizationConstant } from 'src/entities/organization_constants.entity';
import { AbilityService } from '@services/permissions-ability.service';
import { ORGANIZATION_CONSTANT_RESOURCE_ACTIONS } from 'src/constants/global.constant';

type Subjects = InferSubjects<typeof User | typeof OrganizationConstant> | 'all';

export type OrganizationConstantsAbility = Ability<[ORGANIZATION_CONSTANT_RESOURCE_ACTIONS, Subjects]>;

@Injectable()
export class OrganizationConstantsAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async organizationConstantActions(user: User, params: any) {
    const { can, build } = new AbilityBuilder<Ability<[ORGANIZATION_CONSTANT_RESOURCE_ACTIONS, Subjects]>>(
      Ability as AbilityClass<OrganizationConstantsAbility>
    );

    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
    });
    const constantPermissions = userPermission.orgConstantCRUD;

    if (constantPermissions) {
      can(
        [
          ORGANIZATION_CONSTANT_RESOURCE_ACTIONS.CREATE,
          ORGANIZATION_CONSTANT_RESOURCE_ACTIONS.DELETE,
          ORGANIZATION_CONSTANT_RESOURCE_ACTIONS.UPDATE,
        ],
        OrganizationConstant
      );
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
