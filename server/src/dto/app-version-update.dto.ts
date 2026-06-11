import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '../helpers/utils.helper';
import { AppVersionStatus } from '@entities/app_version.entity';

export class AppVersionUpdateDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
  @IsNotEmpty()
  @MaxLength(25, { message: 'Version name cannot be longer than 25 characters' })
  @Matches(/^[^\s~^:?*[\]\\@{]+$/, { message: 'Version name contains invalid characters (spaces, ~, ^, :, ?, *, [, ], \\, @, { are not allowed).' })
  name: string;

  @IsBoolean()
  @IsOptional()
  showViewerNavigation: boolean;

  @IsUUID()
  @IsOptional()
  homePageId: string;

  @IsOptional()
  globalSettings: any;

  @IsOptional()
  pageSettings: any;

  // Workflow related fields
  @IsOptional()
  @IsString()
  @IsUUID()
  currentEnvironmentId: string;

  @IsOptional()
  definition: any;

  @IsOptional()
  @IsBoolean()
  is_user_switched_version: boolean;

  @IsOptional()
  status: AppVersionStatus;

  @IsOptional()
  description: string;
}
