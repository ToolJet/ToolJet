import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { resourceTypeForAppType } from './resource-type';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(request?: any): ResourceDetails | ResourceDetails[] {
    // Modules and workflows resolve via their own granular-permission buckets, not the
    // front-end app bucket — same mapping the ability factory reads. Keep this in lockstep
    // with FeatureAbilityFactory.defineAbilityFor: the guard decides which bucket gets
    // POPULATED and the factory decides which gets READ, so a change to one alone denies
    // every non-admin request for that type.
    const appResource = resourceTypeForAppType(request?.tj_app?.type);
    return [{ resourceType: MODULES.APP_GIT }, { resourceType: appResource }];
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }
}
