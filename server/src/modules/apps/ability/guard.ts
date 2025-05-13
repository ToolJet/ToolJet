import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { App } from '@entities/app.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '../constants';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails {
    const resource = this.getResourceObject();
    switch (resource.type) {
      case APP_TYPES.FRONT_END:
        return {
          resourceType: MODULES.APP,
        };
      case APP_TYPES.WORKFLOW:
        return {
          resourceType: MODULES.WORKFLOWS,
        };
      default:
        return {
          resourceType: MODULES.APP,
        };
    }
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
