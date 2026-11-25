import { IsOptional, IsString, IsUUID, IsDateString, IsIn, IsInt, Matches, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FULL_DATE } from '@modules/workflows/helpers/approval-date-range';
import { APPROVAL_LIST_SORTS, ApprovalListSort } from '@modules/workflows/types/approval-list';

// A query param given once arrives as a string, repeated as an array.
const toArray = ({ value }: { value: unknown }) => (Array.isArray(value) ? value : value ? [value] : undefined);

export class ListApprovalsDto {
  @IsOptional()
  @Transform(toArray)
  status?: string[];

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
  @IsDateString()
  @Matches(FULL_DATE)
  due_from?: string;

  @IsOptional()
  @IsDateString()
  @Matches(FULL_DATE)
  due_to?: string;

  @IsOptional()
  @IsIn(APPROVAL_LIST_SORTS)
  sort?: ApprovalListSort;

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
