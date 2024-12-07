import { User } from 'src/entities/user.entity';
import { InferSubjects, AbilityBuilder, Ability, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'src/entities/data_source.entity';
import { AbilityService } from '@services/permissions-ability.service';
import { GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS } from 'src/constants/global.constant';

type Actions =
  | GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.CREATE
  | GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.UPDATE
  | GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.DELETE
  | 'authorizeOauthForSource'
  | 'fetchEnvironments';

type Subjects = InferSubjects<typeof User | typeof DataSource> | 'all';

export type GlobalDataSourcesAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class GlobalDataSourceAbilityFactory {
  constructor(private abilityService: AbilityService) {}

  async globalDataSourceActions(user: User) {
    const { can, build } = new AbilityBuilder<Ability<[Actions, Subjects]>>(
      Ability as AbilityClass<GlobalDataSourcesAbility>
    );
    const userPermission = await this.abilityService.resourceActionsPermission(user, {
      organizationId: user.organizationId,
    });
    const globalDataSourcePermission = userPermission.isAdmin;
    if (globalDataSourcePermission) {
      can(GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.CREATE, DataSource);
    }

    if (globalDataSourcePermission) {
      can(GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.UPDATE, DataSource);
    }

    if (globalDataSourcePermission) {
      can(GLOBAL_DATA_SOURCE_RESOURCE_ACTIONS.DELETE, DataSource);
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
