import { Injectable } from '@nestjs/common';
import { CodePageSecuritySubject, FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return CodePageSecuritySubject;
  }
}
