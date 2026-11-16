import { Exclude, Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { TIME_GRAINS, TimeGrain } from '../constants';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** `start` and `end` are UTC dates (YYYY-MM-DD); `end` is exclusive. */
export class AnalyticsRangeQueryDto {
  @Matches(DATE_ONLY, { message: 'start must be a date (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  start: string;

  @Matches(DATE_ONLY, { message: 'end must be a date (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  end: string;
}

export class AnalyticsSeriesQueryDto extends AnalyticsRangeQueryDto {
  @IsOptional()
  @IsIn(TIME_GRAINS)
  grain?: TimeGrain;
}

class PagedRangeQueryDto extends AnalyticsRangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export const APP_USERS_SORTS = ['last_opened_desc', 'last_opened_asc'] as const;
export type AppUsersSort = (typeof APP_USERS_SORTS)[number];

export class AppUsersQueryDto extends PagedRangeQueryDto {
  @IsOptional()
  @IsIn(APP_USERS_SORTS)
  sort?: AppUsersSort;
}

export const WORKSPACE_APPS_SORTS = ['active_users_desc', 'active_users_asc', 'last_opened_desc'] as const;
export type WorkspaceAppsSort = (typeof WORKSPACE_APPS_SORTS)[number];

export class WorkspaceAppsQueryDto extends PagedRangeQueryDto {
  @IsOptional()
  @IsIn(WORKSPACE_APPS_SORTS)
  sort?: WorkspaceAppsSort;
}

@Exclude()
export class AnalyticsStatusResponseDto {
  /** The instance records app opens (ANALYTICS_ENABLED is not false). */
  @Expose() collecting: boolean;
  @Expose() licensed: boolean;
  /** First recorded open in this workspace; charts mark it. Null before any data. */
  @Expose() trackingStartedAt: string | null;
}

@Exclude()
export class AnalyticsRangeDto {
  @Expose() start: string;
  @Expose() end: string;
  @Expose() previousStart: string;
  /** False when the previous period reaches past retained data: previous-period numbers are then null. */
  @Expose() previousAvailable: boolean;
}

@Exclude()
export class LifecycleCountsDto {
  @Expose() new: number;
  @Expose() retained: number;
  @Expose() reactivated: number;
  @Expose() inactive: number;
}

@Exclude()
export class WorkspaceSummaryResponseDto {
  @Expose() @Type(() => AnalyticsRangeDto) range: AnalyticsRangeDto;
  @Expose() activeUsers: number;
  @Expose() previousActiveUsers: number | null;
  /** (active − previous) ÷ previous; null when the previous period had no active users or is unavailable. */
  @Expose() trend: number | null;
  /** Retained ÷ previous; null when the previous period had no active users or is unavailable. */
  @Expose() retention: number | null;
  @Expose() activeApps: number;
  @Expose() releasedApps: number;
  @Expose() @Type(() => LifecycleCountsDto) lifecycle: LifecycleCountsDto;
}

@Exclude()
export class SeriesPointDto {
  /** First day of the bucket (YYYY-MM-DD). */
  @Expose() bucket: string;
  @Expose() activeUsers: number;
}

@Exclude()
export class ActiveUsersSeriesResponseDto {
  @Expose() @Type(() => AnalyticsRangeDto) range: AnalyticsRangeDto;
  @Expose() grain: TimeGrain;
  @Expose() @Type(() => SeriesPointDto) current: SeriesPointDto[];
  @Expose() @Type(() => SeriesPointDto) previous: SeriesPointDto[];
}

@Exclude()
export class ReachDto {
  @Expose() active: number;
  /** Users who can open the app today. Historical access is not stored. */
  @Expose() withAccess: number;
  /** active ÷ withAccess, capped at 1; null when nobody has access. */
  @Expose() rate: number | null;
}

@Exclude()
export class WorkspaceAppRowDto {
  @Expose() appId: string;
  @Expose() name: string;
  @Expose() icon: string | null;
  @Expose() activeUsers: number;
  @Expose() previousActiveUsers: number | null;
  @Expose() trend: number | null;
  @Expose() @Type(() => ReachDto) reach: ReachDto;
  @Expose() lastOpenedAt: string | null;
  @Expose() tags: string[];
}

@Exclude()
export class WorkspaceAppsResponseDto {
  @Expose() @Type(() => WorkspaceAppRowDto) items: WorkspaceAppRowDto[];
  @Expose() total: number;
}

@Exclude()
export class AppActiveUsersDto {
  @Expose() total: number;
  @Expose() new: number;
  @Expose() retained: number;
  @Expose() reactivated: number;
}

@Exclude()
export class AnalyticsAppDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() slug: string | null;
  @Expose() icon: string | null;
}

@Exclude()
export class AppSummaryResponseDto {
  @Expose() @Type(() => AnalyticsRangeDto) range: AnalyticsRangeDto;
  @Expose() @Type(() => AnalyticsAppDto) app: AnalyticsAppDto;
  @Expose() @Type(() => AppActiveUsersDto) activeUsers: AppActiveUsersDto;
  @Expose() previousActiveUsers: number | null;
  @Expose() trend: number | null;
  @Expose() retention: number | null;
  @Expose() @Type(() => ReachDto) reach: ReachDto;
  /** Most recent open ever, regardless of the range. */
  @Expose() lastOpenedAt: string | null;
  @Expose() tags: string[];
}

@Exclude()
export class AppUserRowDto {
  @Expose() userId: string;
  /** Null for a user no longer in the workspace (`removed`). */
  @Expose() name: string | null;
  @Expose() email: string | null;
  @Expose() removed: boolean;
  @Expose() lastOpenedAt: string;
}

@Exclude()
export class AppUsersResponseDto {
  @Expose() @Type(() => AppUserRowDto) items: AppUserRowDto[];
  @Expose() total: number;
}
