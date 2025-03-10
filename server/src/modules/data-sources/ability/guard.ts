import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { DataSource } from '@entities/data_source.entity';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceDetails } from '@modules/app/types';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return DataSource;
  }
  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.GLOBAL_DATA_SOURCE,
    };
  }
  protected forwardAbility(): boolean {
    return true;
  }
}
