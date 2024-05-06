import { USER_ROLE } from '@module/user_resource_permissions/constants/group-permissions.constant';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class CreateGroupPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;
}

export class UpdateGroupPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  appCreate: boolean;

  @IsBoolean()
  @IsOptional()
  appDelete: boolean;

  @IsBoolean()
  @IsOptional()
  folderCRUD: boolean;

  @IsBoolean()
  @IsOptional()
  orgConstantCRUD: boolean;

  @IsBoolean()
  @IsOptional()
  dataSourceCreate: boolean;

  @IsBoolean()
  @IsOptional()
  dataSourceDelete: boolean;
}

export class EditUserRoleDto {
  @IsEnum(USER_ROLE)
  @IsNotEmpty()
  newRole: USER_ROLE;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class AddGroupUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  groupId: string;
}
