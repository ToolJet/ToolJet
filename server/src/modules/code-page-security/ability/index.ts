import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';

/** The CASL subject for the workspace's code page settings. */
export class CodePageSecuritySubject {}

type Subjects = InferSubjects<typeof CodePageSecuritySubject> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return CodePageSecuritySubject;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], permissions: UserAllPermissions): void {
    // Every member's code pages run under the policy, so every member reads it; only admins change it.
    can(FEATURE_KEY.GET_CODE_PAGE_SECURITY, CodePageSecuritySubject);
    if (permissions.superAdmin || permissions.isAdmin)
      can(FEATURE_KEY.UPDATE_CODE_PAGE_SECURITY, CodePageSecuritySubject);
  }
}
