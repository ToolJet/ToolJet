import { Injectable } from '@nestjs/common';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { DataSource } from '@entities/data_source.entity';
import { FeatureAbilityFactory } from '.';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getSubjectType() {
    return DataSource;
  }

  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected forwardAbility(): boolean {
    return true;
  }
}
