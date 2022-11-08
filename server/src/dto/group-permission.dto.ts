import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

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
