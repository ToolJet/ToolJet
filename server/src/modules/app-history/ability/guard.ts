import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { AppHistory } from '@entities/app_history.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails | ResourceDetails[] {
    return [{ resourceType: MODULES.APP_HISTORY }, { resourceType: MODULES.APP }];
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return AppHistory;
  }

  protected forwardAbility(): boolean {
    return true;
  }
}
