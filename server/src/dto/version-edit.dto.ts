import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class VersionEditDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  name: string;

  @IsOptional()
  definition: any;
}
