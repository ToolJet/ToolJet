import {
    IsString,
    IsNotEmpty,
    IsBoolean,
    IsOptional,
    IsArray,
    ValidateNested,
    IsEnum,
    IsUUID,
    ValidateIf,
    ArrayNotEmpty,
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
}

// Custom validator for mutual exclusivity of canView and canEdit
@ValidatorConstraint({ name: 'appPermissionsMutuallyExclusive', async: false })
class AppPermissionsMutuallyExclusiveConstraint implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments) {
        const obj = args.object as AppPermissionsDto;
        if (obj.canView === true && obj.canEdit === true) {
            return false;
        }
        if (obj.canView === false && obj.canEdit === false) {
            return false;
        }
        return true;
    }

    defaultMessage() {
        return 'canView and canEdit are mutually exclusive - exactly one must be true';
    }
}

// Custom validator for hideFromDashboard - can only be true when canView is true
@ValidatorConstraint({ name: 'hideFromDashboardRequiresCanView', async: false })
class HideFromDashboardRequiresCanViewConstraint implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments) {
        const obj = args.object as AppPermissionsDto;
        if (obj.hideFromDashboard === true && obj.canView !== true) {
            return false;
        }
        return true;
    }

    defaultMessage() {
        return 'hideFromDashboard can only be true when canView is true';
    }
}

// App-specific permissions
export class AppPermissionsDto {
    @IsBoolean()
    @IsOptional()
    canView?: boolean;

    @IsBoolean()
    @IsOptional()
    @Validate(AppPermissionsMutuallyExclusiveConstraint)
    canEdit?: boolean;

    @IsBoolean()
    @IsOptional()
    @Validate(HideFromDashboardRequiresCanViewConstraint)
    hideFromDashboard?: boolean;

    @IsArray()
    @IsEnum(AppEnvironment, { each: true })
    @IsOptional()
    environments?: AppEnvironment[];
}

// Custom validator for mutual exclusivity of canUse and canConfigure
@ValidatorConstraint({ name: 'mutuallyExclusive', async: false })
class MutuallyExclusiveConstraint implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments) {
        const obj = args.object as DataSourcePermissionsDto;
        if (obj.canUse === true && obj.canConfigure === true) {
            return false;
        }
        if (obj.canUse === false && obj.canConfigure === false) {
            return false;
        }
        return true;
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

// Custom validator for resources array based on applyToAll flag
@ValidatorConstraint({ name: 'resourcesValidation', async: false })
class ResourcesValidationConstraint implements ValidatorConstraintInterface {
    validate(resources: string[], args: ValidationArguments) {
        const obj = args.object as GranularPermissionDto;        
        if (obj.applyToAll === false && (!resources || resources.length === 0)) {
            return false;
        }        
        if (obj.applyToAll === true && resources && resources.length > 0) {
            return false;
        }        
        return true;
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
    @IsUUID('4', { each: true })
    @Validate(ResourcesValidationConstraint)
    resources: string[];

    @ValidateNested()
    @Type((opts) => {
        const type = opts?.object?.type;
        if (type === GranularPermissionResourceType.DATA_SOURCE) {
            return DataSourcePermissionsDto;
        }
        return AppPermissionsDto;
    })
    @IsNotEmpty()
    permissions: AppPermissionsDto | DataSourcePermissionsDto;
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
