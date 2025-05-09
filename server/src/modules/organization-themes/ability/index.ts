import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { FEATURE_KEY } from '../constants';
import { OrganizationThemes } from '@entities/organization_themes.entity';

type Subjects = InferSubjects<typeof OrganizationThemes> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return OrganizationThemes;
  }

  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    const { superAdmin, isAdmin } = UserAllPermissions;
    if (superAdmin || isAdmin) {
      can([FEATURE_KEY.THEMES_CREATE], OrganizationThemes);
      can([FEATURE_KEY.THEMES_DELETE], OrganizationThemes);
      can([FEATURE_KEY.THEMES_GET_ALL], OrganizationThemes);
      can([FEATURE_KEY.THEMES_UPDATE_DEFAULT], OrganizationThemes);
      can([FEATURE_KEY.THEMES_UPDATE_DEFINITION], OrganizationThemes);
      can([FEATURE_KEY.THEMES_UPDATE_NAME], OrganizationThemes);
    }
  }
}
