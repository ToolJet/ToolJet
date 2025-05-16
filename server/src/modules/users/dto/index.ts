import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { sanitizeInput } from 'src/helpers/utils.helper';
import { USER_STATUS, USER_TYPE } from '@modules/users/constants/lifecycle';
import { OrganizationUser } from '@entities/organization_user.entity';

export class UpdateUserTypeDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(100)
  userId: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(100)
  userType: USER_TYPE;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  firstName: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  lastName: string;
}
export class UpdateUserTypeInstanceDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(100)
  userId: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(100)
  userType: USER_TYPE;
}

@Exclude()
export class AllUserResponse {
  @Expose()
  email: string;

  @Expose()
  @Transform(({ obj: user }) => user.firstName ?? '')
  firstName: string;

  @Expose()
  @Transform(({ obj: user }) => user.lastName ?? '')
  lastName?: string;

  @Expose()
  @Transform(({ obj: user }) => `${user.firstName || ''}${user.lastName ? ` ${user.lastName}` : ''}`)
  name: string;

  @Expose()
  id: string;

  @Expose()
  avatarId: string;

  @Expose()
  organizationUsers: OrganizationUser[];

  @Expose()
  @Transform(({ obj: user }) => user.organizationUsers?.length || 0)
  totalOrganizations: number;

  @Expose()
  userType: USER_TYPE;

  @Expose()
  status: USER_STATUS;
}

export class ChangePasswordDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 characters' })
  @MaxLength(100, { message: 'Password should be Max 100 characters' })
  newPassword: string;
}
