import { User } from 'src/entities/user.entity';
import { AbilityBuilder, Ability } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { FEATURE_KEY } from '../constants';
import { InferSubjects } from '@casl/ability';
import { AbilityFactory } from '@modules/app/ability-factory';
import { AbilityService } from '@modules/ability/service';
import { UserAllPermissions } from '@modules/app/types';

type Subjects = InferSubjects<typeof User> | 'all';
export type FeatureAbility = Ability<[FEATURE_KEY, Subjects]>;

@Injectable()
export class FeatureAbilityFactory extends AbilityFactory<FEATURE_KEY, Subjects> {
  constructor(protected abilityService: AbilityService) {
    super(abilityService);
  }

  protected getSubjectType(): new (...args: any[]) => User {
    return User;
  }

  // Since all routes are public, we don't need to redefine `defineAbilityFor`.
  protected defineAbilityFor(can: AbilityBuilder<FeatureAbility>['can'], UserAllPermissions: UserAllPermissions): void {
    return;
  }
}
