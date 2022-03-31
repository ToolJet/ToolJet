import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AppAuthenticationDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  token: string;
}
