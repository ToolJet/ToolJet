import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput, lowercaseString } from 'src/helpers/utils.helper';

export class UserOnboardingDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return lowercaseString(newValue);
  })
  email: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  org: string;
}
