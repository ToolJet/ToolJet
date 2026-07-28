import { sanitizeInput } from '@helpers/utils.helper';
import { IsString, IsOptional, IsNotEmpty, MaxLength, IsBoolean, IsUUID, IsEnum, IsIn } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { APP_TYPES } from '../constants';

export enum AppBuilderMode {
  AI = 'ai',
  VISUAL = 'visual',
}

export class AppCreateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Maximum length has been reached.' })
  icon?: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(APP_TYPES, { message: 'Invalid app type.' })
  type: string;

  @IsOptional()
  @IsString()
  prompt?: string;
}

export class AppUpdateDto {
  @IsString()
  @IsOptional()
  current_version_id: string;

  @IsBoolean()
  @IsOptional()
  is_public: boolean;

  @IsBoolean()
  @IsOptional()
  is_maintenance_on: boolean;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'App name should not be empty' })
  @MaxLength(50, { message: 'Maximum length has been reached.' })
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  slug: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  icon: string;

  @IsOptional()
  @IsEnum(AppBuilderMode, { message: 'app_builder_mode must be either "ai" or "visual"' })
  app_builder_mode?: AppBuilderMode;
}

export class ValidateAppAccessDto {
  @IsString()
  @IsOptional()
  accessType?: string;

  @IsString()
  @IsOptional()
  versionName: string;

  @IsString()
  @IsOptional()
  environmentName: string;

  @IsString()
  @IsOptional()
  versionId: string;

  @IsString()
  @IsOptional()
  envId: string;
}

@Exclude()
export class ValidateAppAccessResponseDto {
  @Expose()
  id: string;

  @Expose()
  slug: string;

  @Expose()
  type: string;

  @Expose()
  versionName: string;

  @Expose()
  environmentName: string;

  @Expose()
  environmentId: string;

  @Expose()
  versionId: string;

  @Expose()
  canEdit?: boolean;
}

export class AppListDto {
  @IsString()
  @IsOptional()
  page: string;

  @IsString()
  @IsOptional()
  folderId: string;

  @IsString()
  @IsOptional()
  searchKey: string;

  @IsString()
  @IsOptional()
  type: string;

  @IsOptional()
  @IsIn(['picker'])
  context?: string;
}

export class VersionReleaseDto {
  @IsNotEmpty()
  @IsUUID()
  @Transform(({ value }) => sanitizeInput(value))
  versionToBeReleased: string;
}
