import { IsString, IsOptional, IsNotEmpty, MinLength, IsEmail, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  first_name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  last_name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  password: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  companyName: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  companySize: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  organizationToken: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  role: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  source: string;
}

export class CreateAdminDto {
  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  password: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  companyName: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  companySize: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  role: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  workspace: string;

  @IsBoolean()
  @IsOptional()
  requestedTrial: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
