import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
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
  @IsBoolean()
  @IsNotEmpty()
  @IsOptional()
  value: string;
}

export class UpdateInstanceSettingsDto extends PartialType(CreateInstanceSettingsDto) {}
