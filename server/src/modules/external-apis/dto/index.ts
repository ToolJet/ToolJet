import {
  IsUUID,
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { USER_ROLE } from '@modules/group-permissions/constants';

export enum Status {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export class GroupDto {
  @IsUUID()
  @ValidateIf((o) => !o.name)
  @IsNotEmpty()
  id?: string;

  @IsString()
  @ValidateIf((o) => !o.id)
  @IsNotEmpty()
  name?: string;
}

export class WorkspaceDto {
  @IsUUID()
  @ValidateIf((o) => !o.name)
  @IsNotEmpty()
  id?: string;

  @IsString()
  @ValidateIf((o) => !o.id)
  @IsNotEmpty()
  name?: string;

  @IsEnum(USER_ROLE)
  @IsOptional()
  role?: USER_ROLE;

  @IsEnum(Status)
  @IsOptional()
  status?: Status = Status.ARCHIVED;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  @IsOptional()
  groups?: GroupDto[];
}

export class UpdateGivenWorkspaceDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  @IsOptional()
  groups?: GroupDto[];
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  password: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status = Status.ARCHIVED;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkspaceDto)
  workspaces: WorkspaceDto[];
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @IsOptional()
  password?: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}

export class UpdateUserWorkspaceDto {
  @IsEnum(Status)
  @IsOptional()
  status?: Status;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupDto)
  @IsOptional()
  groups?: GroupDto[];
}
