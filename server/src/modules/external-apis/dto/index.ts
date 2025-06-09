import {
  IsUUID,
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
  IsDefined,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { TjdbSchemaToLatestVersion } from '@dto/transformers/resource-transformer';
import { ValidateTooljetDatabaseImportSchema } from '@dto/validators/tooljet-database.validator';
export enum Status {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export class GroupDto {
  @IsUUID()
  @ValidateIf((o) => !o.name)
  @IsNotEmpty()
  id?: string;

  @IsString()
  @ValidateIf((o) => !o.id)
  @IsNotEmpty()
  name?: string;
}

export class WorkspaceDto {
  @IsUUID()
  @ValidateIf((o) => !o.name)
  @IsNotEmpty()
  id?: string;

  @IsString()
  @ValidateIf((o) => !o.id)
  @IsNotEmpty()
  name?: string;

  @IsEnum(USER_ROLE)
  @IsOptional()
  role?: USER_ROLE;

  @IsEnum(Status)
  @IsOptional()
  status?: Status = Status.ARCHIVED;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  @IsOptional()
  groups?: GroupDto[];
}

export class UpdateGivenWorkspaceDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  @IsOptional()
  groups?: GroupDto[];
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  password: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status = Status.ARCHIVED;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkspaceDto)
  workspaces: WorkspaceDto[];
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @IsOptional()
  password?: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}

export class UpdateUserWorkspaceDto {
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  @IsOptional()
  groups?: GroupDto[];
}

export class VersionDto {
  id: string;
  name: string;
  createdAt?: Date;
}

export class AppWithVersionsDto {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  organizationId: string;
  versions: VersionDto[];
  versionCount: number;
}

export class WorkspaceAppsResponseDto {
  apps: AppWithVersionsDto[];
  total: number;
}

export class AppImportRequestDto {
  @IsString()
  tooljet_version: string;

  // TODO: Add transformation and validation for app similar to tooljet_database
  @IsOptional()
  app: AppImportDto[];

  // Optional parameter -> To be provided in import request to import app with custom name.
  @IsOptional()
  @IsString()
  appName: string;

  //   TJ-DB field
  @IsOptional()
  // Transform the input data to the latest schema version
  // This should be applied first to ensure the data is in
  // the correct format before validation
  @Transform(TjdbSchemaToLatestVersion)
  @ValidateNested({ each: true })
  // Ensure each item is properly instantiated as ImportTooljetDatabaseDto
  // This is crucial for nested validation to work correctly
  @Type(() => ImportTooljetDatabaseDto)
  // Custom validator to check against the tooljet database schema
  // This should be applied last to validate the transformed
  // and instantiated data
  @ValidateTooljetDatabaseImportSchema({ each: true })
  tooljet_database: ImportTooljetDatabaseDto[];
}
export class AppImportDto {
  @IsDefined()
  @IsObject()
  definition: any;
}

export class ImportTooljetDatabaseDto {
  @IsUUID()
  id: string;

  @IsString()
  table_name: string;

  @IsDefined()
  schema: any;

  // @IsOptional()
  // data: boolean;
}
