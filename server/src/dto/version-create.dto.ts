import { IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class VersionCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @Length(1, 25)
  versionName: string;

  @IsUUID()
  @IsOptional()
  versionFromId: string;
}
