import { User } from '@entities/user.entity';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  allowRoleChange: boolean;
}

export class AddGroupUserDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsBoolean()
  @IsOptional()
  allowRoleChange: boolean;

  @IsOptional()
  @IsArray()
  endUsers?: User[];
}

export class DuplicateGroupDtoBase {
  @IsBoolean()
  addPermission: boolean;

  @IsBoolean()
  addApps: boolean;

  @IsBoolean()
  addUsers: boolean;
}

export class DuplicateGroupDto extends DuplicateGroupDtoBase {
  @IsBoolean()
  addDataSource: boolean;
}
