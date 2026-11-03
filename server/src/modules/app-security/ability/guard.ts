import { Injectable } from '@nestjs/common';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { AppSecurityAbilityFactory, ScanPolicyAbilityFactory, ScanPolicySubject } from '.';

/** Per-app routes; ValidAppGuard runs first and resolves the app within the session's workspace. */
@Injectable()
export class AppSecurityAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return AppSecurityAbilityFactory;
  }

  protected getSubjectType() {
    return App;
  }

  // Loads the per-app edit lists (editableAppsId) for the requester.
  protected getResource(): ResourceDetails {
    return { resourceType: MODULES.APP };
  }
}

@Injectable()
export class ScanPolicyAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return ScanPolicyAbilityFactory;
  }

  protected getSubjectType() {
    return ScanPolicySubject;
  }
}
