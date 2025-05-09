import { USER_ROLE } from '@modules/group-permissions/constants';
import { IsOptional, IsString, IsArray, IsUUID, IsObject, IsEnum } from 'class-validator';

export class UpdateOrgUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addGroups?: string[];

  @IsOptional()
  @IsEnum(USER_ROLE)
  role?: USER_ROLE;

  @IsOptional()
  @IsObject()
  userMetadata?: Record<string, any>;
}
