import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeInput } from '@helpers/utils.helper';
import { AppVersionType } from '@entities/app_version.entity';

export class VersionCreateDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsNotEmpty({ message: 'Version name cannot be empty.' })
  @MaxLength(25, { message: 'Version name cannot be longer than 25 characters' })
  @Matches(/^[^\s~^:?*[\]\\@{]+$/, { message: 'Version name contains invalid characters (spaces, ~, ^, :, ?, *, [, ], \\, @, { are not allowed).' })
  versionName: string;

  @IsUUID()
  @IsOptional()
  versionFromId: string;

  @IsUUID()
  @IsOptional()
  environmentId: string;

  @IsOptional()
  versionDescription: string;

  @IsOptional()
  versionType?: AppVersionType;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  // Git single-branch: keeps exactly one draft on the default branch. When true (the
  // "Replace with new draft" action), the existing draft is atomically swapped for the new one
  // cloned from versionFromId, sidestepping the single-draft guard.
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}

export class PromoteVersionDto {
  @IsNotEmpty()
  @IsUUID()
  @Transform(({ value }) => sanitizeInput(value))
  currentEnvironmentId: string;
}
export class DraftVersionDto {
  @IsUUID()
  versionFromId: string;

  @IsUUID()
  environmentId: string;

  @IsOptional()
  versionDescription: string;

  @IsOptional()
  versionType?: AppVersionType;

  @IsOptional()
  branchId?: string;

  // Git single-branch: keeps exactly one draft on the default branch. When true (the
  // "Replace with new draft" action), the existing draft is atomically swapped for the new one.
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
