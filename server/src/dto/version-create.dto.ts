import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class VersionCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  versionName: string;

  @IsUUID()
  @IsOptional()
  versionFromId: string;
}
