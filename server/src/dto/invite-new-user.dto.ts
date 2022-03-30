import { IsEmail, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class InviteNewUserDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  first_name: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  last_name: string;

  @IsEmail()
  @Transform(({ value }) => sanitizeInput(value))
  email: string;
}
