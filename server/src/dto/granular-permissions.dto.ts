import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { ResourceType } from '@module/user_resource_permissions/constants/granular-permissions.constant';
import {
  ResourceGroupActions,
  GranularPermissionAddResourceItems,
  GranularPermissionDeleteResourceItems,
} from '@module/user_resource_permissions/interface/granular-permissions.interface';

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

  @IsBoolean()
  @IsOptional()
  isAll: boolean;

  @IsOptional()
  actions: ResourceGroupActions;

  @IsOptional()
  resourcesToAdd: GranularPermissionAddResourceItems;

  @IsOptional()
  resourcesToDelete: GranularPermissionDeleteResourceItems;
}
