import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { App } from '@entities/app.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.APP_PERMISSIONS,
    };
  }
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  protected forwardAbility(): boolean {
    return true;
  }
}
