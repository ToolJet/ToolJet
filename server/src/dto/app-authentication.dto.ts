import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { lowercaseString } from 'src/helpers/utils.helper';
import { Transform } from 'class-transformer';

export class AppAuthenticationDto {
  @IsEmail()
  @Transform(({ value }) => lowercaseString(value))
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
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
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  password: string;
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
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ChangePasswordDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @MinLength(5)
  newPassword: string;
}
