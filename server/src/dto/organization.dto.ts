import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { sanitizeInput } from '../helpers/utils.helper';

export class OrganizationCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @MaxLength(25, { message: 'Name cannot be longer than 25 characters' })
  name: string;
}

export class OrganizationUpdateDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(25, { message: 'Name cannot be longer than 25 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(250, { message: 'Domain cannot be longer than 250 characters' })
  domain?: string;

  @IsBoolean()
  @IsOptional()
  enableSignUp?: boolean;

  @IsBoolean()
  @IsOptional()
  inheritSSO?: boolean;
}
