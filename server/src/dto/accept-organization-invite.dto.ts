import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
