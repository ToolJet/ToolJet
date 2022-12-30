import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
  value: string;
}

export class UpdateInstanceSettingsDto extends PartialType(CreateInstanceSettingsDto) {}
