import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class EnvironmentVariableDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @IsOptional()
  variable_name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  value: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  variable_type: string;

  @IsBoolean()
  @IsOptional()
  encrypted: boolean;
}
