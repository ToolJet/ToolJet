import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 letters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
