import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../../../helpers/utils.helper';

export class UpdateWhiteLabellingDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  white_label_logo: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  white_label_text: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  white_label_favicon: string;
}
