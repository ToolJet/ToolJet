import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

type Subjects = InferSubjects<typeof WorkspaceBranch> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return WorkspaceBranch;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], userAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin, isBuilder } = userAllPermissions;
    // Super admins and workspace admins have full branch management access
    if (superAdmin || isAdmin) {
      can(
        [
          FEATURE_KEY.LIST_BRANCHES,
          FEATURE_KEY.CREATE_BRANCH,
          FEATURE_KEY.SWITCH_BRANCH,
          FEATURE_KEY.DELETE_BRANCH,
          FEATURE_KEY.PUSH_WORKSPACE,
          FEATURE_KEY.PULL_WORKSPACE,
          FEATURE_KEY.CHECK_UPDATES,
          FEATURE_KEY.LIST_REMOTE_BRANCHES,
          FEATURE_KEY.FETCH_PULL_REQUESTS,
          FEATURE_KEY.ENSURE_DRAFT,
        ],
        WorkspaceBranch
      );
    }
    // Builders can create branches, commit (push), pull, switch, and view — but not delete
    if (isBuilder) {
      can(
        [
          FEATURE_KEY.LIST_BRANCHES,
          FEATURE_KEY.CREATE_BRANCH,
          FEATURE_KEY.SWITCH_BRANCH,
          FEATURE_KEY.PUSH_WORKSPACE,
          FEATURE_KEY.PULL_WORKSPACE,
          FEATURE_KEY.CHECK_UPDATES,
          FEATURE_KEY.LIST_REMOTE_BRANCHES,
          FEATURE_KEY.FETCH_PULL_REQUESTS,
          FEATURE_KEY.ENSURE_DRAFT,
        ],
        WorkspaceBranch
      );
    }
  }
}
