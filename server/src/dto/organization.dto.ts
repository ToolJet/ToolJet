import { Transform } from 'class-transformer';
import { IsAlphanumeric, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { sanitizeInput } from '../helpers/utils.helper';

export class OrganizationCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @IsAlphanumeric('en-US', { message: 'Workspace name must contain only letters and numbers' })
  @MaxLength(40, { message: 'Workspace name cannot be longer than 40 characters' })
  name: string;
}

export class OrganizationUpdateDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsAlphanumeric('en-US', { message: 'Workspace name must contain only letters and numbers' })
  @MaxLength(40, { message: 'Workspace name cannot be longer than 40 characters' })
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
