import { Injectable } from '@nestjs/common';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { FeatureAbilityFactory } from '.';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return OrganizationConstant;
  }
}
