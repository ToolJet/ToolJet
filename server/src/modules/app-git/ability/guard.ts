import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { AppGitSync } from '@entities/app_git_sync.entity';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails | ResourceDetails[] {
    return [{ resourceType: MODULES.APP_GIT }, { resourceType: MODULES.APP }];
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return AppGitSync;
  }
}
