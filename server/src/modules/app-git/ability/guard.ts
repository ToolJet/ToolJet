import { Injectable } from '@nestjs/common';
import { AppGitAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { App } from '@entities/app.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

@Injectable()
export class AppGitAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.APP_GIT,
    };
  }

  protected getAbilityFactory() {
    return AppGitAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  protected forwardAbility(): boolean {
    return true;
  }
}
