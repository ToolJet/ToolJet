import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../../../helpers/utils.helper';

export class UpdateWhiteLabellingDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  logo: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  text: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  favicon: string;
}
