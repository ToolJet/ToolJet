import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, MinLength, ArrayMinSize, IsArray, IsOptional } from 'class-validator';

import { sanitizeInput } from 'src/helpers/utils.helper';

export class CreatePostgrestTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(31, { message: 'Table name must be less than 32 characters' })
  @MinLength(1, { message: 'Table name must be at least 1 character' })
  table_name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Table must have at least 1 column' })
  columns: PostgrestTableColumnDto[];
}

export class PostgrestTableColumnDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(31, { message: 'Column name must be less than 32 characters' })
  @MinLength(1, { message: 'Column name must be at least 1 character' })
  column_name: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  data_type: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  constraint: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  default: string;
}

export class RenamePostgrestTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(31, { message: 'Table name must be less than 32 characters' })
  @MinLength(1, { message: 'Table name must be at least 1 character' })
  table_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(31, { message: 'Table name must be less than 32 characters' })
  @MinLength(1, { message: 'Table name must be at least 1 character' })
  new_table_name: string;
}
