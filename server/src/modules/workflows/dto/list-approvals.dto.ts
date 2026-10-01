import { IsOptional, IsString, IsUUID, IsDateString, IsInt, Matches, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// A full calendar date, optionally with a time: `2026-09` would parse as 1 September.
const FULL_DATE = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

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
