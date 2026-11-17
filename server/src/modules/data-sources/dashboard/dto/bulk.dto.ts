import { ArrayMinSize, ArrayUnique, IsArray, IsIn, IsUUID } from 'class-validator';
import { BulkFlagsDto, BulkResultResponseDto, bulkResult } from '@modules/apps/dashboard/dto/bulk.dto';

export { BulkResultResponseDto, bulkResult };

export class BulkDataSourcesDto extends BulkFlagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  data_source_ids: string[];
}

export class BulkDeleteDataSourcesDto extends BulkDataSourcesDto {}

export class BulkRemoveDataSourcesDto extends BulkDataSourcesDto {}

export class BulkMoveDataSourcesDto extends BulkDataSourcesDto {
  @IsUUID()
  folder_id: string;
}

export class BulkDeleteDataSourceFoldersDto extends BulkFlagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  folder_ids: string[];

  @IsIn(['folder_only', 'folder_and_data_sources'])
  mode: 'folder_only' | 'folder_and_data_sources';
}
