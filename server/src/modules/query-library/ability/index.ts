import { Injectable } from '@nestjs/common';
import { Ability, AbilityBuilder, InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { UserAllPermissions } from '@modules/app/types';
import { LibraryQuery } from '@entities/library_query.entity';
import { FEATURE_KEY } from '../constants';

type Subjects = InferSubjects<typeof LibraryQuery> | 'all';
type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;
@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  protected getSubjectType() {
    return LibraryQuery;
  }
  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], permissions: UserAllPermissions): void {
    if (!permissions.isEndUser) can(Object.values(FEATURE_KEY), LibraryQuery);
  }
}
