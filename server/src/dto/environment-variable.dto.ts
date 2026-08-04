import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export enum VariableType {
  CLIENT = 'client',
  SERVER = 'server',
}

export class CreateEnvironmentVariableDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  variable_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  value?: string;

  @IsOptional()
  @IsEnum(VariableType)
  variable_type?: VariableType;

  @IsOptional()
  @IsBoolean()
  encrypted?: boolean;
}

export class UpdateEnvironmentVariableDto extends PartialType(
  CreateEnvironmentVariableDto,
) {}