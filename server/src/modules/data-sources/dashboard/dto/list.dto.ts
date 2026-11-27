import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { DataSourceActions, FolderActions } from '../actions';

export class ListDataSourcesV2QueryDto {
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
export class DataSourceDashboardEntryDto {
  @Expose() kind: 'data_source' | 'folder';
  @Expose() id: string;
  @Expose() name: string;
  @Expose({ name: 'data_source_kind' }) dataSourceKind?: string;
  @Expose({ name: 'plugin_id' }) pluginId?: string | null;
  @Expose() type?: string;
  @Expose({ name: 'is_synced' }) isSynced?: boolean;
  @Expose({ name: 'is_dummy' }) isDummy?: boolean;
  @Expose({ name: 'co_relation_id' }) coRelationId?: string | null;
  @Expose() folder?: RefDto | null;
  @Expose({ name: 'data_source_count' }) dataSourceCount?: number;
  @Expose({ name: 'last_modified_at' }) lastModifiedAt: Date;
  @Expose({ name: 'modified_by' }) modifiedBy: RefDto | null;
  @Expose({ name: 'last_viewed_at' }) lastViewedAt: Date | null;
  @Expose() owner: RefDto | null;
  @Expose() pinned: boolean;
  @Expose() actions: DataSourceActions | FolderActions;
}

@Exclude()
export class ListDataSourcesV2ResponseDto {
  @Expose() @Type(() => DataSourceDashboardEntryDto) items: DataSourceDashboardEntryDto[];
  @Expose() page: number;
  @Expose({ name: 'page_size' }) pageSize: number;
  @Expose() total: number;
  @Expose() counts: { pinned: number; folders: number; data_sources: number };
  @Expose() folder: RefDto | null;
}
