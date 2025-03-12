import { IsString, IsOptional, IsNotEmpty, MinLength, IsEmail, IsBoolean, MaxLength } from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { lowercaseString, sanitizeInput } from 'src/helpers/utils.helper';
import { PartialType } from '@nestjs/mapped-types';
import { USER_STATUS, USER_TYPE } from '@modules/users/constants/lifecycle';
import { OrganizationUser } from '@entities/organization_user.entity';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  first_name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  last_name: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  password: string;

  @IsString()
  @IsOptional()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  companyName: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  companySize: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  organizationToken: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  role: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  source: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  buildPurpose: string;
}

export class TelemetryDataDto {
  constructor(obj: any = {}) {
    this.email = obj.email;
    this.name = obj.name;
    this.phoneNumber = obj.phoneNumber;
    this.companyName = obj.companyName;
    this.companySize = obj.companySize;
    this.role = obj.role;
    this.buildPurpose = obj.buildPurpose;
    this.requestedTrial = obj.requestedTrial;
  }
  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  name: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  companyName: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  buildPurpose: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  companySize: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  role: string;

  @IsOptional()
  @IsBoolean()
  requestedTrial: boolean;
}
export class CreateAdminDto extends TelemetryDataDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  password: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  workspace: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  workspaceName: string;
}

export class OnboardUserDto extends CreateUserDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeInput(value))
  @MaxLength(500)
  workspaceName: string;
}

export class UpdateUserTypeDto extends CreateUserDto {
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

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class TrialUserDto extends TelemetryDataDto {}

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
