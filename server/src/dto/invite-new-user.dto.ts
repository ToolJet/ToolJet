import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput } from '../helpers/utils.helper';

export class InviteNewUserDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @IsOptional()
  first_name: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @IsOptional()
  last_name: string;

  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  email: string;
}
