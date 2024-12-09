import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput } from '../helpers/utils.helper';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';

export class InviteNewUserDto {
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  first_name: string;

  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @IsOptional()
  last_name: string;

  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  email: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  groups: string[];

  @IsString()
  @IsEnum(USER_ROLE)
  role: USER_ROLE;
}
