import { Exclude, Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { APP_TYPES } from '@modules/apps/constants';

export class BulkFlagsDto {
  @IsOptional()
  @IsUUID()
  branch_id?: string;
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
export class BulkResultResponseDto {
  @Expose({ name: 'blocked_ids' }) blockedIds: string[];
}

export class BulkDeleteFoldersDto extends BulkFlagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  folder_ids: string[];

  @IsIn(['folder_only', 'folder_and_apps'])
  mode: 'folder_only' | 'folder_and_apps';

  @IsEnum(APP_TYPES)
  type: APP_TYPES;
}

export function bulkResult(blockedIds: string[]): BulkResultResponseDto {
  return Object.assign(new BulkResultResponseDto(), { blockedIds });
}
