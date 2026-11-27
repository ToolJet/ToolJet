import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';
import { LibraryQuery } from '@entities/library_query.entity';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.QUERY_LIBRARY,
    };
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return LibraryQuery;
  }
}
