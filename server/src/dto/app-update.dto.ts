import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class AppUpdateDto {
  @IsString()
  @IsOptional()
  current_version_id: string;

  @IsBoolean()
  @IsOptional()
  is_public: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
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
