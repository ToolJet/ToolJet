import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { App } from '@entities/app.entity';
import { FEATURE_KEY } from '../constants';

type Subjects = InferSubjects<typeof App> | 'all';
export type AppUsageAnalyticsAbility = Ability<[FEATURE_KEY, Subjects]>;

/** Usage analytics is visible to workspace admins (and instance super admins) only. */
@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return App;
  }

  protected defineAbilityFor(
    can: AbilityBuilder<AppUsageAnalyticsAbility>['can'],
    userPermissions: UserAllPermissions
  ): void {
    const { superAdmin, isAdmin } = userPermissions;
    if (isAdmin || superAdmin) {
      can(Object.values(FEATURE_KEY), App);
    }
  }
}
