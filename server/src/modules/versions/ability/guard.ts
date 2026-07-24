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

  protected getResource(request?: any): ResourceDetails | ResourceDetails[] {
    const resource: App = this.getResourceObject();
    switch (resource?.type) {
      case APP_TYPES.FRONT_END:
        return {
          resourceType: MODULES.APP,
        };
      case APP_TYPES.WORKFLOW:
        return {
          resourceType: MODULES.WORKFLOWS,
        };
      case APP_TYPES.MODULE:
        // parentAppId present -> caller may qualify for the embedded-in-editable-app
        // bypass (see FeatureAbilityFactory.defineAbilityFor). That check needs the
        // requester's APP-bucket editableAppsId, which is only computed when APP is
        // in the requested resource list, so request it too.
        return request?.query?.parentAppId
          ? [{ resourceType: MODULES.MODULES }, { resourceType: MODULES.APP }]
          : { resourceType: MODULES.MODULES };
      default:
        return null;
    }
  }
}
