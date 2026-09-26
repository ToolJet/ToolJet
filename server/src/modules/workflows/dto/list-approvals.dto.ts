import { IsOptional, IsString, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  // The repository has no defense of its own against a bad page: page <= 0 produces a negative
  // SQL OFFSET, which Postgres rejects at runtime as an uncaught exception. Validate here so an
  // out-of-range value is rejected as a 400 before it ever reaches the repository.
  // No `?` here (unlike the filters above): the default keeps this always a `number` on the
  // wire into WorkflowApprovalsService.list(), which takes `page: number` — not
  // `number | undefined`. `@IsOptional()` still makes the query param itself optional.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  // Bounded so a caller cannot request an unbounded page size.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page: number = 10;
}
