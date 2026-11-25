import { IsOptional, IsUUID, IsDateString, IsInt, IsIn, Matches, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { WORKFLOW_TRIGGER_TYPE } from '@modules/workflows/types';
import { FULL_DATE } from '@modules/workflows/helpers/approval-date-range';
import { EXECUTION_LIST_SORTS, ExecutionListSort } from '@modules/workflows/types/execution-list';

// No 'unknown': it needs BullMQ job state, so it is display-only, never a SQL filter.
export const EXECUTION_STATUS_FILTERS = ['running', 'waiting', 'success', 'failed', 'terminated'] as const;

const EXECUTION_TRIGGER_FILTERS = Object.values(WORKFLOW_TRIGGER_TYPE);

// A query param given once arrives as a string, repeated as an array.
const toArray = ({ value }: { value: unknown }) => (Array.isArray(value) ? value : value ? [value] : undefined);

export class ListExecutionsDto {
  @IsOptional()
  @Transform(toArray)
  @IsIn(EXECUTION_STATUS_FILTERS, { each: true })
  status?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsIn(EXECUTION_TRIGGER_FILTERS, { each: true })
  trigger?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsUUID('all', { each: true })
  app_id?: string[];

  @IsOptional()
  @IsUUID()
  folder_id?: string;

  @IsOptional()
  @Transform(toArray)
  @IsUUID('all', { each: true })
  environment_id?: string[];

  @IsOptional()
  @IsIn(EXECUTION_LIST_SORTS)
  sort?: ExecutionListSort;

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
  per_page: number = 15;
}
