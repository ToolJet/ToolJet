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
  Matches,
  ValidateIf,
  IsNotEmpty,
  IsDefined,
  IsObject,
  IsUrl,
  IsInt,
  Min,
  IsNumber,
  IsPositive,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { TjdbSchemaToLatestVersion } from '@dto/transformers/resource-transformer';
import { ValidateTooljetDatabaseImportSchema } from '@dto/validators/tooljet-database.validator';
export enum Status {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  INVITED = 'invited',
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
  status?: Status;

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
  status?: Status = Status.INVITED;

  @IsString()
  @IsOptional()
  defaultOrganizationId: string;

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

  @IsString()
  @IsOptional()
  defaultOrganizationId?: string;
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

export class OrganizationGitCreateDto {
  @IsString()
  organizationId: string;

  @IsString()
  gitUrl: string;
}

export class GithubHttpsConfigDTO extends OrganizationGitCreateDto {
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @IsString()
  @IsNotEmpty()
  githubAppId: string;

  @IsString()
  @IsNotEmpty()
  githubAppInstallationId: string;

  @IsString()
  @IsNotEmpty()
  githubAppPrivateKey: string;

  @IsUrl()
  @IsOptional()
  githubEnterpriseUrl?: string;

  @IsUrl()
  @IsOptional()
  githubEnterpriseApiUrl?: string;
}

export class AppGitPullDto {
  @IsString()
  appId: string;

  @IsString()
  organizationId: string;
}

export class AppGitPushDto {
  @IsString()
  commitMessage: string;
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

export class GeneratePATDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsUUID()
  @IsOptional()
  appId: string;

  @IsString()
  @IsOptional()
  appSlug?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessionExpiry?: number; // In minutes

  @IsOptional()
  @IsInt()
  @Min(1)
  patExpiry?: number; // In minutes
}

export class ValidatePATSessionDto {
  @IsUUID()
  appId: string;

  @IsString()
  accessToken: string;
}

export class AutoDeployBodyDto {
  @IsString()
  @IsOptional()
  versionId?: string;

  @IsString()
  @IsOptional()
  versionName?: string;
}

export class SaveVersionBodyDto {
  @IsString()
  @IsOptional()
  @MaxLength(25, { message: 'Version name cannot be longer than 25 characters' })
  @Matches(/^[^\s~^:?*[\]\\@{]+$/, {
    message: 'Version name contains invalid characters (spaces, ~, ^, :, ?, *, [, ], \\, @, { are not allowed).',
  })
  name?: string;
}

// Export groups DTOs
export {
  CreateGroupExternalDto,
  GranularPermissionDto,
  GranularPermissionResourceType,
  AppEnvironment,
  AppPermissionsDto,
  DataSourcePermissionsDto,
  FolderPermissionsDto,
  WorkspacePermissionsDto,
  WorkflowPermissionsDto,
} from './groups.dto';

export class WorkspaceModuleDto {
  id: string;
  name: string;
  icon: string;
  slug: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceModulesResponseDto {
  modules: WorkspaceModuleDto[];
  total: number;
}

export class ModuleImportDto {
  @IsDefined()
  @IsObject()
  definition: any;
}

export class ModuleImportRequestDto {
  @IsString()
  tooljet_version: string;

  @IsOptional()
  app?: ModuleImportDto[];

  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @Transform(TjdbSchemaToLatestVersion)
  @ValidateNested({ each: true })
  @Type(() => ImportTooljetDatabaseDto)
  @ValidateTooljetDatabaseImportSchema({ each: true })
  tooljet_database?: ImportTooljetDatabaseDto[];
}

export class UserDetailKeyValueDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  value: string;
}

export class UpdateUserMetadataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDetailKeyValueDto)
  userDetails: UserDetailKeyValueDto[];
}

export enum TjdbFilterOperator {
  EQUALS = 'equals',
  GREATER_THAN = 'greater than',
  GREATER_THAN_OR_EQUAL = 'greater than or equal',
  LESS_THAN = 'less than',
  LESS_THAN_OR_EQUAL = 'less than or equal',
  NOT_EQUAL = 'not equal',
  LIKE = 'like',
  ILIKE = 'ilike',
  MATCH = 'match',
  IMATCH = 'imatch',
  IN = 'in',
  IS = 'is',
}

export enum TjdbSortDirection {
  ASCENDING = 'Ascending',
  DESCENDING = 'Descending',
}

const IS_OPERATOR_ALLOWED_VALUES = ['null', 'true', 'false', 'notNull'];

function IsTjdbFilterValue(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsTjdbFilterValue',
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const filterCondition = args.object as TjdbFilterConditionDto;
          if (filterCondition.operator === TjdbFilterOperator.IN) {
            return Array.isArray(value) && value.length > 0;
          }
          if (filterCondition.operator === TjdbFilterOperator.IS) {
            return IS_OPERATOR_ALLOWED_VALUES.includes(String(value));
          }
          return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
        },
        defaultMessage(args: ValidationArguments) {
          const filterCondition = args.object as TjdbFilterConditionDto;
          if (filterCondition.operator === TjdbFilterOperator.IN) {
            return 'value must be a non-empty array when operator is "in"';
          }
          if (filterCondition.operator === TjdbFilterOperator.IS) {
            return `value must be one of: ${IS_OPERATOR_ALLOWED_VALUES.join(', ')} when operator is "is"`;
          }
          return 'value must be a string, number, or boolean';
        },
      },
    });
  };
}

export class TjdbFilterConditionDto {
  @IsString()
  @IsNotEmpty()
  column!: string;

  @IsEnum(TjdbFilterOperator, {
    message: `operator must be one of: ${Object.values(TjdbFilterOperator).join(', ')}`,
  })
  operator!: TjdbFilterOperator;

  @IsTjdbFilterValue()
  value!: string | number | boolean | (string | number)[];
}

export class TjdbSortConditionDto {
  @IsString()
  @IsNotEmpty()
  column!: string;

  @IsEnum(TjdbSortDirection, {
    message: `direction must be one of: ${Object.values(TjdbSortDirection).join(', ')}`,
  })
  direction!: TjdbSortDirection;
}

export class ExportTjdbTableAsCsvDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TjdbFilterConditionDto)
  filters?: TjdbFilterConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TjdbSortConditionDto)
  sort?: TjdbSortConditionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  select?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
