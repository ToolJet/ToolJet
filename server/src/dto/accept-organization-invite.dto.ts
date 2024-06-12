import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(5, { message: 'Password should contain more than 5 characters' })
  @MaxLength(100, { message: 'Password should be Max 100 characters' })
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
