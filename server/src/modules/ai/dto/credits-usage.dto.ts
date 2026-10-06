import { Exclude, Expose, Type } from 'class-transformer';

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
export class CreditsUsageRowDto {
  @Expose() kind: CreditsUsageRowKind;
  @Expose() userId?: string;
  @Expose() name?: string;
  @Expose() email?: string;
  /** Self-hosted only: workspaces the person belongs to (active memberships for builders). */
  @Expose() workspaceIds?: string[];
  @Expose() monthly: number;
  @Expose() addon: number;
  @Expose() @Type(() => CreditsUsageWorkspaceSplitDto) byWorkspace?: CreditsUsageWorkspaceSplitDto[];
}

@Exclude()
export class CreditsUsageResponseDto {
  @Expose() @Type(() => CreditsUsageCycleDto) cycle: CreditsUsageCycleDto;
  @Expose() @Type(() => CreditsUsagePoolsDto) pools: CreditsUsagePoolsDto;
  /** First attributed ledger row, all time; null until one exists. */
  @Expose() trackingSince: string | null;
  /** Self-hosted only: the instance's active workspaces. */
  @Expose() @Type(() => CreditsUsageWorkspaceDto) workspaces?: CreditsUsageWorkspaceDto[];
  @Expose() @Type(() => CreditsUsageRowDto) rows: CreditsUsageRowDto[];
}
