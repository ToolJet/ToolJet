import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { lowercaseString } from 'src/helpers/utils.helper';
import { Transform } from 'class-transformer';

export class AppAuthenticationDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => lowercaseString(value))
  email: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  token: string;
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
  @MinLength(5)
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
