import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceDetails } from '@modules/app/types';
import { AppEnvironment } from '@entities/app_environments.entity';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return AppEnvironment;
  }
  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.APP_ENVIRONMENTS,
    };
  }
}
