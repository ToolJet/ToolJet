import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceDetails } from '@modules/app/types';
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

  private getAppResourceType(request: { tj_app: App }): MODULES {
    const appResource: App = request.tj_app;
    switch (appResource.type) {
      case APP_TYPES.MODULE:
        return MODULES.MODULES;
      case APP_TYPES.WORKFLOW:
        return MODULES.WORKFLOWS;
      default:
        return MODULES.APP;
    }
  }
  protected getResource(request: { tj_app: App }): ResourceDetails | ResourceDetails[] {
    const appResource: MODULES = this.getAppResourceType(request);
    return [
      {
        resourceType: appResource,
      },
      {
        resourceType: MODULES.GLOBAL_DATA_SOURCE,
      },
    ];
  }

  protected forwardAbility(): boolean {
    return true;
  }
}
