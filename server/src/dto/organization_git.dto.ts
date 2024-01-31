import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class OrganizationGitCreateDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsNotEmpty()
  gitUrl: string;
}

export class OrganizationGitUpdateDto {
  @IsString()
  @IsOptional()
  gitUrl: string;

  @IsOptional()
  @IsString()
  sshPrivateKey: string;

  @IsOptional()
  @IsString()
  sshPublicKey: string;

  @IsOptional()
  @IsBoolean()
  isFinalized: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled: boolean;
}
