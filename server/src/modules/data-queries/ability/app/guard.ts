import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceDetails } from '@modules/app/types';
import { App } from '@entities/app.entity';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }
  protected getResource(): ResourceDetails | ResourceDetails[] {
    return [
      {
        resourceType: MODULES.APP,
      },
    ];
  }

  protected forwardAbility(): boolean {
    return true;
  }
}
