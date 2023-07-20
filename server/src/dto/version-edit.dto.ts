import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';

export class VersionEditDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(25, { message: 'Version name cannot be longer than 25 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  currentEnvironmentId: string;

  @IsOptional()
  definition: any;

  @IsOptional()
  @IsBoolean()
  is_user_switched_version: boolean;
}
