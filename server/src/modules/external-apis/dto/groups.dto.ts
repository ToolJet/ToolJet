import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Environment types for app permissions
export enum AppEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  RELEASED = 'released',
}

// Resource types for granular permissions
export enum GranularPermissionResourceType {
  APP = 'app',
  DATA_SOURCE = 'data_source',
  WORKFLOW = 'workflow',
}

// Custom validator for hideFromDashboard - can only be true when canEdit is false (view mode)
@ValidatorConstraint({ name: 'hideFromDashboardRequiresViewMode', async: false })
class HideFromDashboardRequiresViewModeConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as AppPermissionsDto;
    // hideFromDashboard is only configurable when canEdit is false
    return !(obj.hideFromDashboard === true && obj.canEdit === true);
  }

  defaultMessage() {
    return 'hideFromDashboard can only be true when canEdit is false';
  }
}

// App-specific permissions.
// canEdit is the single flag that drives view/edit mode:
//   canEdit = true  → internal: can_edit=true,  can_view=false
//   canEdit = false → internal: can_edit=false, can_view=true  (hideFromDashboard is configurable)
export class AppPermissionsDto {
  @IsBoolean()
  @IsNotEmpty()
  canEdit: boolean;

  @IsBoolean()
  @IsOptional()
  @Validate(HideFromDashboardRequiresViewModeConstraint)
  hideFromDashboard?: boolean;

  @IsArray()
  @IsEnum(AppEnvironment, { each: true })
  @IsOptional()
  environments?: AppEnvironment[];
}

// Workflow-specific permissions — same shape as AppPermissionsDto
// canEdit = true  → internal: can_edit=true,  can_view=false
// canEdit = false → internal: can_edit=false, can_view=true  (hideFromDashboard configurable)
export class WorkflowPermissionsDto extends AppPermissionsDto {}

@ValidatorConstraint({ name: 'mutuallyExclusive', async: false })
class MutuallyExclusiveConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as DataSourcePermissionsDto;
    if (obj.canUse === true && obj.canConfigure === true) {
      return false;
    }
    return !(obj.canUse === false && obj.canConfigure === false);
  }

  defaultMessage() {
    return 'canUse and canConfigure are mutually exclusive - exactly one must be true';
  }
}

// Data source-specific permissions
export class DataSourcePermissionsDto {
  @IsBoolean()
  @IsOptional()
  canUse?: boolean;

  @IsBoolean()
  @IsOptional()
  @Validate(MutuallyExclusiveConstraint)
  canConfigure?: boolean;
}

// Custom validator: each entry must be either a valid UUID v4 or a non-empty string name
@ValidatorConstraint({ name: 'uuidOrName', async: false })
class UuidOrNameConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  defaultMessage() {
    return 'each resource must be a valid UUID or a non-empty name string';
  }
}

// Custom validator for resources array based on applyToAll flag
@ValidatorConstraint({ name: 'resourcesValidation', async: false })
class ResourcesValidationConstraint implements ValidatorConstraintInterface {
  validate(resources: string[], args: ValidationArguments) {
    const obj = args.object as GranularPermissionDto;
    if (obj.applyToAll === false && (!resources || resources.length === 0)) {
      return false;
    }
    return !(obj.applyToAll === true && resources && resources.length > 0);
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as GranularPermissionDto;
    if (obj.applyToAll === false) {
      return 'resources must not be empty when applyToAll is false';
    }
    return 'resources must be empty when applyToAll is true';
  }
}

// Granular permission item in the request
export class GranularPermissionDto {
  @IsEnum(GranularPermissionResourceType)
  @IsNotEmpty()
  type: GranularPermissionResourceType;

  @IsBoolean()
  @IsNotEmpty()
  applyToAll: boolean;

  @IsArray()
  @Validate(UuidOrNameConstraint, { each: true })
  @Validate(ResourcesValidationConstraint)
  resources: string[];

  @ValidateNested()
  @Type((opts) => {
    const type = opts?.object?.type;
    if (type === GranularPermissionResourceType.DATA_SOURCE) {
      return DataSourcePermissionsDto;
    }
    if (type === GranularPermissionResourceType.WORKFLOW) {
      return WorkflowPermissionsDto;
    }
    return AppPermissionsDto;
  })
  @IsNotEmpty()
  permissions: AppPermissionsDto | WorkflowPermissionsDto | DataSourcePermissionsDto;
}

// Workspace-level permissions
export class WorkspacePermissionsDto {
  @IsBoolean()
  @IsOptional()
  appCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  appDelete?: boolean;

  @IsBoolean()
  @IsOptional()
  folderCRUD?: boolean;

  @IsBoolean()
  @IsOptional()
  orgConstantCRUD?: boolean;

  @IsBoolean()
  @IsOptional()
  workflowCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  workflowDelete?: boolean;

  @IsBoolean()
  @IsOptional()
  dataSourceCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  dataSourceDelete?: boolean;

  @IsBoolean()
  @IsOptional()
  appPromote?: boolean;

  @IsBoolean()
  @IsOptional()
  appRelease?: boolean;
}

// Main request DTO for creating a group
export class CreateGroupExternalDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @ValidateNested()
  @Type(() => WorkspacePermissionsDto)
  @IsOptional()
  permissions?: WorkspacePermissionsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GranularPermissionDto)
  @IsOptional()
  granularPermissions?: GranularPermissionDto[];
}
