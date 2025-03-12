import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { User } from '@entities/user.entity';
import { AbilityGuard } from '@modules/app/guards/ability.guard';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return User;
  }
}
