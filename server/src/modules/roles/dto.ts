import { GroupPermissions } from '@entities/group_permissions.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class EditUserRoleDto {
  @IsEnum(USER_ROLE)
  @IsNotEmpty()
  newRole: USER_ROLE;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  updatingUserId?: string;

  @IsOptional()
  currentRole: GroupPermissions;
}
