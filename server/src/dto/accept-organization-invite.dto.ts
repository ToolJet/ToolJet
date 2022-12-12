import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
