import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Without page and limit the route returns every schedule of the workflow; with either, one page.
export class ListSchedulesDto {
  @IsUUID()
  app_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID()
  environment_id?: string;

  @IsOptional()
  @IsUUID()
  workflow_id?: string;
}
