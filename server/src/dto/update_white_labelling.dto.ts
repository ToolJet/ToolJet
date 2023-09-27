import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';
export class UpdateWhiteLabellingDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  appLogo: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  pageTitle: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  favicon: string;
}
