import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppAuthenticationDto {
  @IsEmail()
  @IsOptional()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  token: string;
}

export class AppForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class AppPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
