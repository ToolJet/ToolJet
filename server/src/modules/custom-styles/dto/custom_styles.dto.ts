import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from 'src/helpers/utils.helper';

export class CustomStylesCreateDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  styles?: string;
}
