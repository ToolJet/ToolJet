import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export enum variableType {
  client,
  server,
}

export class CreateEnvironmentVariableDto {
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
  @IsEnum(variableType)
  variable_type: string;

  @IsBoolean()
  @IsOptional()
  encrypted: boolean;
}

export class UpdateEnvironmentVariableDto extends PartialType(CreateEnvironmentVariableDto) {}
