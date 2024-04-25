import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateGroupPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  name: string;
}

export class UpdateGroupPermissionDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
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

export class DuplucateGroupDto {
  @IsBoolean()
  addPermission;

  @IsBoolean()
  addApps;

  @IsBoolean()
  addUsers;
}
