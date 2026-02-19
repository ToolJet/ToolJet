import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../../../helpers/utils.helper';

export class CreateCustomDomainDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value)?.toLowerCase()?.trim())
  @Matches(/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, {
    message: 'Invalid domain format',
  })
  domain: string;
}
