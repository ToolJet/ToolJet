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

@Exclude()
export class CreditsUsageCustomLimitDto {
  @Expose() monthly?: number;
  @Expose() addon?: number;
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
  /** Builders only: pools with a custom limit; absent = default for both. */
  @Expose() @Type(() => CreditsUsageCustomLimitDto) customLimit?: CreditsUsageCustomLimitDto;
}

@Exclude()
export class CreditsUsageNoticeDefaultDto {
  @Expose() before: number;
  @Expose() after: number;
}

@Exclude()
export class CreditsUsageNoticeDefaultsDto {
  @Expose() @Type(() => CreditsUsageNoticeDefaultDto) monthly?: CreditsUsageNoticeDefaultDto;
  @Expose() @Type(() => CreditsUsageNoticeDefaultDto) addon?: CreditsUsageNoticeDefaultDto;
}

/** After a plan change or add-on expiry shrank the pool and limits were adjusted; dismissed per admin in the browser. */
@Exclude()
export class CreditsUsageNoticeDto {
  @Expose() kind: 'plan_change' | 'addon_expiry';
  @Expose() on: string | null;
  @Expose() detectedAt: string;
  /** Pools whose default fell or lost a custom limit. */
  @Expose() @Type(() => CreditsUsageNoticeDefaultsDto) defaults: CreditsUsageNoticeDefaultsDto;
  @Expose() reduced: number;
}

@Exclude()
export class CreditsUsageResponseDto {
  @Expose() @Type(() => CreditsUsageCycleDto) cycle: CreditsUsageCycleDto;
  @Expose() @Type(() => CreditsUsagePoolsDto) pools: CreditsUsagePoolsDto;
  /** First attributed ledger row, all time; null until one exists. */
  @Expose() trackingSince: string | null;
  @Expose() @Type(() => CreditsUsageNoticeDto) notices: CreditsUsageNoticeDto[];
  /** Self-hosted only: the instance's active workspaces. */
  @Expose() @Type(() => CreditsUsageWorkspaceDto) workspaces?: CreditsUsageWorkspaceDto[];
  /** The licence has per-builder limits (Enterprise, trial). False: `limits.enabled` is false and saves get 451. */
  @Expose() limitsAvailable: boolean;
  @Expose() @Type(() => CreditsUsageLimitsDto) limits: CreditsUsageLimitsDto;
  @Expose() @Type(() => CreditsUsageRowDto) rows: CreditsUsageRowDto[];
}

@Exclude()
export class MyCreditsMonthlyDto {
  @Expose() used: number;
  @Expose() limit: number;
  @Expose() left: number;
  @Expose() renewsOn: string | null;
}

@Exclude()
export class MyCreditsAddonDto {
  /** Can exceed `limit`: the overshoot. */
  @Expose() used: number;
  @Expose() limit: number;
  @Expose() left: number;
  @Expose() expiresOn: string | null;
}

/** `enabled: false` (limits off, not a builder, AI not on credits) carries no numbers. */
@Exclude()
export class MyCreditsResponseDto {
  @Expose() enabled: boolean;
  @Expose() cycleStart?: string | null;
  @Expose() @Type(() => MyCreditsMonthlyDto) monthly?: MyCreditsMonthlyDto;
  @Expose() @Type(() => MyCreditsAddonDto) addon?: MyCreditsAddonDto;
  /** The get-credits-balance body, so the client reads both in one call. */
  @Expose() pool?: Record<string, unknown>;
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
  /** Omitted = keep the flag (values-only save). Required when `defaults` is omitted. */
  @ValidateIf((o: UpdateCreditLimitsDto) => o.enabled !== undefined || o.defaults === undefined)
  @IsBoolean()
  enabled?: boolean;

  /** Omitted = keep the saved defaults (toggle only). */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreditLimitDefaultsDto)
  defaults?: CreditLimitDefaultsDto;
}

const WHOLE_NUMBER = { message: 'Enter a whole number of 1 or more.' };

/** One builder's custom limit per pool; null or omitted = use the default. Both null = Reset to default. */
export class UpdateBuilderLimitDto {
  @IsOptional() @IsInt(WHOLE_NUMBER) @Min(1, WHOLE_NUMBER) monthly?: number | null;
  @IsOptional() @IsInt(WHOLE_NUMBER) @Min(1, WHOLE_NUMBER) addon?: number | null;
}
