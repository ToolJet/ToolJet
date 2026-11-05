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

  // The GET answer says whether the caller may write, so the editor opens read-only when not.
  protected forwardAbility(): boolean {
    return true;
  }

  // Only front-end apps have one (set on the request by ValidAppGuard).
  protected getResource(): ResourceDetails | ResourceDetails[] {
    const resource: App = this.getResourceObject();
    return resource?.type === APP_TYPES.FRONT_END ? { resourceType: MODULES.APP } : null;
  }
}
