import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';
import { sanitizeInput } from '../helpers/utils.helper';

export class LoginConfigsUpdateDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(250, { message: 'Domain cannot be longer than 250 characters' })
  domain?: string;

  @IsOptional()
  @IsBoolean()
  enableSignUp?: boolean;

  @IsOptional()
  @IsBoolean()
  automaticSsoLogin?: boolean;

  @IsOptional()
  @IsBoolean()
  inheritSSO?: boolean;
}
