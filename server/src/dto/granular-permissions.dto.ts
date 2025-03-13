// import { Transform } from 'class-transformer';
// import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';
// import { ResourceType } from '@modules/user_resource_permissions/constants/granular-permissions.constant';
// import {
//   ResourceGroupActions,
//   GranularPermissionAddResourceItems,
//   GranularPermissionDeleteResourceItems,
//   CreateResourcePermissionObject,
// } from '@modules/user_resource_permissions/interface/granular-permissions.interface';

// export class CreateGranularPermissionDto {
//   @IsString()
//   @Transform(({ value }) => value.trim())
//   @IsNotEmpty()
//   name: string;

//   @IsString()
//   @IsNotEmpty()
//   groupId: string;

//   @IsBoolean()
//   @IsNotEmpty()
//   isAll: boolean;

//   @IsEnum(ResourceType)
//   @IsNotEmpty()
//   type: ResourceType;

//   @IsOptional()
//   createResourcePermissionObject: CreateResourcePermissionObject<any>;
// }

// export class UpdateGranularPermissionDto<T extends ResourceType.APP | ResourceType.DATA_SOURCE> {
//   @IsString()
//   @IsOptional()
//   name: string;

//   @IsBoolean()
//   @IsOptional()
//   isAll: boolean;

//   @IsOptional()
//   actions: ResourceGroupActions<T>;

//   @IsOptional()
//   resourcesToAdd: GranularPermissionAddResourceItems<T>;

//   @IsOptional()
//   resourcesToDelete: GranularPermissionDeleteResourceItems;

//   @IsBoolean()
//   @IsOptional()
//   allowRoleChange: boolean;
// }
