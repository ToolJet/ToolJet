import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import {
  CreateResourcePermissionObject,
  GranularPermissionAddResourceItems,
  GranularPermissionDeleteResourceItems,
  ResourceGroupActions,
} from '../types/granular_permissions';
import { ResourceType } from '../constants';

export class CreateGranularPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isAll: boolean;

  @IsEnum(ResourceType)
  @IsNotEmpty()
  type: ResourceType;

  @IsOptional()
  createResourcePermissionObject: CreateResourcePermissionObject<any>;
}

export class UpdateGranularPermissionDto<T extends ResourceType.APP | ResourceType.DATA_SOURCE> {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isAll: boolean;

  @IsOptional()
  actions: ResourceGroupActions<T>;

  @IsOptional()
  resourcesToAdd: GranularPermissionAddResourceItems<T>;

  @IsOptional()
  resourcesToDelete: GranularPermissionDeleteResourceItems;

  @IsBoolean()
  @IsOptional()
  allowRoleChange: boolean;
}
