import { Injectable } from '@nestjs/common';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { App } from '@entities/app.entity';
import { FeatureAbilityFactory } from '.';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }
}
