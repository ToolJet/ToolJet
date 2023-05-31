import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { sanitizeInput } from '../helpers/utils.helper';

export class OrganizationCreateDto {
  @IsString()
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue?.trim() || '';
  })
  @IsNotEmpty({
    message: "Workspace name can't be empty",
  })
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name: string;
}

export class OrganizationUpdateDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue?.trim() || '';
  })
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name?: string;

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
  inheritSSO?: boolean;
}
