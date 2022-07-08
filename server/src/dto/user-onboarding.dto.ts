import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class UserOnboardingDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  email: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  org: string;
}
