import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  first_name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  last_name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  organization: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  role: string;

  @IsBoolean()
  @IsOptional()
  new_signup: boolean;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
