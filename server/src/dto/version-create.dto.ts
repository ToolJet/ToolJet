import { IsNotEmpty, MaxLength, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class VersionCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty({ message: 'The version name should not be empty' })
  @MaxLength(255, { message: 'The version name cannot be more than 255 characters' })
  versionName: string;

  @IsUUID()
  @IsOptional()
  versionFromId: string;
}
