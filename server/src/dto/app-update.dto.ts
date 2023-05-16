import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class AppUpdateDto {
  @IsString()
  @IsOptional()
  current_version_id: string;

  @IsBoolean()
  @IsOptional()
  is_public: boolean;

  @IsBoolean()
  @IsOptional()
  is_maintenance_on: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @Matches('^[A-Za-z0-9 ]+$', '', { message: 'App name must only contain letters and numbers' })
  @MaxLength(40, { message: 'App name cannot be longer than 40 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  slug: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  icon: string;
}
