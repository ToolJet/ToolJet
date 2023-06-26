import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class VersionCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty({ message: 'Version name cannot be empty.' })
  @MaxLength(25, { message: 'Version name cannot be longer than 25 characters' })
  versionName: string;

  @IsUUID()
  @IsOptional()
  versionFromId: string;

  @IsUUID()
  @IsOptional()
  envrionmentId: string;
}
