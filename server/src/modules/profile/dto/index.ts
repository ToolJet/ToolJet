import { sanitizeInput } from '@helpers/utils.helper';
import { IsString, IsOptional, IsNotEmpty, MaxLength, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProfileUpdateDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  first_name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  last_name: string;
}

export class MfaConfirmDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class MfaDisableDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
