import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class VersionCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty()
  @MinLength(0, { message: 'Version name cannot be empty.' })
  @MaxLength(25, { message: 'Version name cannot be longer than 25 characters' })
  versionName: string;

  @IsUUID()
  @IsOptional()
  versionFromId: string;
}
