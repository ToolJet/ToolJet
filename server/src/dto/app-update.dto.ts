import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
  @IsNotEmpty()
  @MaxLength(50, { message: 'Maximum length has been reached.' })
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
