import { Injectable } from '@nestjs/common';
import { GitSyncAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';

@Injectable()
export class GitSyncAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.GIT_SYNC,
    };
  }

  protected getAbilityFactory() {
    return GitSyncAbilityFactory;
  }

  protected getSubjectType() {
    return OrganizationGitSync;
  }
}
