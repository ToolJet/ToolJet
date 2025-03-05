import { sanitizeInput } from '@helpers/utils.helper';
import { IsString, IsOptional, IsNotEmpty, MaxLength, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { APP_TYPES } from '../constants';

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
  @Transform(({ value }) => {
    const newValue = sanitizeInput(value);
    return newValue.trim();
  })
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
}

export class ValidateAppAccessDto {
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
}

export class VersionReleaseDto {
  @IsNotEmpty()
  @IsUUID()
  @Transform(({ value }) => sanitizeInput(value))
  versionToBeReleased: string;
}
