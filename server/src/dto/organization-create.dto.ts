import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { sanitizeInput } from '../helpers/utils.helper';

export class OrganizationCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @MaxLength(25, { message: 'Name cannot be longer than 25 characters' })
  name: string;
}
