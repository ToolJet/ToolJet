import { IsOptional, IsUUID, IsDateString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { WORKFLOW_TRIGGER_TYPE } from '@modules/workflows/types';

// No 'unknown': it needs BullMQ job state, so it is display-only, never a SQL filter.
export const EXECUTION_STATUS_FILTERS = ['running', 'waiting', 'success', 'failed', 'terminated'] as const;

const EXECUTION_TRIGGER_FILTERS = Object.values(WORKFLOW_TRIGGER_TYPE);

export class ListExecutionsDto {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  @IsIn(EXECUTION_STATUS_FILTERS, { each: true })
  status?: string[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  @IsIn(EXECUTION_TRIGGER_FILTERS, { each: true })
  trigger?: string[];

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
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
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
  per_page: number = 15;
}
