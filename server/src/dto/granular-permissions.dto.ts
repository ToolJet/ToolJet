import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ResourceType } from '@module/group_permissions/constants/granular-permissions.constant';
import {
  AppsGroupPermissionsActions,
  GranularPermissionResourceItem,
} from '@module/group_permissions/interface/granular-permissions.interface';

export class CreateGranularPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;
}

export class UpdateGranularPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsOptional()
  name: string;

  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;

  @IsBoolean()
  @IsOptional()
  isAll: boolean;

  @IsOptional()
  resourceActions: AppsGroupPermissionsActions;

  @IsOptional()
  resourcesToAdd: GranularPermissionResourceItem[];

  @IsOptional()
  resourcesToDelete: GranularPermissionResourceItem[];
}
