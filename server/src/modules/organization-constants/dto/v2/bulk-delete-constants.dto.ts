import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsString } from 'class-validator';

export class BulkDeleteConstantsDto {
  // Strings, not UUIDs: a list can hold read-only `.env` rows, which are skipped rather than rejected.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  ids: string[];
}
