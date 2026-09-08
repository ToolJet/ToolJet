import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(request?: any): ResourceDetails | ResourceDetails[] {
    // Modules resolve via their own MODULES.MODULES bucket (granular module permissions),
    // not the front-end app bucket — same mapping the ability factory reads.
    const appResource = request?.tj_app?.type === APP_TYPES.MODULE ? MODULES.MODULES : MODULES.APP;
    return [{ resourceType: MODULES.APP_GIT }, { resourceType: appResource }];
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }
}
