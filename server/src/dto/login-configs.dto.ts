import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsEnum,
  IsBoolean,
} from 'class-validator';
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
