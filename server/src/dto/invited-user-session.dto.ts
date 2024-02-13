import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class InvitedUserSessionDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  accountToken: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  organizationToken: string;
}
