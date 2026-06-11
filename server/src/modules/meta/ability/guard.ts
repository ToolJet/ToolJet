import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from './index';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { Metadata } from '@entities/metadata.entity';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return Metadata;
  }
}
