import { GroupPermissions } from '@entities/group_permissions.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { IsEnum, IsNotEmpty, IsString, IsOptional, ValidateIf, IsEmail} from 'class-validator';

export class EditUserRoleDto {
  @IsEnum(USER_ROLE)
  @IsNotEmpty()
  newRole: USER_ROLE;

  @ValidateIf((o) => !o.email)
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @ValidateIf((o) => !o.userId)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  updatingUserId?: string;

  @IsOptional()
  currentRole?: GroupPermissions;
}
