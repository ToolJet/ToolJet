import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput } from '../helpers/utils.helper';

export class InviteNewUserDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  first_name: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  last_name: string;

  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  email: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groups: string[];
}
