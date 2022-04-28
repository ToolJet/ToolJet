import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateGroupPermissionDto {
  @IsString()
  @IsNotEmpty()
  group: string;
}

export class UpdateGroupPermissionDto {
  @IsObject()
  @IsNotEmpty()
  actions: object;
}
