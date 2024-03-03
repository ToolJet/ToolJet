import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsObject, IsBoolean } from 'class-validator';

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

export class DuplucateGroupDto {
  @IsBoolean()
  addPermission;

  @IsBoolean()
  addApps;

  @IsBoolean()
  addUsers;
}
