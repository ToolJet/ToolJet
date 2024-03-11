import { IsNotEmpty, IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';
export class CreateInstanceSettingsDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @IsOptional()
  key: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  value: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  labelKey: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  helperText: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  helperTextKey: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  dataType: string;
}

export class InstanceConfigsUpdateDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(250, { message: 'Domains cannot be longer than 250 characters' })
  allowedDomains?: string;

  @IsOptional()
  @IsBoolean()
  enableSignUp?: boolean;

  @IsOptional()
  @IsBoolean()
  enableWorkspaceConfiguration?: boolean;
}

export class UpdateInstanceSettingsDto extends PartialType(CreateInstanceSettingsDto) {}
