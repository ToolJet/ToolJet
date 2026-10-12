import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { APP_TYPES } from '@modules/apps/constants';
import { AppActions, FolderActions } from '../actions';

export class ListAppsV2QueryDto {
  @IsEnum(APP_TYPES)
  type: APP_TYPES;

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  page_size = 50;

  @IsOptional()
  @IsUUID()
  folder_id?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() ? value.trim() : undefined))
  @IsString()
  @Length(1, 100)
  search?: string;
}

export interface RefDto {
  id: string;
  name: string;
}

@Exclude()
export class DashboardEntryDto {
  @Expose() kind: 'app' | 'folder';
  @Expose() id: string;
  @Expose() name: string;
  @Expose() slug?: string;
  @Expose() icon?: string | null;
  @Expose() folder?: RefDto | null;
  @Expose({ name: 'released_version' }) releasedVersion?: string | null;
  @Expose({ name: 'app_count' }) appCount?: number;
  @Expose({ name: 'last_modified_at' }) lastModifiedAt: Date;
  @Expose({ name: 'modified_by' }) modifiedBy: RefDto | null;
  @Expose({ name: 'last_viewed_at' }) lastViewedAt: Date | null;
  @Expose() owner: RefDto | null;
  @Expose() pinned: boolean;
  @Expose() actions: AppActions | FolderActions;
}

@Exclude()
export class ListAppsV2ResponseDto {
  @Expose() @Type(() => DashboardEntryDto) items: DashboardEntryDto[];
  @Expose() page: number;
  @Expose({ name: 'page_size' }) pageSize: number;
  @Expose() total: number;
  @Expose() counts: { pinned: number; folders: number; apps: number };
  @Expose() folder: RefDto | null;
}
