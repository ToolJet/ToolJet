import { Exclude, Expose, Type } from 'class-transformer';
import { GateKey, PlanId } from '../constants/plan-catalog';

@Exclude()
export class PlanCatalogPlanDto {
  @Expose()
  id: PlanId;

  @Expose()
  label: string;
}

@Exclude()
export class PlanCatalogDto {
  @Expose()
  @Type(() => PlanCatalogPlanDto)
  plans: PlanCatalogPlanDto[];

  @Expose()
  gates: Partial<Record<GateKey, PlanId | null>>;
}
