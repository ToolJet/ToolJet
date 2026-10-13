import { Exclude, Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { APP_TYPES } from '@modules/apps/constants';

export class BulkFlagsDto {
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;

  @IsOptional()
  @IsBoolean()
  skip_blocked?: boolean;
}

export class BulkMoveAppsDto extends BulkFlagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  app_ids: string[];

  @IsUUID()
  folder_id: string;
}

export class BulkDeleteAppsDto extends BulkFlagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  app_ids: string[];

  @IsEnum(APP_TYPES)
  type: APP_TYPES;
}

@Exclude()
export class BulkCountsDto {
  @Expose() allowed: number;
  @Expose() blocked: number;
  @Expose() done: number;
}

@Exclude()
export class BulkResultResponseDto {
  @Expose({ name: 'dry_run' }) dryRun: boolean;
  @Expose() applied: boolean;
  @Expose({ name: 'blocked_ids' }) blockedIds: string[];
  @Expose() counts: BulkCountsDto;
}

// Shared by every bulk endpoint: one decision for dry_run / all-or-nothing / skip_blocked.
export function bulkResult(flags: BulkFlagsDto, allowedIds: string[], blockedIds: string[]): BulkResultResponseDto {
  const applied = !flags.dry_run && (blockedIds.length === 0 || !!flags.skip_blocked);
  return Object.assign(new BulkResultResponseDto(), {
    dryRun: !!flags.dry_run,
    applied,
    blockedIds,
    counts: Object.assign(new BulkCountsDto(), {
      allowed: allowedIds.length,
      blocked: blockedIds.length,
      done: applied ? allowedIds.length : 0,
    }),
  });
}
