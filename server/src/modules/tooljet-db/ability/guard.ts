import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { InternalTable } from '@entities/internal_table.entity';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return InternalTable;
  }
}
