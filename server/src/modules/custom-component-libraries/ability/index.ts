import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';

type Subjects = InferSubjects<typeof CustomComponentLibrary> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return CustomComponentLibrary;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    // member can use the CLI endpoints; token management likewise until RBAC lands.
    const { superAdmin, isAdmin } = UserAllPermissions;
    const everyoneKeys = Object.values(FEATURE_KEY).filter((key) => key !== FEATURE_KEY.DELETE_LIBRARY);
    can(everyoneKeys, CustomComponentLibrary);
    // DELETE_LIBRARY is the one destructive admin-page op — backend matches the AdminRoute UI.
    if (isAdmin || superAdmin) {
      can([FEATURE_KEY.DELETE_LIBRARY], CustomComponentLibrary);
    }
  }
}
