import { Injectable } from '@nestjs/common';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { FeatureAbilityFactory } from '.';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceDetails } from '@modules/app/types';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  protected forwardAbility(): boolean {
    return true;
  }

  protected getResource(): ResourceDetails | ResourceDetails[] {
    return [
      {
        resourceType: MODULES.APP,
      },
    ];
  }
}
