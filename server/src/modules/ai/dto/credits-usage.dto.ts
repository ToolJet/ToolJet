import { Exclude, Expose, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsIn, IsInt, IsOptional, Min, ValidateIf, ValidateNested } from 'class-validator';

export type CreditsUsageRowKind = 'builder' | 'archived' | 'nonBuilder' | 'unknown' | 'unattributed';

@Exclude()
export class CreditsUsageCycleDto {
  @Expose() start: string | null;
  @Expose() end: string | null;
}

@Exclude()
export class CreditsUsagePoolDto {
  /** Cycle-start pool: remaining now + net spend this cycle. */
  @Expose() total: number;
  @Expose() remaining: number;
  @Expose() used: number;
  @Expose() endsAt: string | null;
}

@Exclude()
export class CreditsUsagePoolsDto {
  @Expose() @Type(() => CreditsUsagePoolDto) monthly: CreditsUsagePoolDto;
  @Expose() @Type(() => CreditsUsagePoolDto) addon: CreditsUsagePoolDto;
}

@Exclude()
export class CreditsUsageWorkspaceDto {
  @Expose() id: string;
  @Expose() name: string;
}

@Exclude()
export class CreditsUsageWorkspaceSplitDto {
  @Expose() organizationId: string | null;
  @Expose() monthly: number;
  @Expose() addon: number;
}

@Exclude()
export class CreditsUsageLimitDto {
  @Expose() monthly: number;
  @Expose() addon: number;
}

/** One pool's default limit, resolved for the current builders. */
@Exclude()
export class CreditsUsagePoolDefaultDto {
  @Expose() mode: 'equal_share' | 'custom';
  @Expose() value: number | null;
  @Expose() max: number;
  @Expose() effective: number;
  @Expose() note: 'noCredits' | 'noBuilders' | 'tooManyBuilders' | 'reduced' | null;
  @Expose() unallocated: number;
  @Expose() unallocatedPct: number;
  @Expose() pool: number;
  @Expose() buildersWithoutCustom: number;
  @Expose() customTotal: number;
}

@Exclude()
export class CreditsUsageLimitsDto {
  @Expose() enabled: boolean;
  @Expose() builderCount: number;
  @Expose() customCount: number;
  @Expose() @Type(() => CreditsUsagePoolDefaultDto) monthly: CreditsUsagePoolDefaultDto;
  @Expose() @Type(() => CreditsUsagePoolDefaultDto) addon: CreditsUsagePoolDefaultDto;
}

@Exclude()
export class CreditsUsageRowDto {
  @Expose() kind: CreditsUsageRowKind;
  @Expose() userId?: string;
  @Expose() name?: string;
  @Expose() email?: string;
  /** Self-hosted only: workspaces the person belongs to (for builders, only those they can edit). */
  @Expose() workspaceIds?: string[];
  @Expose() monthly: number;
  @Expose() addon: number;
  @Expose() @Type(() => CreditsUsageWorkspaceSplitDto) byWorkspace?: CreditsUsageWorkspaceSplitDto[];
  /** Builders only: effective limit per pool, also while limits are off. */
  @Expose() @Type(() => CreditsUsageLimitDto) limit?: CreditsUsageLimitDto;
}

@Exclude()
export class CreditsUsageResponseDto {
  @Expose() @Type(() => CreditsUsageCycleDto) cycle: CreditsUsageCycleDto;
  @Expose() @Type(() => CreditsUsagePoolsDto) pools: CreditsUsagePoolsDto;
  /** First attributed ledger row, all time; null until one exists. */
  @Expose() trackingSince: string | null;
  /** Self-hosted only: the instance's active workspaces. */
  @Expose() @Type(() => CreditsUsageWorkspaceDto) workspaces?: CreditsUsageWorkspaceDto[];
  @Expose() @Type(() => CreditsUsageLimitsDto) limits: CreditsUsageLimitsDto;
  @Expose() @Type(() => CreditsUsageRowDto) rows: CreditsUsageRowDto[];
}

export class CreditLimitDefaultDto {
  @IsIn(['equal_share', 'custom'])
  mode: 'equal_share' | 'custom';

  @ValidateIf((o: CreditLimitDefaultDto) => o.mode === 'custom')
  @IsInt()
  @Min(1)
  value?: number;
}

export class CreditLimitDefaultsDto {
  @IsDefined() @ValidateNested() @Type(() => CreditLimitDefaultDto) monthly: CreditLimitDefaultDto;
  @IsDefined() @ValidateNested() @Type(() => CreditLimitDefaultDto) addon: CreditLimitDefaultDto;
}

export class UpdateCreditLimitsDto {
  @IsBoolean()
  enabled: boolean;

  /** Omitted = keep the saved defaults (toggle only). */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditLimitDefaultsDto)
  defaults?: CreditLimitDefaultsDto;
}
