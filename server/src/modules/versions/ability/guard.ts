import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  protected getResource(): ResourceDetails {
    const resource: App = this.getResourceObject();
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
}
