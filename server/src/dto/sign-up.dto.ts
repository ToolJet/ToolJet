import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class SignUpDto {
  @IsEmail()
  @Transform(({ value }) => sanitizeInput(value))
  email: string;
}
