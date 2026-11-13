import { IsOptional, IsString, IsUUID, IsDateString, IsInt, Matches, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FULL_DATE } from '@modules/workflows/helpers/approval-date-range';

export class ListApprovalsDto {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  status?: string[];

  @IsOptional()
  @IsUUID()
  app_id?: string;

  @IsOptional()
  @IsUUID()
  folder_id?: string;

  @IsOptional()
  @IsUUID()
  environment_id?: string;

  @IsOptional()
  @IsString()
  approver?: string;

  @IsOptional()
  @IsDateString()
  @Matches(FULL_DATE)
  from?: string;

  @IsOptional()
  @IsDateString()
  @Matches(FULL_DATE)
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page: number = 10;
}
