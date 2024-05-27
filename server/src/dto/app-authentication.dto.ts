import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { lowercaseString } from 'src/helpers/utils.helper';
import { Transform } from 'class-transformer';

export class AppAuthenticationDto {
  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 characters' })
  @MaxLength(100, { message: 'Password should be Max 100 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  redirectTo: string;
}

export class AppSignupDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 characters' })
  @MaxLength(100, { message: 'Password should be Max 100 characters' })
  password: string;

  @IsOptional()
  @IsUUID()
  organizationId: string;

  @IsString()
  @IsOptional()
  redirectTo: string;
}

export class AppForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => lowercaseString(value))
  email: string;
}

export class AppPasswordResetDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  @MaxLength(100, { message: 'Password should be Max 100 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ChangePasswordDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 characters' })
  @MaxLength(100, { message: 'Password should be Max 100 characters' })
  newPassword: string;
}
