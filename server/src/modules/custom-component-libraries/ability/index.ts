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
    // v1: no role restriction on library ops (DECISIONS locked #6 / scope cut) — any workspace
    // member can use the CLI endpoints; token management likewise until RBAC lands.
    can(Object.values(FEATURE_KEY), CustomComponentLibrary);
  }
}
