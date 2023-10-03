import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsObject, IsOptional, IsArray, MaxLength, IsBoolean } from 'class-validator';

export class CreateGroupPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  group: string;
}

export class UpdateGroupPermissionDto {
  @IsObject()
  @IsNotEmpty()
  actions: object;
}

export class UpdateGroupsUsersDto {
  @IsOptional()
  @IsArray()
  add_users: Array<string>;

  @IsOptional()
  @IsArray()
  remove_users: Array<string>;
}

export class UpdateGroupsAppsDto {
  @IsOptional()
  @IsArray()
  add_apps: Array<string>;

  @IsOptional()
  @IsArray()
  remove_apps: Array<string>;
}

export class UpdateGroupsDataSourcesDto {
  @IsOptional()
  @IsArray()
  add_data_sources: Array<string>;

  @IsOptional()
  @IsArray()
  remove_data_sources: Array<string>;
}

export class UpdateGroupDto {
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsBoolean()
  app_create;

  @IsOptional()
  @IsBoolean()
  app_delete;

  @IsOptional()
  @IsBoolean()
  data_source_create;

  @IsOptional()
  @IsBoolean()
  data_source_delete;

  @IsOptional()
  @IsBoolean()
  folder_create;

  @IsOptional()
  @IsBoolean()
  org_environment_variable_create;

  @IsOptional()
  @IsBoolean()
  org_environment_variable_update;

  @IsOptional()
  @IsBoolean()
  org_environment_variable_delete;

  @IsOptional()
  @IsBoolean()
  folder_delete;

  @IsOptional()
  @IsBoolean()
  folder_update;

  @IsOptional()
  @IsBoolean()
  org_environment_constant_create;

  @IsOptional()
  @IsBoolean()
  org_environment_constant_delete;
}
